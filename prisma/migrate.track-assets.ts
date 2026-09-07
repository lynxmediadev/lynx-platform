import { CopyObjectCommand, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import { isSafeStorageKey } from "../src/lib/storage/asset-policy";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const value = (name: string) => (process.env[name] ?? "").trim();

function storage() {
  const accountId = value("R2_ACCOUNT_ID");
  const endpoint = value("R2_ENDPOINT") || value("S3_ENDPOINT") || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  const accessKeyId = value("R2_ACCESS_KEY_ID") || value("S3_ACCESS_KEY_ID");
  const secretAccessKey = value("R2_SECRET_ACCESS_KEY") || value("S3_SECRET_ACCESS_KEY");
  const targetBucket = value("R2_PREVIEWS_BUCKET");
  const missing = [[endpoint, "R2_ENDPOINT o R2_ACCOUNT_ID"], [accessKeyId, "R2_ACCESS_KEY_ID"], [secretAccessKey, "R2_SECRET_ACCESS_KEY"], [targetBucket, "R2_PREVIEWS_BUCKET"]].filter(([current]) => !current).map(([, name]) => name);
  return { endpoint, accessKeyId, secretAccessKey, targetBucket, missing };
}

async function main() {
  const tracks = await prisma.track.findMany({
    select: { id: true, assetKey: true, assetMime: true, assetSize: true, assets: { select: { id: true } } },
  });
  const candidates = tracks.filter((track) => track.assetKey && !track.assetKey.startsWith("external://") && track.assets.length === 0);
  const fixtures = tracks.filter((track) => track.assetKey.startsWith("external://")).length;
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", tracks: tracks.length, legacyFixtures: fixtures, copyCandidates: candidates.length }));
  if (!apply) return;

  const sourceBucket = (process.env.S3_BUCKET ?? "").trim();
  const target = storage();
  if (!sourceBucket || target.missing.length) throw new Error(`Configuración incompleta: S3_BUCKET + ${target.missing.join(", ")}`);
  const client = new S3Client({ region: value("R2_REGION") || value("S3_REGION") || "auto", endpoint: target.endpoint, credentials: { accessKeyId: target.accessKeyId, secretAccessKey: target.secretAccessKey } });

  for (const track of candidates) {
    const sourceKey = track.assetKey.trim();
    if (!isSafeStorageKey(sourceKey)) throw new Error(`Key legacy insegura en track ${track.id}`);
    const destinationKey = `legacy-previews/${sourceKey}`;
    const source = await client.send(new HeadObjectCommand({ Bucket: sourceBucket, Key: sourceKey, ChecksumMode: "ENABLED" }));
    await client.send(new CopyObjectCommand({ Bucket: target.targetBucket, Key: destinationKey, CopySource: `${sourceBucket}/${encodeURIComponent(sourceKey).replace(/%2F/g, "/")}`, ContentType: source.ContentType, MetadataDirective: "COPY" }));
    const copied = await client.send(new HeadObjectCommand({ Bucket: target.targetBucket, Key: destinationKey, ChecksumMode: "ENABLED" }));
    if (Number(source.ContentLength ?? -1) !== Number(copied.ContentLength ?? -2)) throw new Error(`Verificación de tamaño falló para ${track.id}`);
    if (source.ChecksumSHA256 && copied.ChecksumSHA256 && source.ChecksumSHA256 !== copied.ChecksumSHA256) throw new Error(`Verificación de checksum falló para ${track.id}`);
    await prisma.trackAsset.create({ data: { trackId: track.id, type: "PREVIEW", access: "PUBLIC", status: "VERIFIED", bucket: "PREVIEWS", storageKey: destinationKey, mime: copied.ContentType ?? track.assetMime ?? null, sizeBytes: copied.ContentLength ?? BigInt(track.assetSize), checksumSha256: copied.ChecksumSHA256 ?? null, uploadedAt: copied.LastModified ?? new Date(), verifiedAt: new Date() } });
    console.log(JSON.stringify({ migratedTrackId: track.id, size: Number(copied.ContentLength ?? 0) }));
  }
}

void main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
