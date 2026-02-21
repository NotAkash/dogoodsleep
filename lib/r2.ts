import "server-only";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import type { ImagesPage, R2Image } from "@/types";
import { shuffle } from "./utils";

let _r2Client: S3Client | null = null;

function getR2Config() {
	const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
	const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID;
	const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
	const bucketNameThumbs = process.env.CLOUDFLARE_R2_BUCKET_NAME_THUMBS;

	if (!accountId || !accessKeyId || !secretAccessKey || !bucketNameThumbs) {
		throw new Error(
			`Missing required R2 environment variables. Found: ${JSON.stringify({
				hasAccountId: !!accountId,
				hasAccessKeyId: !!accessKeyId,
				hasSecretAccessKey: !!secretAccessKey,
				hasBucketName: !!bucketNameThumbs,
			})}`,
		);
	}

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
		throw new Error("Missing required public R2 URLs.");
	}

	return {
		accountId,
		accessKeyId,
		secretAccessKey,
		bucketNameThumbs,
		publicBaseUrl,
		publicBaseUrlThumbs,
	};
}

export function getR2Client() {
	if (_r2Client) return _r2Client;

	const { accountId, accessKeyId, secretAccessKey } = getR2Config();
	_r2Client = new S3Client({
		region: "auto",
		endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId,
			secretAccessKey,
		},
	});
	return _r2Client;
}

function toImage(key: string, publicBaseUrl: string, publicBaseUrlThumbs: string): R2Image {
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
 */
export async function getImagesPage(
	limit = 12,
	cursor?: string,
): Promise<ImagesPage> {
	const config = getR2Config();
	const client = getR2Client();
	const safeLimit = Math.max(1, Math.min(limit, 48));
	
	const response = await client.send(
		new ListObjectsV2Command({
			Bucket: config.bucketNameThumbs,
			ContinuationToken: cursor,
			MaxKeys: safeLimit,
		}),
	);

	const images = (response.Contents ?? [])
		.map((item) => item.Key)
		.filter((key): key is string => Boolean(key && !key.endsWith("/")))
		.map(key => toImage(key, config.publicBaseUrl, config.publicBaseUrlThumbs));

	return {
		images,
		nextCursor: response.IsTruncated
			? (response.NextContinuationToken ?? null)
			: null,
	};
}

/**
 * Fetches a random selection of images from R2.
 */
export async function getRandomImages(limit = 6): Promise<R2Image[]> {
	const config = getR2Config();
	const client = getR2Client();
	const safeLimit = Math.max(1, Math.min(limit, 48));
	const keys: string[] = [];
	let cursor: string | undefined;

	do {
		const response = await client.send(
			new ListObjectsV2Command({
				Bucket: config.bucketNameThumbs,
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

	return shuffle(keys).slice(0, safeLimit).map(key => toImage(key, config.publicBaseUrl, config.publicBaseUrlThumbs));
}