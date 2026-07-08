"use client";

import { useEffect, useState } from "react";
import { getGalleryImages, type GalleryImage } from "@/data/remote-gallery";

type PlacesFacesGalleryProps = {
  imageApiUrl: string;
};

export function PlacesFacesGallery({
  imageApiUrl,
}: PlacesFacesGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cards = loading
    ? Array.from({ length: 10 }, (_, index) => ({
        key: `placeholder-${index}`,
        image: null as GalleryImage | null,
      }))
    : images.map((image) => ({
        key: image.src,
        image,
      }));

  useEffect(() => {
    let isMounted = true;

    async function loadImages() {
      try {
        setLoading(true);
        setError(null);

        const nextImages = await getGalleryImages(imageApiUrl, 10);

        if (isMounted) {
          setImages(nextImages);
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
  }, [imageApiUrl]);

  return (
    <section className="w-full">
      <div className="mb-6 flex items-end justify-between gap-4 px-1 sm:px-0">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/45">
            Places & Faces
          </p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/55 sm:text-base">
            Ten fresh frames from the archive, reshuffled on every refresh.
          </p>
        </div>
        <p className="hidden text-xs uppercase tracking-[0.24em] text-white/30 sm:block">
          Random roll
        </p>
      </div>

      {error ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-white/70">
          {error}
        </div>
      ) : null}

      <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 xl:columns-4">
        {cards.map((card) => (
          <article
            key={card.key}
            className="mb-6 break-inside-avoid overflow-hidden rounded-[1.5rem] border border-white/8 bg-white/[0.03] shadow-[0_18px_60px_rgba(0,0,0,0.24)]"
          >
            {card.image === null ? (
              <div className="aspect-[4/5] w-full animate-pulse bg-gradient-to-br from-white/12 via-white/6 to-white/10" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.image.src}
                alt={card.image.alt}
                className="block h-auto w-full"
                loading="lazy"
              />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
