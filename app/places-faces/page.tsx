import { getRandomImages } from "@/lib/r2";

export const dynamic = "force-dynamic";

export default async function PlacesFacesPage() {
    const images = await getRandomImages(6);

    return (
        <main className="mx-auto w-full max-w-5xl px-6 pb-8 pt-4 md:px-8">
            <section className="columns-1 gap-4 sm:columns-2 lg:columns-3">
                {images.map((image) => (
                    <article key={image.key} className="mb-4 break-inside-avoid">
                        <img
                            src={image.url}
                            alt={image.alt}
                            className="h-auto w-full rounded-xl border border-white/5"
                            loading="lazy"
                        />
                    </article>
                ))}
            </section>
        </main>
    );
}
