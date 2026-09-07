import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";
import { getRequestAuthUser } from "@/lib/account-auth/request-auth";
import { assetAccessDecision, isSafeStorageKey } from "@/lib/storage/asset-policy";
import { getR2Client, getStorageConfig } from "@/lib/storage/s3";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; assetId: string }> }) {
  const { id, assetId } = await params;
  const track = await db.track.findUnique({ where: { id }, select: { ownerUserId: true } });
  const asset = track ? await db.trackAsset.findFirst({ where: { id: assetId, trackId: id }, select: { access: true, bucket: true, storageKey: true, status: true } }) : null;
  const actor = await getRequestAuthUser(req);
  const decision = assetAccessDecision({ trackExists: Boolean(track), assetExists: Boolean(asset), actor, ownerUserId: track?.ownerUserId ?? null, access: asset?.access ?? "PRIVATE" });
  if (!decision.allowed) return NextResponse.json({ error: decision.error }, { status: decision.status });
  if (!track || !asset) return NextResponse.json({ error: "Asset no encontrado" }, { status: 404 });
  if (asset.status !== "VERIFIED" || !isSafeStorageKey(asset.storageKey)) return NextResponse.json({ error: "Asset no disponible" }, { status: 409 });
  if (asset.access === "PUBLIC") return NextResponse.json({ url: `${getStorageConfig("PREVIEWS").publicBaseUrl}/${asset.storageKey}`, expiresIn: null }, { headers: { "Cache-Control": "no-store" } });
  const cfg = getStorageConfig(asset.bucket);
  if (!cfg.ok) return NextResponse.json({ error: "R2 no configurado", missing: cfg.missing }, { status: 501 });
  const expiresIn = 60;
  const url = await getSignedUrl(getR2Client(), new GetObjectCommand({ Bucket: cfg.bucket, Key: asset.storageKey }), { expiresIn });
  return NextResponse.json({ url, expiresIn }, { headers: { "Cache-Control": "private, no-store" } });
}
