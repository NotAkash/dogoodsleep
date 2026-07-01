export interface Env {
  THUMBS_BUCKET: R2Bucket;
  CLOUDFLARE_PUBLIC_DEVELOPMENT_URL: string;
  CLOUDFLARE_PUBLIC_DEVELOPMENT_URL_THUMBS: string;
}

type ImageItem = {
  key: string;
  thumbUrl: string;
  fullUrl: string;
  alt: string;
};

function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      ...init?.headers,
    },
  });
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function toImage(
  key: string,
  thumbsBaseUrl: string,
  fullBaseUrl: string
): ImageItem {
  const fullKey = key.replace(/\.webp$/i, ".jpg");

  return {
    key,
    thumbUrl: `${thumbsBaseUrl}/${encodeURI(key)}`,
    fullUrl: `${fullBaseUrl}/${encodeURI(fullKey)}`,
    alt: key.split("/").pop() ?? key,
  };
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET,OPTIONS",
          "access-control-allow-headers": "content-type",
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

    const limitParam = Number(url.searchParams.get("limit") ?? "12");
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 48)) : 12;

    const thumbsBaseUrl = normalizeBaseUrl(env.CLOUDFLARE_PUBLIC_DEVELOPMENT_URL_THUMBS);
    const fullBaseUrl = normalizeBaseUrl(env.CLOUDFLARE_PUBLIC_DEVELOPMENT_URL);

    const keys: string[] = [];
    let cursor: string | undefined;

    do {
      const listed = await env.THUMBS_BUCKET.list({
        cursor,
        limit: 1000,
      });

      for (const obj of listed.objects) {
        if (!obj.key.endsWith("/")) {
          keys.push(obj.key);
        }
      }

      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);

    const images = shuffle(keys)
      .slice(0, limit)
      .map((key) => toImage(key, thumbsBaseUrl, fullBaseUrl));

    return json({ images, count: images.length });
  },
};
