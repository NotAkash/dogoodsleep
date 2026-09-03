import type { GalleryImage } from "@/data/remote-gallery";

export const CRITICAL_GALLERY_IMAGE_COUNT = 4;

type PreloadImage = {
  complete: boolean;
  decoding: string;
  decode?: () => Promise<void>;
  fetchPriority: string;
  naturalWidth: number;
  onerror: GlobalEventHandlers["onerror"];
  onload: GlobalEventHandlers["onload"];
  src: string;
};

type PrepareGalleryImagesOptions = {
  columnCount: number;
  createImage?: () => PreloadImage;
  signal: AbortSignal;
  timeoutMs?: number;
};

function imageHeightRatio(image: GalleryImage): number {
  return image.width && image.height
    ? image.height / image.width
    : 2 / 3;
}

export function criticalGalleryImageIndexes(
  images: GalleryImage[],
  requestedColumnCount: number,
  limit = CRITICAL_GALLERY_IMAGE_COUNT,
): number[] {
  if (images.length === 0 || limit <= 0) {
    return [];
  }

  const columnCount = Math.max(
    1,
    Math.min(images.length, Math.floor(requestedColumnCount) || 1),
  );
  const ratios = images.map(imageHeightRatio);
  const starts = [0];
  let start = 0;
  let remainingHeight = ratios.reduce((sum, ratio) => sum + ratio, 0);

  for (let column = 1; column < columnCount; column += 1) {
    const remainingColumns = columnCount - column + 1;
    const targetHeight = remainingHeight / remainingColumns;
    const lastBreak = images.length - (columnCount - column);
    let accumulatedHeight = 0;
    let bestBreak = start + 1;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let index = start; index < lastBreak; index += 1) {
      accumulatedHeight += ratios[index];
      const distance = Math.abs(accumulatedHeight - targetHeight);

      if (distance <= bestDistance) {
        bestDistance = distance;
        bestBreak = index + 1;
      } else if (accumulatedHeight > targetHeight) {
        break;
      }
    }

    starts.push(bestBreak);
    remainingHeight -= ratios
      .slice(start, bestBreak)
      .reduce((sum, ratio) => sum + ratio, 0);
    start = bestBreak;
  }

  const candidates = [
    ...starts,
    ...starts.map((index) => index + 1),
    ...images.map((_, index) => index),
  ];

  return [...new Set(candidates)]
    .filter((index) => index < images.length)
    .slice(0, limit);
}

async function prepareImage(
  src: string,
  signal: AbortSignal,
  createImage: () => PreloadImage,
  timeoutMs: number,
): Promise<void> {
  if (signal.aborted) {
    return;
  }

  const image = createImage();
  image.decoding = "async";
  image.fetchPriority = "high";

  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = async (decodeImage: boolean) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      signal.removeEventListener("abort", abort);
      image.onload = null;
      image.onerror = null;

      if (decodeImage && !signal.aborted && image.naturalWidth > 0 && image.decode) {
        await Promise.race([
          image.decode().catch(() => undefined),
          new Promise<void>((decodeDone) => setTimeout(decodeDone, 1_000)),
        ]);
      }

      resolve();
    };
    const abort = () => {
      image.onload = null;
      image.onerror = null;
      image.src = "";
      void finish(false);
    };
    const timeout = setTimeout(() => void finish(false), timeoutMs);

    signal.addEventListener("abort", abort, { once: true });
    image.onload = () => void finish(true);
    image.onerror = () => void finish(false);
    image.src = src;

    if (image.complete) {
      queueMicrotask(() => void finish(image.naturalWidth > 0));
    }
  });
}

export async function prepareCriticalGalleryImages(
  images: GalleryImage[],
  {
    columnCount,
    createImage = () => new Image(),
    signal,
    timeoutMs = 8_000,
  }: PrepareGalleryImagesOptions,
): Promise<Set<string>> {
  const criticalImages = criticalGalleryImageIndexes(images, columnCount)
    .map((index) => images[index]);

  await Promise.all(
    criticalImages.map((image) => (
      prepareImage(image.src, signal, createImage, timeoutMs)
    )),
  );

  return new Set(criticalImages.map((image) => image.id));
}
