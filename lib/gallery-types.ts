export type R2Image = {
	key: string;
	url: string;
	alt: string;
};

export type ImagesPage = {
	images: R2Image[];
	nextCursor: string | null;
};
