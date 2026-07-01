import { getGalleryImages } from "@/data/remote-gallery";

export default async function PlacesFacesPage() {
  const galleryImages = await getGalleryImages();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 pb-10 pt-6 md:px-8">
      <section className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {galleryImages.map((image) => (
          <article key={image.src} className="mb-4 break-inside-avoid">
            <img
              src={image.src}
              alt={image.alt}
              className="h-auto w-full rounded-xl border border-white/5 object-cover"
              loading="lazy"
            />
          </article>
        ))}
      </section>
    </main>
  );
}
