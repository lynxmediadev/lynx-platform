import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { extension as extensionFromMime } from "mime-types";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequestAuthUser } from "@/lib/account-auth/request-auth";
import { accessForAssetType, bucketForAssetType, canManageTrack, TRACK_ASSET_TYPES, validateUploadMetadata } from "@/lib/storage/asset-policy";
import { getPublicPreviewUrl, getR2Client, getStorageConfig } from "@/lib/storage/s3";
import { hasUploadClaimSecret, signUploadClaim } from "@/lib/storage/upload-claim";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";
const payloadSchema = z.object({ fileName: z.string().trim().min(1).max(180), label: z.string().trim().max(120).optional(), mime: z.string().min(3).max(120), size: z.number().int().positive(), assetType: z.enum(TRACK_ASSET_TYPES).default("PREVIEW"), trackId: z.string().trim().min(1).optional() });

function slug(name: string) {
  return name.toLowerCase().replace(/\.[a-z0-9]+$/i, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "audio";
}
function extension(mime: string, fileName: string) {
  const byMime = mime === "audio/mpeg" ? "mp3" : extensionFromMime(mime) || "";
  const fallback = fileName.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() ?? "bin";
  return byMime || fallback;
}

export async function POST(req: NextRequest) {
  const actor = await getRequestAuthUser(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = payloadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Payload inválido", issues: parsed.error.issues }, { status: 400 });

  const { fileName, size, assetType, trackId } = parsed.data;
  if (!trackId && actor.role !== "ADMIN" && actor.role !== "STAFF") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (trackId) {
    const track = await db.track.findUnique({ where: { id: trackId }, select: { ownerUserId: true } });
    if (!track) return NextResponse.json({ error: "Track no encontrado" }, { status: 404 });
    if (!canManageTrack(actor, track.ownerUserId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const logicalBucket = bucketForAssetType(assetType);
  const cfg = getStorageConfig(logicalBucket);
  if (!cfg.ok || !hasUploadClaimSecret()) {
    return NextResponse.json({ error: "Uploads R2 no configurado", missing: [...cfg.missing, ...(!hasUploadClaimSecret() ? ["ASSET_UPLOAD_SIGNING_SECRET (32+ caracteres)"] : [])] }, { status: 501 });
  }
  const metadata = validateUploadMetadata({ mime: parsed.data.mime, size, allowedMimes: cfg.allowedMimes, maxBytes: cfg.maxBytes });
  if (!metadata.ok) return NextResponse.json({ error: metadata.error, maxBytes: cfg.maxBytes, allowed: cfg.allowedMimes }, { status: 400 });

  const now = new Date();
  const date = [now.getUTCFullYear(), String(now.getUTCMonth() + 1).padStart(2, "0"), String(now.getUTCDate()).padStart(2, "0")].join("/");
  const scope = trackId ? `tracks/${trackId}` : `pending/${actor.id ?? "legacy-admin"}`;
  const key = `${scope}/${assetType.toLowerCase()}/${date}/${crypto.randomUUID()}-${slug(fileName)}.${extension(metadata.mime, fileName)}`;
  const expiresIn = 60;
  const claim = { key, bucket: logicalBucket, assetType, mime: metadata.mime, size, originalFilename: fileName, label: parsed.data.label || undefined, actorId: actor.id, trackId: trackId ?? null, exp: Math.floor(Date.now() / 1000) + 10 * 60 };
  const url = await getSignedUrl(getR2Client(), new PutObjectCommand({ Bucket: cfg.bucket, Key: key, ContentType: metadata.mime, IfNoneMatch: "*" }), { expiresIn });

  return NextResponse.json({ url, method: "PUT", headers: { "Content-Type": metadata.mime, "If-None-Match": "*" }, assetKey: key, assetType, access: accessForAssetType(assetType), bucket: logicalBucket, publicUrl: logicalBucket === "PREVIEWS" ? getPublicPreviewUrl(key) : null, uploadToken: signUploadClaim(claim), expiresIn });
}
