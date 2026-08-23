const SITE_ORIGIN = "https://dogoodsleep.com";
const IMAGES_ORIGIN = "https://images.dogoodsleep.com";

type GalleryImage = {
  id: string;
  src: string;
  alt: string;
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
  const orderedObjects = listed
    .filter((object) => !object.key.endsWith("/"))
    .sort((left, right) => left.key.localeCompare(right.key));
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

  return json({ images, page: safePage, total, totalPages });
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
