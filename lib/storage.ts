import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function spacesClient() {
  const endpoint = process.env.DO_SPACES_ENDPOINT;
  const region = process.env.DO_SPACES_REGION;
  const accessKeyId = process.env.DO_SPACES_KEY;
  const secretAccessKey = process.env.DO_SPACES_SECRET;
  if (!endpoint || !region || !accessKeyId || !secretAccessKey) throw new Error("DigitalOcean Spaces is not configured");
  // The SDK adds Bucket to regional endpoints. Accept copied bucket URLs too.
  const normalized = new URL(endpoint);
  const bucket = process.env.DO_SPACES_BUCKET;
  if (bucket && normalized.hostname === `${bucket}.${region}.digitaloceanspaces.com`) {
    normalized.hostname = `${region}.digitaloceanspaces.com`;
  }
  return new S3Client({ endpoint: normalized.toString(), region, credentials: { accessKeyId, secretAccessKey } });
}

export async function createUploadUrl(key: string, contentType: string) {
  const bucket = process.env.DO_SPACES_BUCKET;
  if (!bucket) throw new Error("DigitalOcean Spaces bucket is not configured");
  return getSignedUrl(spacesClient(), new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }), { expiresIn: 300 });
}

export async function createDownloadUrl(key: string) {
  const bucket = process.env.DO_SPACES_BUCKET;
  if (!bucket) throw new Error("DigitalOcean Spaces bucket is not configured");
  return getSignedUrl(spacesClient(), new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 300 });
}

export async function uploadExists(key: string) {
  const bucket = process.env.DO_SPACES_BUCKET;
  if (!bucket) throw new Error("DigitalOcean Spaces bucket is not configured");
  try {
    const result = await spacesClient().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return Boolean(result.ContentLength && result.ContentLength > 0 && result.ContentLength <= 10 * 1024 * 1024);
  } catch {
    return false;
  }
}

export async function storeUpload(key: string, contentType: string, body: Uint8Array) {
  const bucket = process.env.DO_SPACES_BUCKET;
  if (!bucket) throw new Error("DigitalOcean Spaces bucket is not configured");
  await spacesClient().send(new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType, Body: body }));
}
