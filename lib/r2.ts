import "server-only";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import type { ImagesPage, R2Image } from "@/types";
import { shuffle } from "./utils";

function requireEnv(...keys: string[]): string {
	for (const key of keys) {
		const value = process.env[key];
		if (value && value.trim().length > 0) {
			return value;
		}
	}

	throw new Error(`Missing required env var. Tried: ${keys.join(", ")}`);
}

const accountId = requireEnv("CLOUDFLARE_ACCOUNT_ID");
const accessKeyId = requireEnv("CLOUDFLARE_ACCESS_KEY_ID");
const secretAccessKey = requireEnv("CLOUDFLARE_SECRET_ACCESS_KEY");
const bucketNameThumbs = requireEnv("CLOUDFLARE_R2_BUCKET_NAME_THUMBS");

const publicBaseUrl = (
	process.env.CLOUDFLARE_PUBLIC_PRODUCTION_URL ||
	process.env.CLOUDFLARE_PUBLIC_DEVELOPMENT_URL ||
	""
).replace(/\/+$/, "");

const publicBaseUrlThumbs = (
	process.env.CLOUDFLARE_PUBLIC_PRODUCTION_URL_THUMBS ||
	process.env.CLOUDFLARE_PUBLIC_DEVELOPMENT_URL_THUMBS ||
	""
).replace(/\/+$/, "");

if (!publicBaseUrl || !publicBaseUrlThumbs) {
	throw new Error(
		"Missing required public R2 URLs. Please set CLOUDFLARE_PUBLIC_PRODUCTION_URL or CLOUDFLARE_PUBLIC_DEVELOPMENT_URL and their thumbs counterparts.",
	);
}

export const r2Client = new S3Client({
	region: "auto",
	endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId,
		secretAccessKey,
	},
});

function toImage(key: string): R2Image {
    const fullKey = key.replace(/\.webp$/, ".jpg");
    return {
		key,
		thumbUrl: `${publicBaseUrlThumbs}/${encodeURI(key)}`,
		fullUrl: `${publicBaseUrl}/${encodeURI(fullKey)}`,
		alt: key.split("/").pop() ?? key,
	};
}

/**
 * Fetches a paginated list of images from R2.
 * @param limit - The number of images to fetch.
 * @param cursor - The cursor for pagination.
 * @returns A promise that resolves to an object containing the images and the next cursor.
 */
export async function getImagesPage(
	limit = 12,
	cursor?: string,
): Promise<ImagesPage> {
	const safeLimit = Math.max(1, Math.min(limit, 48));
	const response = await r2Client.send(
		new ListObjectsV2Command({
			Bucket: bucketNameThumbs,
			ContinuationToken: cursor,
			MaxKeys: safeLimit,
		}),
	);

	const images = (response.Contents ?? [])
		.map((item) => item.Key)
		.filter((key): key is string => Boolean(key && !key.endsWith("/")))
		.map(toImage);

	return {
		images,
		nextCursor: response.IsTruncated
			? (response.NextContinuationToken ?? null)
			: null,
	};
}

/**
 * Fetches a random selection of images from R2.
 * @param limit - The number of random images to fetch.
 * @returns A promise that resolves to an array of random images.
 */
export async function getRandomImages(limit = 6): Promise<R2Image[]> {
	const safeLimit = Math.max(1, Math.min(limit, 48));
	const keys: string[] = [];
	let cursor: string | undefined;

	do {
		const response = await r2Client.send(
			new ListObjectsV2Command({
				Bucket: bucketNameThumbs,
				ContinuationToken: cursor,
				MaxKeys: 1000,
			}),
		);

		keys.push(
			...(response.Contents ?? [])
				.map((item) => item.Key)
				.filter((key): key is string =>
					Boolean(key && !key.endsWith("/")),
				),
		);
		cursor = response.IsTruncated
			? response.NextContinuationToken
			: undefined;
	} while (cursor);

	return shuffle(keys).slice(0, safeLimit).map(toImage);
}