import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.MINIO_ENDPOINT || "http://localhost:9000";
const accessKeyId = process.env.MINIO_ACCESS_KEY || "minioadmin";
const secretAccessKey = process.env.MINIO_SECRET_KEY || "minioadmin";
export const BUCKET = process.env.MINIO_BUCKET || "tekertakip";

export const s3 = new S3Client({
  endpoint,
  region: "us-east-1", // MinIO için gerekli ama önemsiz
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true, // MinIO için zorunlu
});

/** Dosyayı MinIO'ya yükle, key döndür */
export async function uploadToStorage(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return key;
}

/** Dosya için 1 saatlik presigned URL üret */
export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn }
  );
}

/** /api/files/... URL'inden key çıkar */
export function urlToKey(url: string): string {
  // /api/files/driver/abc/src.pdf  →  driver/abc/src.pdf
  return url.replace(/^\/api\/files\//, "");
}
