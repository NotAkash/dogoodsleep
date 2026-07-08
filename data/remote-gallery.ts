export type GalleryImage = {
  src: string;
  alt: string;
};

type ImagesResponse = {
  images?: GalleryImage[];
};

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

export async function getGalleryImages(
  baseUrl: string,
  limit = 10,
): Promise<GalleryImage[]> {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");

  if (!normalizedBaseUrl) {
    throw new Error("Missing IMAGES_API_URL");
  }

  const url = new URL(`${normalizedBaseUrl}/images`);
  url.searchParams.set("limit", "48");
  url.searchParams.set("refresh", crypto.randomUUID());

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Image worker request failed: ${response.status}`);
  }

  const data = (await response.json()) as ImagesResponse;
  return shuffle(data.images ?? []).slice(0, limit);
}

export function normalizeGalleryBaseUrl(baseUrl: string | undefined): string {
  return baseUrl?.replace(/\/+$/, "") ?? "";
}
