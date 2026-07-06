import { getGalleryImage } from "@/data/remote-gallery";

export default async function PlacesFacesPage() {
  const heroImage = await getGalleryImage();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-84px)] w-full max-w-6xl items-center px-6 py-10 md:px-8">
      <section className="grid w-full gap-4 md:grid-cols-2">
        <article className="flex min-h-[320px] flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.28em] text-white/45">
              Places & Faces
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-[#f5f5f5] sm:text-5xl">
              places y faces
            </h1>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#a3a3a3] sm:text-base">
            A small starting point for the gallery, with room to grow into
            whatever comes next.
          </p>
        </article>

        <article className="min-h-[320px] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              heroImage?.src ??
              "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80"
            }
            alt={heroImage?.alt ?? "Placeholder gallery image"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </article>
      </section>
    </main>
  );
}
