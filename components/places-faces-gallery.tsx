"use client";

import { useEffect, useState } from "react";
import { getGalleryImages, type GalleryImage } from "@/data/remote-gallery";

type PlacesFacesGalleryProps = {
  imageApiUrl: string;
};

const IMAGES_PER_PAGE = 20;

export function PlacesFacesGallery({
  imageApiUrl,
}: PlacesFacesGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPaginationMeta, setHasPaginationMeta] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadImages() {
      try {
        setLoading(true);
        setError(null);

        const nextPage = await getGalleryImages(imageApiUrl, page, IMAGES_PER_PAGE);

        if (isMounted) {
          setImages(nextPage.images);
          setPage(nextPage.page);
          setTotal(nextPage.total);
          setTotalPages(nextPage.totalPages);
          setHasPaginationMeta(nextPage.hasPaginationMeta);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load gallery images",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadImages();

    return () => {
      isMounted = false;
    };
  }, [imageApiUrl, page]);

  useEffect(() => {
    if (activeIndex === null) {
      document.body.style.overflow = "";
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveIndex(null);
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((currentIndex) => {
          if (currentIndex === null) {
            return currentIndex;
          }

          return (currentIndex + 1) % images.length;
        });
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((currentIndex) => {
          if (currentIndex === null) {
            return currentIndex;
          }

          return (currentIndex - 1 + images.length) % images.length;
        });
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, images.length]);

  useEffect(() => {
    if (activeIndex === null || images.length < 2) {
      return;
    }

    const nextIndex = (activeIndex + 1) % images.length;
    const previousIndex = (activeIndex - 1 + images.length) % images.length;

    [images[nextIndex], images[previousIndex]].forEach((image) => {
      const preload = new Image();
      preload.src = image.src;
    });
  }, [activeIndex, images]);

  useEffect(() => {
    setActiveIndex(null);
  }, [page]);

  const activeImage = activeIndex === null ? null : images[activeIndex];
  const pageStart = total === 0 ? 0 : (page - 1) * IMAGES_PER_PAGE + 1;
  const pageEnd = total === 0 ? 0 : Math.min(page * IMAGES_PER_PAGE, total);
  const placeholders = Array.from({ length: IMAGES_PER_PAGE }, (_, index) => index);
  const countLabel = hasPaginationMeta ? `${total} total frames` : `${images.length} loaded frames`;
  const pageLabel = hasPaginationMeta
    ? `${pageStart}-${pageEnd} on page ${page} of ${totalPages}`
    : `${images.length} images in current set`;

  const handlePrevious = () => {
    setActiveIndex((currentIndex) => {
      if (currentIndex === null) {
        return currentIndex;
      }

      return (currentIndex - 1 + images.length) % images.length;
    });
  };

  const handleNext = () => {
    setActiveIndex((currentIndex) => {
      if (currentIndex === null) {
        return currentIndex;
      }

      return (currentIndex + 1) % images.length;
    });
  };

  const getImageKey = (image: GalleryImage, index: number) =>
    `${page}-${image.id}-${index}`;

  return (
    <section className="w-full">
      <div className="mb-10 flex flex-col gap-5 border-b border-white/10 pb-8 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.34em] text-white/45">
            Places & Faces
          </p>
          <h2 className="mt-4 text-3xl font-medium tracking-[-0.03em] text-white sm:text-4xl">
            A quieter archive, twenty frames at a time.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/60 sm:text-base">
            The gallery now moves in pages instead of a long wall, so each set
            has a little more room to breathe.
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/35">
            {loading ? "Loading page" : countLabel}
          </p>
          <p className="mt-2 text-xs text-white/40">
            {loading ? "..." : pageLabel}
          </p>
        </div>
      </div>

      {error ? (
        <div className="border border-white/10 bg-white/[0.04] p-6 text-sm text-white/70">
          {error}
        </div>
      ) : null}

      {!error ? (
        <>
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/38">
              Page {String(page).padStart(2, "0")}
            </p>
            <p className="text-xs text-white/32">Click any image to open it fully</p>
          </div>

          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
            {(loading ? placeholders : images).map((image, index) =>
              typeof image === "number" ? (
                <div
                  key={`archive-placeholder-${image}`}
                  className="mb-5 aspect-[4/5] break-inside-avoid animate-pulse bg-gradient-to-br from-white/12 via-white/6 to-white/10"
                />
              ) : (
                <button
                  key={getImageKey(image, index)}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className="group relative mb-5 block w-full break-inside-avoid overflow-hidden bg-white/[0.02] text-left"
                >
                  <div className="pointer-events-none absolute inset-0 z-10 border border-white/8 transition-colors duration-300 group-hover:border-white/20" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="block h-auto w-full transition duration-500 group-hover:translateY-[-2px] group-hover:opacity-95"
                    loading="lazy"
                  />
                </button>
              ),
            )}
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-white/50">
              {loading
                ? "Loading archive..."
                : hasPaginationMeta
                  ? `Showing ${pageStart}-${pageEnd} of ${total}`
                  : `Showing ${images.length} loaded images`}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                disabled={loading || page === 1 || !hasPaginationMeta}
                className="border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/70 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                Previous
              </button>
              <span className="min-w-24 text-center text-xs uppercase tracking-[0.24em] text-white/42">
                {hasPaginationMeta
                  ? `${String(page).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}`
                  : "single set"}
              </span>
              <button
                type="button"
                onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                disabled={loading || page === totalPages || !hasPaginationMeta}
                className="border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/70 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : null}

      {activeImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 px-4 py-6 sm:px-8"
          role="dialog"
          aria-modal="true"
          aria-label={activeImage.alt}
          onClick={() => setActiveIndex(null)}
        >
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            className="absolute right-4 top-4 border border-white/20 px-3 py-2 text-xs uppercase tracking-[0.22em] text-white/72 transition hover:border-white/40 hover:text-white sm:right-8 sm:top-8"
          >
            Close
          </button>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handlePrevious();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 border border-white/15 bg-black/30 px-3 py-4 text-xs uppercase tracking-[0.22em] text-white/72 transition hover:border-white/40 hover:text-white sm:left-6"
                aria-label="Previous image"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleNext();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 border border-white/15 bg-black/30 px-3 py-4 text-xs uppercase tracking-[0.22em] text-white/72 transition hover:border-white/40 hover:text-white sm:right-6"
                aria-label="Next image"
              >
                Next
              </button>
            </>
          ) : null}

          <figure
            className="mx-auto flex max-h-full w-full max-w-6xl flex-col gap-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage.src}
                alt={activeImage.alt}
                className="max-h-[78vh] w-auto max-w-full object-contain"
              />
            </div>
            <figcaption className="flex items-center justify-between gap-4 border-t border-white/10 pt-4 text-sm text-white/70">
              <span>{activeImage.alt}</span>
              <span className="text-[11px] uppercase tracking-[0.24em] text-white/40">
                {String((activeIndex ?? 0) + 1).padStart(2, "0")} /{" "}
                {String(images.length).padStart(2, "0")}
              </span>
            </figcaption>
          </figure>
        </div>
      ) : null}
    </section>
  );
}
