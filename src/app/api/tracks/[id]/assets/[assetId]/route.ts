import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

import { getRequestAuthUser } from "@/lib/account-auth/request-auth";
import { deleteTrackAssetStorageAndRecord } from "@/lib/storage/delete-track-asset";
import {
  assetDeleteDecision,
  canManageTrack,
} from "@/lib/storage/asset-policy";
import { getR2Client, getStorageConfig } from "@/lib/storage/s3";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> },
) {
  const { id, assetId } = await params;
  const actor = await getRequestAuthUser(req);
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const track = await db.track.findUnique({
    where: { id },
    select: { ownerUserId: true, assetKey: true },
  });
  if (!track) {
    return NextResponse.json({ error: "Track no encontrado" }, { status: 404 });
  }
  if (!canManageTrack(actor, track.ownerUserId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const asset = await db.trackAsset.findFirst({
    where: { id: assetId, trackId: id },
    select: {
      id: true,
      type: true,
      bucket: true,
      storageKey: true,
      isCurrent: true,
      status: true,
    },
  });

  let verifiedAlternativeCount = 0;
  let hasExplicitLegacyReference = false;
  if (asset) {
    if (
      asset.isCurrent &&
      (asset.type === "PREVIEW" || asset.type === "MASTER")
    ) {
      verifiedAlternativeCount = await db.trackAsset.count({
        where: {
          trackId: id,
          type: asset.type,
          status: "VERIFIED",
          id: { not: asset.id },
        },
      });
    }

    hasExplicitLegacyReference = track.assetKey === asset.storageKey;
    if (!hasExplicitLegacyReference && asset.type === "STEM") {
      hasExplicitLegacyReference =
        (await db.trackStem.count({
          where: { trackId: id, assetKey: asset.storageKey },
        })) > 0;
    }
    if (!hasExplicitLegacyReference && asset.type === "ALTERNATE") {
      hasExplicitLegacyReference =
        (await db.trackVersion.count({
          where: { trackId: id, assetKey: asset.storageKey },
        })) > 0;
    }
  }

  const decision = assetDeleteDecision({
    trackExists: true,
    assetExists: Boolean(asset),
    actor,
    ownerUserId: track.ownerUserId,
    type: asset?.type ?? null,
    isCurrent: asset?.isCurrent ?? false,
    verifiedAlternativeCount,
    storageKey: asset?.storageKey ?? null,
    hasExplicitLegacyReference,
  });
  if (!decision.allowed) {
    return NextResponse.json(
      { error: decision.error },
      { status: decision.status },
    );
  }
  if (!asset) {
    return NextResponse.json(
      { error: "Asset no encontrado o ya eliminado" },
      { status: 404 },
    );
  }

  const storage = getStorageConfig(asset.bucket);
  if (!storage.ok) {
    return NextResponse.json(
      { error: "R2 no está configurado para eliminar este asset" },
      { status: 501 },
    );
  }

  const result = await deleteTrackAssetStorageAndRecord({
    deleteObject: async () => {
      await getR2Client().send(
        new DeleteObjectCommand({
          Bucket: storage.bucket,
          Key: asset.storageKey,
        }),
      );
    },
    deleteRecord: async () => {
      const deleted = await db.trackAsset.deleteMany({
        where: {
          id: asset.id,
          trackId: id,
          bucket: asset.bucket,
          storageKey: asset.storageKey,
          isCurrent: asset.isCurrent,
          status: asset.status,
        },
      });
      if (deleted.count === 0) {
        const remaining = await db.trackAsset.count({
          where: { id: asset.id, trackId: id },
        });
        if (remaining > 0) {
          throw new Error("El asset cambió durante la eliminación");
        }
      }
      return deleted.count;
    },
    markRecordMissing: async () => {
      await db.trackAsset.updateMany({
        where: { id: asset.id, trackId: id },
        data: { status: "MISSING" },
      });
    },
  });

  if (!result.ok && result.phase === "storage") {
    return NextResponse.json(
      {
        error:
          "R2 no pudo eliminar el archivo. El registro se conservó sin cambios.",
      },
      { status: 502 },
    );
  }
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.recordMarkedMissing
          ? "El archivo se eliminó de R2, pero PostgreSQL falló. El registro quedó marcado como MISSING para poder reintentar."
          : "El archivo se eliminó de R2, pero PostgreSQL falló y no pudo marcarse como MISSING. Revisa el registro antes de reintentar.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    alreadyDeleted: result.alreadyDeleted,
  });
}
