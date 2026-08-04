export interface Env {
  THUMBS_BUCKET: R2Bucket;
  THUMBS_PUBLIC_URL: string;
}

type GalleryImage = {
  id: string;
  src: string;
  alt: string;
};

type ListedObject = {
  key: string;
};

type ListedObjectsResponse = {
  objects: ListedObject[];
  truncated?: boolean;
  cursor?: string;
};

function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers: {
      "access-control-allow-origin": "*",
      "cache-control": "no-store, max-age=0",
      "content-type": "application/json; charset=utf-8",
      ...init?.headers,
    },
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

async function listAllObjects(bucket: R2Bucket): Promise<ListedObject[]> {
  const objects: ListedObject[] = [];
  let cursor: string | undefined;

  do {
    const listed = (await bucket.list({
      limit: 1000,
      cursor,
    })) as ListedObjectsResponse;

    objects.push(...listed.objects);
    cursor = listed.truncated && listed.cursor ? listed.cursor : undefined;
  } while (cursor);

  return objects;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-headers": "content-type",
          "access-control-allow-methods": "GET,OPTIONS",
          "access-control-allow-origin": "*",
        },
      });
    }

    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, { status: 405 });
    }

    if (url.pathname === "/health") {
      return json({ ok: true });
    }

    if (url.pathname !== "/images") {
      return json({ error: "Not found" }, { status: 404 });
    }

    const limitParam = Number(url.searchParams.get("limit") ?? "20");
    const requestedPage = url.searchParams.get("page") ?? "1";
    const pageParam = Number(requestedPage);
    const limit = Number.isFinite(limitParam)
      ? Math.max(1, Math.min(limitParam, 48))
      : 20;
    const publicUrl = env.THUMBS_PUBLIC_URL.replace(/\/+$/, "");

    const listed = await listAllObjects(env.THUMBS_BUCKET);
    const orderedObjects = listed
      .filter((object) => !object.key.endsWith("/"))
      .sort((left, right) => left.key.localeCompare(right.key));
    const total = orderedObjects.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = requestedPage === "last"
      ? totalPages
      : Number.isFinite(pageParam)
        ? Math.max(1, pageParam)
        : 1;
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * limit;
    const images: GalleryImage[] = orderedObjects
      .slice(startIndex, startIndex + limit)
      .map((object) => ({
        id: object.key,
        src: `${publicUrl}/${encodeURI(object.key)}`,
        alt: toAlt(object.key),
      }));

    return json({ images, page: safePage, total, totalPages });
  },
};
