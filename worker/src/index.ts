const SITE_ORIGIN = "https://dogoodsleep.com";
const IMAGES_ORIGIN = "https://images.dogoodsleep.com";

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
  headers.set("access-control-allow-origin", SITE_ORIGIN);
  headers.set("cache-control", "no-store, max-age=0");
  headers.set("content-type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
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
  const value = object.customMetadata?.mtime;

  if (!value) {
    return undefined;
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
        "access-control-allow-origin": SITE_ORIGIN,
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
    try {
      return await handleRequest(request, env);
    } catch (error) {
      console.error(JSON.stringify({
        message: "archive API request failed",
        error: error instanceof Error ? error.message : String(error),
        path: new URL(request.url).pathname,
      }));
      return json({ error: "Internal server error" }, { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
