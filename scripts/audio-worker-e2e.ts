/**
 * Development-only Phase 3 proof: copies an existing public preview to a
 * private MASTER, records it, and enqueues it. The separate worker command then
 * proves MASTER -> FFmpeg -> public PREVIEW -> READY without touching originals.
 */
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { enqueueAudioJob } from "../src/lib/audio-jobs/queue";
import { prisma } from "../src/lib/prisma";

function value(name: string) {
  const result = (process.env[name] ?? "").trim();
  if (!result) throw new Error(`Missing ${name}`);
  return result;
}

function valueFrom(result: string, name: string) {
  if (!result) throw new Error(`Missing ${name}`);
  return result;
}

function arg(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const trackId = arg("--track");
  if (!trackId || !process.argv.includes("--apply")) {
    throw new Error("Usage: npm run worker:audio:e2e -- --track <test-track-id> --apply");
  }
  const accountId = (process.env.R2_ACCOUNT_ID ?? "").trim();
  const endpoint = (process.env.R2_ENDPOINT ?? "").trim() || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  const client = new S3Client({
    region: (process.env.R2_REGION ?? "auto").trim() || "auto",
    endpoint: valueFrom(endpoint, "R2_ENDPOINT or R2_ACCOUNT_ID"),
    credentials: { accessKeyId: value("R2_ACCESS_KEY_ID"), secretAccessKey: value("R2_SECRET_ACCESS_KEY") },
  });
  const previewsBucket = value("R2_PREVIEWS_BUCKET");
  const privateBucket = value("R2_PRIVATE_BUCKET");
  const preview = await prisma.trackAsset.findFirst({
    where: { trackId, type: "PREVIEW", access: "PUBLIC", status: "VERIFIED" },
    orderBy: { updatedAt: "desc" },
  });
  if (!preview) throw new Error("Track has no verified public preview to use as isolated E2E source");

  const masterKey = `e2e/${trackId}/master/${preview.id}.mp3`;
  const existing = await prisma.trackAsset.findUnique({ where: { bucket_storageKey: { bucket: "PRIVATE", storageKey: masterKey } } });
  let master = existing;
  if (!master) {
    const source = await client.send(new GetObjectCommand({ Bucket: previewsBucket, Key: preview.storageKey }));
    if (!source.Body) throw new Error("Preview body is empty");
    const bytes = await source.Body.transformToByteArray();
    await client.send(new PutObjectCommand({ Bucket: privateBucket, Key: masterKey, Body: bytes, ContentType: "audio/mpeg" }));
    master = await prisma.trackAsset.create({
      data: {
        trackId, type: "MASTER", access: "PRIVATE", status: "VERIFIED", bucket: "PRIVATE", storageKey: masterKey,
        mime: "audio/mpeg", sizeBytes: BigInt(bytes.byteLength), uploadedAt: new Date(), verifiedAt: new Date(),
      },
    });
  }
  const queued = await enqueueAudioJob({ trackId, assetId: master.id });
  console.log(JSON.stringify({ trackId, masterAssetId: master.id, jobId: queued.job.id, jobStatus: queued.job.status, created: queued.created }));
}

void main().finally(() => prisma.$disconnect());
