import { getRandomImages } from "@/lib/r2";
import { GalleryLightbox } from "@/components/GalleryLightbox";
import { PLACES_FACES_IMAGE_COUNT } from "@/lib/gallery-config";

export const dynamic = "force-dynamic";

export default async function PlacesFacesPage() {
    const images = await getRandomImages(PLACES_FACES_IMAGE_COUNT);

    return (
        <main className="mx-auto w-full max-w-5xl px-6 pb-8 pt-4 md:px-8">
            <GalleryLightbox images={images} />
        </main>
    );
}
