import "server-only";
import { S3Client } from "@aws-sdk/client-s3";

export type LogicalBucket = "PREVIEWS" | "PRIVATE";
const clean = (value?: string) => (value ?? "").trim();
const base = (value?: string) => clean(value).replace(/\/+$/, "");

function endpoint() {
  const explicit = clean(process.env.R2_ENDPOINT) || clean(process.env.S3_ENDPOINT);
  const accountId = clean(process.env.R2_ACCOUNT_ID);
  return explicit || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
}

export function getStorageConfig(logicalBucket: LogicalBucket) {
  const accessKeyId = clean(process.env.R2_ACCESS_KEY_ID) || clean(process.env.S3_ACCESS_KEY_ID);
  const secretAccessKey = clean(process.env.R2_SECRET_ACCESS_KEY) || clean(process.env.S3_SECRET_ACCESS_KEY);
  const bucket = logicalBucket === "PREVIEWS" ? clean(process.env.R2_PREVIEWS_BUCKET) : clean(process.env.R2_PRIVATE_BUCKET);
  const publicBaseUrl = logicalBucket === "PREVIEWS" ? base(process.env.R2_PUBLIC_PREVIEW_URL) : "";
  const maxMb = Number(logicalBucket === "PREVIEWS" ? process.env.UPLOAD_MAX_PREVIEW_MB ?? process.env.UPLOAD_MAX_MB ?? "50" : process.env.UPLOAD_MAX_PRIVATE_MB ?? "500");
  const missing: string[] = [];
  if (!endpoint()) missing.push("R2_ENDPOINT o R2_ACCOUNT_ID");
  if (!accessKeyId) missing.push("R2_ACCESS_KEY_ID");
  if (!secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
  if (!bucket) missing.push(logicalBucket === "PREVIEWS" ? "R2_PREVIEWS_BUCKET" : "R2_PRIVATE_BUCKET");
  if (logicalBucket === "PREVIEWS" && !publicBaseUrl) missing.push("R2_PUBLIC_PREVIEW_URL");
  return {
    ok: missing.length === 0, missing, bucket, endpoint: endpoint(),
    region: clean(process.env.R2_REGION) || clean(process.env.S3_REGION) || "auto",
    forcePathStyle: /^(1|true)$/i.test(process.env.S3_FORCE_PATH_STYLE ?? ""),
    creds: { accessKeyId, secretAccessKey }, publicBaseUrl,
    maxBytes: Math.max(1, Math.floor(maxMb * 1024 * 1024)),
    allowedMimes: (process.env.UPLOAD_ALLOWED_MIME ?? "audio/mpeg,audio/wav,audio/x-wav,audio/flac,audio/ogg,audio/mp4,audio/aiff,audio/x-aiff").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean),
  };
}

let client: S3Client | null = null;
export function getR2Client() {
  if (client) return client;
  const cfg = getStorageConfig("PREVIEWS");
  client = new S3Client({ region: cfg.region, endpoint: cfg.endpoint, forcePathStyle: cfg.forcePathStyle, credentials: cfg.creds });
  return client;
}

export function getPublicPreviewUrl(key: string) {
  const publicBaseUrl = getStorageConfig("PREVIEWS").publicBaseUrl;
  return publicBaseUrl ? `${publicBaseUrl}/${key.replace(/^\/+/, "")}` : "";
}

// Adaptadores legacy solo para lectura durante la transición.
export function getUploadConfig() {
  const next = getStorageConfig("PREVIEWS");
  const bucket = clean(process.env.S3_BUCKET);
  const publicBaseUrl = base(process.env.S3_PUBLIC_BASE_URL);
  return { ...next, ok: Boolean(bucket && endpoint() && next.creds.accessKeyId && next.creds.secretAccessKey), bucket, publicBaseUrl };
}
export const getS3 = getR2Client;
export function getS3PublicUrl(key: string) {
  const publicBaseUrl = base(process.env.S3_PUBLIC_BASE_URL);
  return publicBaseUrl ? `${publicBaseUrl}/${key.replace(/^\/+/, "")}` : "";
}
