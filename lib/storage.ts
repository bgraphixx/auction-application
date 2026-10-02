import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function spacesClient() {
  const endpoint = process.env.DO_SPACES_ENDPOINT;
  const region = process.env.DO_SPACES_REGION;
  const accessKeyId = process.env.DO_SPACES_KEY;
  const secretAccessKey = process.env.DO_SPACES_SECRET;
  if (!endpoint || !region || !accessKeyId || !secretAccessKey) throw new Error("DigitalOcean Spaces is not configured");
  return new S3Client({ endpoint, region, credentials: { accessKeyId, secretAccessKey } });
}

export async function createUploadUrl(key: string, contentType: string) {
  const bucket = process.env.DO_SPACES_BUCKET;
  if (!bucket) throw new Error("DigitalOcean Spaces bucket is not configured");
  return getSignedUrl(spacesClient(), new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }), { expiresIn: 300 });
}
