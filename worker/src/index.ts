const SITE_ORIGIN = "https://dogoodsleep.com";
const IMAGES_ORIGIN = "https://images.dogoodsleep.com";
const LETTERBOXD_ORIGIN = "https://letterboxd.com";
const STORYGRAPH_ORIGIN = "https://app.thestorygraph.com";
const SITE_PREVIEW_ORIGIN = /^https:\/\/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?-dogoodsleep\.dogoodsleep\.workers\.dev$/;
const ACTIVITY_CACHE_TTL_SECONDS = 30 * 60;
const ACTIVITY_CACHE_VERSION = "2";
const MAX_RSS_BYTES = 512 * 1024;

type GalleryImage = {
  id: string;
  src: string;
  alt: string;
};

type ArchiveFolder = {
  id: string;
  label: string;
  children: ArchiveFolder[];
  imageCount: number;
};

type MutableArchiveFolder = ArchiveFolder & {
  childFolders: Map<string, MutableArchiveFolder>;
};

function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  if (!headers.has("cache-control")) {
    headers.set("cache-control", "no-store, max-age=0");
  }
  headers.set("content-type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
}

function allowedRequestOrigin(request: Request): string | undefined {
  const origin = request.headers.get("origin")?.trim();

  return origin === SITE_ORIGIN || (origin && SITE_PREVIEW_ORIGIN.test(origin))
    ? origin
    : undefined;
}

function withCors(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);
  const origin = allowedRequestOrigin(request);

  headers.delete("access-control-allow-origin");
  if (origin) {
    headers.set("access-control-allow-origin", origin);
  }
  headers.append("vary", "Origin");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

type DiaryEntry = {
  title: string;
  url: string;
  year?: string;
  rating?: number;
  posterUrl?: string;
};

type LatestActivity = {
  reading: {
    profileUrl: string;
  };
  watching: {
    profileUrl: string;
    title?: string;
    url?: string;
    entries?: DiaryEntry[];
  };
};

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function configuredUrl(value: string, fallback: string): string {
  const candidate = value.trim();
  return isHttpsUrl(candidate) ? candidate : fallback;
}

function letterboxdProfileUrl(rssUrl: string): string {
  try {
    const url = new URL(rssUrl);
    const [username, feed] = url.pathname.split("/").filter(Boolean);

    if (
      (url.hostname === "letterboxd.com" || url.hostname === "www.letterboxd.com")
      && username
      && feed === "rss"
    ) {
      return new URL(`/${encodeURIComponent(username)}/`, LETTERBOXD_ORIGIN).toString();
    }
  } catch {
    // Fall through to the generic public profile page.
  }

  return `${LETTERBOXD_ORIGIN}/`;
}

function rssItemRawValue(item: string, tagName: string): string | undefined {
  const expression = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = item.match(expression);

  return match?.[1].trim() || undefined;
}

function rssItemValue(item: string, tagName: string): string | undefined {
  const value = rssItemRawValue(item, tagName);
  return value ? decodeXml(value).trim() || undefined : undefined;
}

function decodeXml(value: string): string {
  return decodeXmlEntities(value)
    .replace(/<[^>]+>/g, "");
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, hexadecimal: string) => {
      const codePoint = Number.parseInt(hexadecimal, 16);
      return isUnicodeCodePoint(codePoint) ? String.fromCodePoint(codePoint) : "";
    })
    .replace(/&#(\d+);/g, (_, decimal: string) => {
      const codePoint = Number.parseInt(decimal, 10);
      return isUnicodeCodePoint(codePoint) ? String.fromCodePoint(codePoint) : "";
    })
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#039;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

function isUnicodeCodePoint(value: number): boolean {
  return Number.isInteger(value)
    && value >= 0
    && value <= 0x10FFFF
    && (value < 0xD800 || value > 0xDFFF);
}

function isLetterboxdUrl(value: string | undefined): value is string {
  if (!value || !isHttpsUrl(value)) {
    return false;
  }

  const url = new URL(value);
  return url.hostname === "letterboxd.com" || url.hostname === "www.letterboxd.com";
}

function isLetterboxdPosterUrl(value: string | undefined): value is string {
  if (!value || !isHttpsUrl(value)) {
    return false;
  }

  const url = new URL(value);
  return url.hostname === "a.ltrbxd.com" && url.pathname.startsWith("/resized/");
}

async function readTextAtMost(response: Response, maximumBytes: number): Promise<string> {
  const declaredLength = Number(response.headers.get("content-length"));

  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    throw new Error("Letterboxd RSS response exceeded the maximum size");
  }

  if (!response.body) {
    return "";
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      totalBytes += value.byteLength;
      if (totalBytes > maximumBytes) {
        await reader.cancel();
        throw new Error("Letterboxd RSS response exceeded the maximum size");
      }

      chunks.push(decoder.decode(value, { stream: true }));
    }

    chunks.push(decoder.decode());
    return chunks.join("");
  } finally {
    reader.releaseLock();
  }
}

function diaryEntry(item: string): DiaryEntry | undefined {
  const title = rssItemValue(item, "letterboxd:filmTitle") ?? rssItemValue(item, "title");
  const url = rssItemValue(item, "link");

  if (!title || !isLetterboxdUrl(url)) {
    return undefined;
  }

  const year = rssItemValue(item, "letterboxd:filmYear");
  const ratingValue = rssItemValue(item, "letterboxd:memberRating");
  const rating = ratingValue === undefined ? undefined : Number(ratingValue);
  const description = rssItemRawValue(item, "description");
  const posterValue = description?.match(/<img\b[^>]*\bsrc\s*=\s*(["'])([\s\S]*?)\1/i)?.[2];
  const posterUrl = posterValue ? decodeXmlEntities(posterValue).trim() : undefined;

  return {
    title,
    url,
    ...(year && /^\d{4}$/.test(year) ? { year } : {}),
    ...(rating !== undefined && Number.isFinite(rating) && rating >= 0 && rating <= 5
      ? { rating }
      : {}),
    ...(isLetterboxdPosterUrl(posterUrl) ? { posterUrl } : {}),
  };
}

function latestDiaryEntries(rss: string): DiaryEntry[] {
  const entries: DiaryEntry[] = [];

  for (const match of rss.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const entry = diaryEntry(match[1]);
    if (entry) {
      entries.push(entry);
    }

    if (entries.length === 3) {
      break;
    }
  }

  return entries;
}

async function latestActivity(env: Env): Promise<LatestActivity> {
  const rssUrl = env.LETTERBOXD_RSS_URL.trim();
  const fallback: LatestActivity = {
    reading: {
      profileUrl: configuredUrl(env.STORYGRAPH_PROFILE_URL, `${STORYGRAPH_ORIGIN}/`),
    },
    watching: {
      profileUrl: letterboxdProfileUrl(rssUrl),
    },
  };

  if (!isLetterboxdUrl(rssUrl) || !new URL(rssUrl).pathname.endsWith("/rss/")) {
    return fallback;
  }

  const response = await fetch(rssUrl, {
    headers: { accept: "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8" },
  });

  if (!response.ok) {
    throw new Error(`Letterboxd RSS request failed: ${response.status}`);
  }

  const entries = latestDiaryEntries(await readTextAtMost(response, MAX_RSS_BYTES));
  const latest = entries[0];

  return latest
    ? {
        ...fallback,
        watching: {
          ...fallback.watching,
          title: latest.title,
          url: latest.url,
          entries,
        },
      }
    : fallback;
}

async function handleActivity(request: Request, env: Env): Promise<Response> {
  const cache = typeof caches === "undefined" ? undefined : caches.default;
  const cacheKey = new Request(
    `${new URL(request.url).origin}/activity?cache-version=${ACTIVITY_CACHE_VERSION}`,
  );

  if (cache) {
    const cached = await cache.match(cacheKey);
    if (cached) {
      return cached;
    }
  }

  let activity: LatestActivity;
  try {
    activity = await latestActivity(env);
  } catch (error) {
    console.error(JSON.stringify({
      message: "Letterboxd activity request failed",
      error: error instanceof Error ? error.message : String(error),
    }));
    activity = {
      reading: {
        profileUrl: configuredUrl(env.STORYGRAPH_PROFILE_URL, `${STORYGRAPH_ORIGIN}/`),
      },
      watching: {
        profileUrl: letterboxdProfileUrl(env.LETTERBOXD_RSS_URL),
      },
    };
  }

  const response = json(activity, {
    headers: { "cache-control": `public, max-age=${ACTIVITY_CACHE_TTL_SECONDS}` },
  });

  if (cache) {
    try {
      await cache.put(cacheKey, response.clone());
    } catch (error) {
      console.warn(JSON.stringify({
        message: "Unable to cache Letterboxd activity",
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  return response;
}

function toAlt(key: string): string {
  return key
    .split("/")
    .pop()
    ?.replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim() || "Gallery image";
}

function encodePathSegment(segment: string): string {
  if (segment === ".") {
    return "%2E";
  }

  if (segment === "..") {
    return "%2E%2E";
  }

  return encodeURIComponent(segment);
}

function imageUrl(key: string): string {
  const encodedKey = key.split("/").map(encodePathSegment).join("/");
  return `${IMAGES_ORIGIN}/${encodedKey}`;
}

async function listAllObjects(bucket: R2Bucket): Promise<R2Object[]> {
  const objects: R2Object[] = [];
  let cursor: string | undefined;

  do {
    const listed = await bucket.list({
      limit: 1000,
      cursor,
      include: ["customMetadata"],
    });

    objects.push(...listed.objects);
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);

  return objects;
}

function positiveInteger(value: string | null, fallback: number): number {
  if (value === null || value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : fallback;
}

function compareKeys(left: string, right: string): number {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

function mtime(object: R2Object): number | undefined {
  const value = object.customMetadata?.mtime?.trim();

  if (!value) {
    return undefined;
  }

  const numeric = Number(value);

  if (Number.isFinite(numeric)) {
    // R2's Workers binding exposes rclone's mtime metadata as Unix seconds,
    // including fractional seconds, even though S3 clients render it as ISO.
    const milliseconds = Math.abs(numeric) < 100_000_000_000
      ? numeric * 1000
      : numeric;

    return Number.isNaN(new Date(milliseconds).getTime())
      ? undefined
      : milliseconds;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function compareNewestFirst(left: R2Object, right: R2Object): number {
  const leftMtime = mtime(left);
  const rightMtime = mtime(right);

  if (leftMtime !== undefined && rightMtime !== undefined) {
    const chronologicalOrder = rightMtime - leftMtime;
    return chronologicalOrder || compareKeys(left.key, right.key);
  }

  if (leftMtime !== undefined) {
    return -1;
  }

  if (rightMtime !== undefined) {
    return 1;
  }

  return compareKeys(left.key, right.key);
}

function folderPathForKey(key: string): string | undefined {
  const separatorIndex = key.lastIndexOf("/");
  return separatorIndex === -1 ? undefined : key.slice(0, separatorIndex);
}

function buildFolderTree(objects: R2Object[]): ArchiveFolder[] {
  const roots = new Map<string, MutableArchiveFolder>();

  for (const object of objects) {
    const folderPath = folderPathForKey(object.key);

    if (!folderPath) {
      continue;
    }

    const segments = folderPath.split("/");
    let children = roots;
    let fullPath = "";

    for (const segment of segments) {
      fullPath = fullPath ? `${fullPath}/${segment}` : segment;
      let folder = children.get(segment);

      if (!folder) {
        folder = {
          id: fullPath,
          label: segment,
          children: [],
          imageCount: 0,
          childFolders: new Map(),
        };
        children.set(segment, folder);
      }

      folder.imageCount += 1;

      children = folder.childFolders;
    }
  }

  function finalize(folders: Map<string, MutableArchiveFolder>): ArchiveFolder[] {
    return [...folders.values()]
      .sort((left, right) => compareKeys(left.id, right.id))
      .map((folder) => ({
        id: folder.id,
        label: folder.label,
        children: finalize(folder.childFolders),
        imageCount: folder.imageCount,
      }));
  }

  return finalize(roots);
}

type FolderFilter =
  | { kind: "none" }
  | { kind: "valid"; path: string }
  | { kind: "invalid" };

function folderFilter(searchParams: URLSearchParams): FolderFilter {
  if (!searchParams.has("folder")) {
    return { kind: "none" };
  }

  const values = searchParams.getAll("folder");

  if (values.length !== 1) {
    return { kind: "invalid" };
  }

  const path = values[0];
  const segments = path.split("/");
  const malformed = path.length === 0
    || path !== path.trim()
    || segments.some((segment) => (
      segment.length === 0
      || segment === "."
      || segment === ".."
      || segment.includes("\\")
      || /[\u0000-\u001f\u007f]/.test(segment)
    ));

  return malformed ? { kind: "invalid" } : { kind: "valid", path };
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-headers": "content-type",
        "access-control-allow-methods": "GET,OPTIONS",
        "access-control-max-age": "86400",
      },
    });
  }

  if (request.method !== "GET") {
    return json(
      { error: "Method not allowed" },
      { status: 405, headers: { allow: "GET, OPTIONS" } },
    );
  }

  if (url.pathname === "/health") {
    return json({ ok: true });
  }

  if (url.pathname === "/activity") {
    return handleActivity(request, env);
  }

  if (url.pathname !== "/images") {
    return json({ error: "Not found" }, { status: 404 });
  }

  const limit = Math.min(positiveInteger(url.searchParams.get("limit"), 20), 48);
  const requestedPage = url.searchParams.get("page") ?? "1";
  const listed = await listAllObjects(env.ARCHIVE_BUCKET);
  const imageObjects = listed.filter((object) => !object.key.endsWith("/"));
  const folders = buildFolderTree(imageObjects);
  const filter = folderFilter(url.searchParams);

  if (filter.kind === "invalid") {
    return json({ error: "Invalid folder path" }, { status: 400 });
  }

  if (filter.kind === "valid") {
    const knownFolders = new Set<string>();
    const collectFolderIds = (items: ArchiveFolder[]): void => {
      for (const folder of items) {
        knownFolders.add(folder.id);
        collectFolderIds(folder.children);
      }
    };
    collectFolderIds(folders);

    if (!knownFolders.has(filter.path)) {
      return json({ error: "Folder not found" }, { status: 404 });
    }
  }

  const orderedObjects = imageObjects
    .filter((object) => (
      filter.kind === "none"
      || folderPathForKey(object.key) === filter.path
      || folderPathForKey(object.key)?.startsWith(`${filter.path}/`)
    ))
    .sort(compareNewestFirst);
  const total = orderedObjects.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = requestedPage === "last"
    ? totalPages
    : positiveInteger(requestedPage, 1);
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * limit;
  const images: GalleryImage[] = orderedObjects
    .slice(startIndex, startIndex + limit)
    .map((object) => ({
      id: object.key,
      src: imageUrl(object.key),
      alt: toAlt(object.key),
    }));

  return json({ images, page: safePage, total, totalPages, folders });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    let response: Response;

    try {
      response = await handleRequest(request, env);
    } catch (error) {
      console.error(JSON.stringify({
        message: "archive API request failed",
        error: error instanceof Error ? error.message : String(error),
        path: new URL(request.url).pathname,
      }));
      response = json({ error: "Internal server error" }, { status: 500 });
    }

    return withCors(response, request);
  },
} satisfies ExportedHandler<Env>;
