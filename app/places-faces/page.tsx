import { PlacesFacesGallery } from "@/components/places-faces-gallery";
import { normalizeGalleryBaseUrl } from "@/data/remote-gallery";

export default function PlacesFacesPage() {
  const imageApiUrl = normalizeGalleryBaseUrl(process.env.IMAGES_API_URL);

  return (
    <main className="mx-auto min-h-[calc(100vh-84px)] w-full max-w-[1600px] px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
      <h1 className="sr-only">Places & Faces</h1>
      <PlacesFacesGallery imageApiUrl={imageApiUrl} />
    </main>
  );
}
