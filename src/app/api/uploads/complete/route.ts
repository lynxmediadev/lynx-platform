import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequestAuthUser } from "@/lib/account-auth/request-auth";
import { accessForAssetType, becomesCurrentOnUpload, canManageTrack, isSafeStorageKey, shouldProcessAsset } from "@/lib/storage/asset-policy";
import { getR2Client, getStorageConfig } from "@/lib/storage/s3";
import { verifyUploadClaim } from "@/lib/storage/upload-claim";
import { enqueueAudioJob } from "@/lib/audio-jobs/queue";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";
const bodySchema = z.object({ uploadToken: z.string().min(1) });

export async function POST(req: NextRequest) {
  const actor = await getRequestAuthUser(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  const claim = verifyUploadClaim(body.data.uploadToken);
  if (!claim || !claim.trackId || claim.actorId !== actor.id || !isSafeStorageKey(claim.key)) return NextResponse.json({ error: "Token de subida inválido o expirado" }, { status: 400 });
  const trackId = claim.trackId;

  const track = await db.track.findUnique({ where: { id: trackId }, select: { ownerUserId: true } });
  if (!track) return NextResponse.json({ error: "Track no encontrado" }, { status: 404 });
  if (!canManageTrack(actor, track.ownerUserId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const cfg = getStorageConfig(claim.bucket);
  if (!cfg.ok) return NextResponse.json({ error: "R2 no configurado", missing: cfg.missing }, { status: 501 });

  let head;
  try {
    head = await getR2Client().send(new HeadObjectCommand({ Bucket: cfg.bucket, Key: claim.key, ChecksumMode: "ENABLED" }));
  } catch {
    return NextResponse.json({ error: "No se encontró el objeto subido" }, { status: 400 });
  }
  if (Number(head.ContentLength ?? -1) !== claim.size || (head.ContentType ?? "").toLowerCase() !== claim.mime.toLowerCase()) return NextResponse.json({ error: "El objeto no coincide con tamaño o MIME firmados" }, { status: 400 });

  const currentCount = await db.trackAsset.count({ where: { trackId, type: claim.assetType, isCurrent: true } });
  const shouldBeCurrent = becomesCurrentOnUpload(claim.assetType, currentCount);
  const asset = await db.$transaction(async (tx) => {
    if (shouldBeCurrent) await tx.trackAsset.updateMany({ where: { trackId, type: claim.assetType, isCurrent: true }, data: { isCurrent: false } });
    return tx.trackAsset.upsert({
    where: { bucket_storageKey: { bucket: claim.bucket, storageKey: claim.key } },
    update: { status: "VERIFIED", mime: claim.mime, sizeBytes: BigInt(claim.size), checksumSha256: head.ChecksumSHA256 ?? null, verifiedAt: new Date(), originalFilename: claim.originalFilename, label: claim.label, isCurrent: shouldBeCurrent },
    create: { trackId, type: claim.assetType, access: accessForAssetType(claim.assetType), status: "VERIFIED", bucket: claim.bucket, storageKey: claim.key, mime: claim.mime, sizeBytes: BigInt(claim.size), checksumSha256: head.ChecksumSHA256 ?? null, uploadedAt: head.LastModified ?? new Date(), verifiedAt: new Date(), createdByUserId: actor.id, originalFilename: claim.originalFilename, label: claim.label, isCurrent: shouldBeCurrent },
    select: { id: true, type: true, access: true, status: true, isCurrent: true },
    });
  });
  if (asset.type === "STEM") {
    const stemName = (claim.label || claim.originalFilename || "Stem").trim();
    const existing = await db.trackStem.findFirst({ where: { trackId, name: { equals: stemName, mode: "insensitive" } }, select: { id: true } });
    if (!existing) await db.trackStem.create({ data: { trackId, name: stemName } });
  }
  // Stems and deliverables remain private assets but must not replace the catalog
  // preview or mutate the parent Track's analysis.
  if (asset.type === "PREVIEW" && asset.isCurrent) await db.track.update({ where: { id: trackId }, data: { isDraft: false } });
  const job = shouldProcessAsset(asset.type, asset.isCurrent)
    ? await enqueueAudioJob({ trackId, assetId: asset.id })
    : null;
  return NextResponse.json({
    ok: true,
    asset,
    job: job ? { id: job.job.id, status: job.job.status, created: job.created, requeued: job.requeued } : null,
  }, { status: job ? 202 : 200 });
}
