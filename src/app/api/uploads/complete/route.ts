import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequestAuthUser } from "@/lib/account-auth/request-auth";
import { accessForAssetType, canManageTrack, isSafeStorageKey } from "@/lib/storage/asset-policy";
import { getR2Client, getStorageConfig } from "@/lib/storage/s3";
import { verifyUploadClaim } from "@/lib/storage/upload-claim";
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

  const track = await db.track.findUnique({ where: { id: claim.trackId }, select: { ownerUserId: true } });
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

  const asset = await db.trackAsset.upsert({
    where: { bucket_storageKey: { bucket: claim.bucket, storageKey: claim.key } },
    update: { status: "VERIFIED", mime: claim.mime, sizeBytes: BigInt(claim.size), checksumSha256: head.ChecksumSHA256 ?? null, verifiedAt: new Date() },
    create: { trackId: claim.trackId, type: claim.assetType, access: accessForAssetType(claim.assetType), status: "VERIFIED", bucket: claim.bucket, storageKey: claim.key, mime: claim.mime, sizeBytes: BigInt(claim.size), checksumSha256: head.ChecksumSHA256 ?? null, uploadedAt: head.LastModified ?? new Date(), verifiedAt: new Date(), createdByUserId: actor.id },
    select: { id: true, type: true, access: true, status: true },
  });
  return NextResponse.json({ ok: true, asset });
}
