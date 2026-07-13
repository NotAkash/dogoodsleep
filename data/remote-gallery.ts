export type GalleryImage = {
  id: string;
  src: string;
  alt: string;
};

export type GalleryPage = {
  images: GalleryImage[];
  page: number;
  total: number;
  totalPages: number;
  hasPaginationMeta: boolean;
};

export type GalleryPageRequest = number | "last";

type ImagesResponse = {
  images?: Array<Partial<GalleryImage> & { src?: string; alt?: string }>;
  page?: number;
  total?: number;
  totalPages?: number;
};

export async function getGalleryImages(
  baseUrl: string,
  page: GalleryPageRequest = 1,
  limit = 20,
): Promise<GalleryPage> {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");

  if (!normalizedBaseUrl) {
    throw new Error("Missing IMAGES_API_URL");
  }

  const url = new URL(`${normalizedBaseUrl}/images`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("refresh", crypto.randomUUID());

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Image worker request failed: ${response.status}`);
  }

  const data = (await response.json()) as ImagesResponse;
  const images = (data.images ?? []).map((image, index) => ({
    id: image.id ?? image.src ?? `image-${String(page)}-${index}`,
    src: image.src ?? "",
    alt: image.alt ?? "Gallery image",
  }));
  const hasPaginationMeta =
    typeof data.page === "number" &&
    typeof data.total === "number" &&
    typeof data.totalPages === "number";
  const fallbackPage = typeof page === "number" ? page : 1;

  return {
    images,
    page: data.page ?? fallbackPage,
    total: data.total ?? images.length,
    totalPages: data.totalPages ?? 1,
    hasPaginationMeta,
  };
}

export function normalizeGalleryBaseUrl(baseUrl: string | undefined): string {
  return baseUrl?.replace(/\/+$/, "") ?? "";
}
