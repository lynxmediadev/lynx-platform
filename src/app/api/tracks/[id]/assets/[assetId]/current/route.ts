import { NextRequest, NextResponse } from "next/server";
import { getRequestAuthUser } from "@/lib/account-auth/request-auth";
import { canManageTrack } from "@/lib/storage/asset-policy";
import { enqueueAudioJob } from "@/lib/audio-jobs/queue";
import { db } from "@/server/db";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string; assetId: string }> }) {
  const { id, assetId } = await params;
  const actor = await getRequestAuthUser(_req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const track = await db.track.findUnique({ where: { id }, select: { ownerUserId: true } });
  if (!track) return NextResponse.json({ error: "Track no encontrado" }, { status: 404 });
  if (!canManageTrack(actor, track.ownerUserId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const asset = await db.trackAsset.findFirst({ where: { id: assetId, trackId: id, type: { in: ["MASTER", "PREVIEW"] }, status: "VERIFIED" } });
  if (!asset) return NextResponse.json({ error: "Asset no disponible" }, { status: 404 });
  await db.$transaction(async (tx) => {
    await tx.trackAsset.updateMany({ where: { trackId: id, type: asset.type, isCurrent: true }, data: { isCurrent: false } });
    await tx.trackAsset.update({ where: { id: asset.id }, data: { isCurrent: true } });
    if (asset.type === "PREVIEW") await tx.track.update({ where: { id }, data: { isDraft: false } });
  });
  const job = await enqueueAudioJob({ trackId: id, assetId: asset.id });
  return NextResponse.json({ ok: true, job: { id: job.job.id, status: job.job.status } }, { status: 202 });
}
