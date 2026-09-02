import { PlacesFacesGallery } from "@/components/places-faces-gallery";
import { normalizeGalleryBaseUrl } from "@/data/remote-gallery";

export default function PlacesFacesPage() {
  const imageApiUrl = normalizeGalleryBaseUrl(
    process.env.IMAGES_API_URL ?? "https://api.dogoodsleep.com",
  );

  return (
    <main
      id="main-content"
      className="archive-main min-h-[calc(100vh-65px)] w-full px-5 pb-0 pt-10 sm:px-10 sm:pt-16 lg:px-12 lg:pt-20"
    >
      <PlacesFacesGallery imageApiUrl={imageApiUrl} />
    </main>
  );
}
