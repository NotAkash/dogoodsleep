import { PlacesFacesGallery } from "@/components/places-faces-gallery";
import { normalizeGalleryBaseUrl } from "@/data/remote-gallery";

export default function PlacesFacesPage() {
  const imageApiUrl = normalizeGalleryBaseUrl(
    process.env.IMAGES_API_URL ?? "https://api.dogoodsleep.com",
  );

  return (
    <main
      id="main-content"
      className="archive-main page-wrap"
    >
      <PlacesFacesGallery imageApiUrl={imageApiUrl} />
    </main>
  );
}
