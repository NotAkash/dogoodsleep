import "server-only";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import type { ImagesPage, R2Image } from "@/lib/gallery-types";

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
const bucketName = requireEnv("CLOUDFLARE_R2_BUCKET_NAME");
const publicBaseUrl = requireEnv(
  "CLOUDFLARE_PUBLIC_PRODUCTION_URL",
  "CLOUDFLARE_PUBCLIC_DEVELOPMENT_URL"
).replace(/\/+$/, "");

export const r2Client = new S3Client({
	region: "auto",
	endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId,
		secretAccessKey,
	},
});

function toImage(key: string): R2Image {
	return {
		key,
		url: `${publicBaseUrl}/${encodeURI(key)}`,
		alt: key.split("/").pop() ?? key,
	};
}

function shuffle<T>(items: T[]): T[] {
	const arr = [...items];
	for (let i = arr.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

export async function getImagesPage(
	limit = 12,
	cursor?: string
): Promise<ImagesPage> {
	const safeLimit = Math.max(1, Math.min(limit, 48));
	const response = await r2Client.send(
		new ListObjectsV2Command({
			Bucket: bucketName,
			ContinuationToken: cursor,
			MaxKeys: safeLimit,
		})
	);

	const images = (response.Contents ?? [])
		.map((item) => item.Key)
		.filter((key): key is string => Boolean(key && !key.endsWith("/")))
		.map(toImage);

	return {
		images,
		nextCursor: response.IsTruncated
			? response.NextContinuationToken ?? null
			: null,
	};
}

export async function getRandomImages(limit = 6): Promise<R2Image[]> {
	const safeLimit = Math.max(1, Math.min(limit, 48));
	const keys: string[] = [];
	let cursor: string | undefined;

	do {
		const response = await r2Client.send(
			new ListObjectsV2Command({
				Bucket: bucketName,
				ContinuationToken: cursor,
				MaxKeys: 1000,
			})
		);

		keys.push(
			...((response.Contents ?? [])
				.map((item) => item.Key)
				.filter((key): key is string => Boolean(key && !key.endsWith("/"))))
		);
		cursor = response.IsTruncated ? response.NextContinuationToken : undefined;
	} while (cursor);

	return shuffle(keys).slice(0, safeLimit).map(toImage);
}
