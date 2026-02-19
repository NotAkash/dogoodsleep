export type R2Image = {
	key: string;
	thumbUrl: string;
	fullUrl: string;
	alt: string;
};

export type ImagesPage = {
	images: R2Image[];
	nextCursor: string | null;
};

export const PLACES_FACES_IMAGE_COUNT = 12;
