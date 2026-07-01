export interface Env {
  THUMBS_BUCKET: R2Bucket;
  THUMBS_PUBLIC_URL: string;
}

type GalleryImage = {
  src: string;
  alt: string;
};

function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers: {
      "access-control-allow-origin": "*",
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

    const limitParam = Number(url.searchParams.get("limit") ?? "6");
    const limit = Number.isFinite(limitParam)
      ? Math.max(1, Math.min(limitParam, 48))
      : 6;
    const publicUrl = env.THUMBS_PUBLIC_URL.replace(/\/+$/, "");

    const listed = await env.THUMBS_BUCKET.list({ limit });
    const images: GalleryImage[] = listed.objects
      .filter((object) => !object.key.endsWith("/"))
      .slice(0, limit)
      .map((object) => ({
        src: `${publicUrl}/${encodeURI(object.key)}`,
        alt: toAlt(object.key),
      }));

    return json({ images });
  },
};
