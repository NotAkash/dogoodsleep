export type GalleryImage = {
  id: string;
  src: string;
  alt: string;
};

export type ArchiveFolder = {
  id: string;
  label: string;
  children: ArchiveFolder[];
  imageCount: number;
};

export type GalleryPage = {
  images: GalleryImage[];
  page: number;
  total: number;
  totalPages: number;
  hasPaginationMeta: boolean;
  folders: ArchiveFolder[];
};

export type GalleryPageRequest = number | "last";

export type HomePreviewFrame = {
  image: GalleryImage;
  frameNumber: number;
};

export type HomeGalleryPreview = {
  frames: HomePreviewFrame[];
  total: number;
  hasPaginationMeta: boolean;
};

type ImagesResponse = {
  images?: Array<Partial<GalleryImage> & { src?: string; alt?: string }>;
  page?: number;
  total?: number;
  totalPages?: number;
  folders?: unknown;
};

function normalizeFolders(value: unknown): ArchiveFolder[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const folder = item as Record<string, unknown>;
    const id = typeof folder.id === "string" ? folder.id.trim() : "";
    const label = typeof folder.label === "string" ? folder.label.trim() : "";

    if (!id || !label) {
      return [];
    }

    return [{
      id,
      label,
      children: normalizeFolders(folder.children),
      imageCount:
        typeof folder.imageCount === "number" && folder.imageCount >= 0
          ? Math.floor(folder.imageCount)
          : 0,
    }];
  });
}

export async function getGalleryImages(
  baseUrl: string,
  page: GalleryPageRequest = 1,
  limit = 20,
  folder?: string,
): Promise<GalleryPage> {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");

  if (!normalizedBaseUrl) {
    throw new Error("Missing IMAGES_API_URL");
  }

  const url = new URL(`${normalizedBaseUrl}/images`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  if (folder) {
    url.searchParams.set("folder", folder);
  }
  url.searchParams.set("refresh", crypto.randomUUID());

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Image worker request failed: ${response.status}`);
  }

  const data = (await response.json()) as ImagesResponse;
  const images = (data.images ?? []).flatMap((image) => {
    const src = image.src?.trim();

    if (!src) {
      return [];
    }

    return [
      {
        id: image.id?.trim() || src,
        src,
        alt: image.alt?.trim() || "Gallery image",
      },
    ];
  });
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
    folders: normalizeFolders(data.folders),
  };
}

function sampleFrameNumbers(
  maximumFrame: number,
  count: number,
  random: () => number,
): number[] {
  const available = Array.from(
    { length: Math.max(0, maximumFrame) },
    (_, index) => index + 1,
  );
  const selected: number[] = [];

  while (selected.length < count && available.length > 0) {
    const randomIndex = Math.min(
      available.length - 1,
      Math.floor(Math.max(0, random()) * available.length),
    );
    selected.push(available.splice(randomIndex, 1)[0]);
  }

  return selected;
}

export async function getHomeGalleryPreview(
  baseUrl: string,
  random: () => number = Math.random,
): Promise<HomeGalleryPreview> {
  const latestPage = await getGalleryImages(baseUrl, 1, 1);
  const latestImage = latestPage.images[0];

  if (!latestImage) {
    return {
      frames: [],
      total: latestPage.total,
      hasPaginationMeta: latestPage.hasPaginationMeta,
    };
  }

  if (!latestPage.hasPaginationMeta) {
    return {
      frames: [{ image: latestImage, frameNumber: 1 }],
      total: 1,
      hasPaginationMeta: false,
    };
  }

  const total = latestPage.total;
  const randomFrameNumbers = sampleFrameNumbers(total - 1, 2, random);
  const randomPages = await Promise.all(
    randomFrameNumbers.map((frameNumber) => (
      getGalleryImages(baseUrl, total - frameNumber + 1, 1)
    )),
  );
  const randomFrames = randomPages.flatMap((page, index) => {
    const image = page.images[0];

    return image
      ? [{ image, frameNumber: randomFrameNumbers[index] }]
      : [];
  });

  return {
    frames: [
      { image: latestImage, frameNumber: total },
      ...randomFrames,
    ],
    total,
    hasPaginationMeta: true,
  };
}

export function normalizeGalleryBaseUrl(baseUrl: string | undefined): string {
  return baseUrl?.replace(/\/+$/, "") ?? "";
}
