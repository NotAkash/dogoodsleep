export type GalleryImage = {
	src: string;
	alt: string;
};

type ImagesResponse = {
	images?: GalleryImage[];
};

export async function getGalleryImage(): Promise<GalleryImage | null> {
	const baseUrl = process.env.IMAGES_API_URL?.replace(/\/+$/, "");

	if (!baseUrl) {
		throw new Error("Missing IMAGES_API_URL");
	}

	const response = await fetch(`${baseUrl}/images?limit=1`);

	if (!response.ok) {
		throw new Error(`Image worker request failed: ${response.status}`);
	}

	const data = (await response.json()) as ImagesResponse;
	return data.images?.[0] ?? null;
}
