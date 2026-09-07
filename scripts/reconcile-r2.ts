import {
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
  type _Object,
} from "@aws-sdk/client-s3";
import { PrismaClient, type TrackAssetBucket } from "@prisma/client";
import {
  classifyR2Object,
  DEFAULT_PENDING_TTL_HOURS,
} from "../src/lib/maintenance/r2-cleanup-policy";

const prisma = new PrismaClient();
const now = new Date();
const apply = process.argv.includes("--apply");
const confirmation = argument("--confirm");
const ttlHours = numericArgument("--ttl-hours", DEFAULT_PENDING_TTL_HOURS, 1);

function argument(name: string) {
  const exact = process.argv.find((item) => item.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function numericArgument(name: string, fallback: number, minimum: number) {
  const raw = argument(name);
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < minimum) {
    throw new Error(`${name} debe ser un número mayor o igual a ${minimum}`);
  }
  return value;
}

function required(name: string) {
  const value = (process.env[name] ?? "").trim();
  if (!value) throw new Error(`Falta ${name}`);
  return value;
}

function config() {
  const accountId = (process.env.R2_ACCOUNT_ID ?? "").trim();
  const endpoint =
    (process.env.R2_ENDPOINT ?? "").trim() ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  return {
    endpoint: endpoint || required("R2_ENDPOINT o R2_ACCOUNT_ID"),
    region: (process.env.R2_REGION ?? "auto").trim() || "auto",
    accessKeyId: required("R2_ACCESS_KEY_ID"),
    secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
    buckets: {
      PREVIEWS: required("R2_PREVIEWS_BUCKET"),
      PRIVATE: required("R2_PRIVATE_BUCKET"),
    } satisfies Record<TrackAssetBucket, string>,
  };
}

async function listPrefix(client: S3Client, bucket: string, prefix: string) {
  const objects: _Object[] = [];
  let continuationToken: string | undefined;
  do {
    const page = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: continuationToken }),
    );
    objects.push(...(page.Contents ?? []));
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);
  return objects;
}

async function main() {
  if (apply && confirmation !== "DELETE_ABANDONED_PENDING") {
    throw new Error(
      "El borrado requiere --apply --confirm DELETE_ABANDONED_PENDING; ejecuta dry-run primero",
    );
  }

  const cfg = config();
  const client = new S3Client({
    endpoint: cfg.endpoint,
    region: cfg.region,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
  });
  const assets = await prisma.trackAsset.findMany({
    select: { bucket: true, storageKey: true, status: true },
  });
  const references = new Map(
    assets.map((asset) => [`${asset.bucket}:${asset.storageKey}`, asset.status]),
  );
  const inventory: Array<{
    bucket: TrackAssetBucket;
    key: string;
    prefix: "pending" | "legacy";
    ageHours: number | null;
    sizeBytes: number;
    databaseReference: boolean;
    assetStatus: string | null;
    decision: string;
    candidate: boolean;
  }> = [];

  for (const logicalBucket of ["PREVIEWS", "PRIVATE"] as const) {
    for (const prefix of ["pending", "legacy"] as const) {
      const objectPrefix = prefix === "pending" ? "pending/" : "legacy-previews/";
      for (const object of await listPrefix(client, cfg.buckets[logicalBucket], objectPrefix)) {
        if (!object.Key) continue;
        const assetStatus = references.get(`${logicalBucket}:${object.Key}`) ?? null;
        const decision = classifyR2Object(
          {
            key: object.Key,
            lastModified: object.LastModified ?? null,
            referencedInDatabase: assetStatus !== null,
            assetStatus,
          },
          { now, ttlHours, prefix },
        );
        inventory.push({
          bucket: logicalBucket,
          key: object.Key,
          prefix,
          ageHours: decision.ageHours === null ? null : Number(decision.ageHours.toFixed(2)),
          sizeBytes: Number(object.Size ?? 0),
          databaseReference: assetStatus !== null,
          assetStatus,
          decision: decision.reason,
          candidate: decision.candidate,
        });
      }
    }
  }

  const candidates = inventory.filter((item) => item.candidate);
  const deleted: Array<{ bucket: TrackAssetBucket; key: string }> = [];
  if (apply) {
    for (const candidate of candidates) {
      const dbReference = await prisma.trackAsset.count({
        where: { bucket: candidate.bucket, storageKey: candidate.key },
      });
      if (dbReference > 0) continue;
      const head = await client.send(
        new HeadObjectCommand({ Bucket: cfg.buckets[candidate.bucket], Key: candidate.key }),
      );
      const latestDecision = classifyR2Object(
        {
          key: candidate.key,
          lastModified: head.LastModified ?? null,
          referencedInDatabase: false,
          assetStatus: null,
        },
        { now: new Date(), ttlHours, prefix: "pending" },
      );
      if (!latestDecision.candidate) continue;
      await client.send(
        new DeleteObjectCommand({ Bucket: cfg.buckets[candidate.bucket], Key: candidate.key }),
      );
      deleted.push({ bucket: candidate.bucket, key: candidate.key });
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        ttlHours,
        scanned: inventory.length,
        candidates: candidates.length,
        protected: inventory.length - candidates.length,
        deleted: deleted.length,
        inventory,
      },
      null,
      2,
    ),
  );
}

void main()
  .catch((error: unknown) => {
    console.error(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "unknown error" }),
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
