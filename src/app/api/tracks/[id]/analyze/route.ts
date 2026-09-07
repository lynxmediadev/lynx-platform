// src/app/api/tracks/[id]/analyze/route.ts
/** Encola análisis de audio. FFmpeg/FFprobe se ejecutan solo en el worker. */

import { NextRequest, NextResponse } from "next/server";
import { canAccessTrackByRole, getRequestAuthUser } from "@/lib/account-auth/request-auth";
import { enqueueAudioJob } from "@/lib/audio-jobs/queue";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AnalyzeParams = {
  id: string;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<AnalyzeParams> }
) {
  // Next 15: params es un Promise; hay que hacer await
  const { id } = await params;
  const user = await getRequestAuthUser(req);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const allowed = await canAccessTrackByRole(user, id);
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  if (!id) {
    const payload = { ok: false, error: "Falta id en la ruta" };
    return NextResponse.json(payload, { status: 400 });
  }

  try {
    const asset = await prisma.trackAsset.findFirst({
      where: { trackId: id, status: "VERIFIED", type: { in: ["MASTER", "PREVIEW"] } },
      orderBy: [{ type: "asc" }, { updatedAt: "desc" }],
      select: { id: true },
    });
    if (!asset) {
      return NextResponse.json(
        { ok: false, error: "El track no tiene un master o preview verificado" },
        { status: 409 },
      );
    }
    const queued = await enqueueAudioJob({ trackId: id, assetId: asset.id });
    return NextResponse.json({
      ok: true,
      queued: true,
      job: {
        id: queued.job.id,
        status: queued.job.status,
        created: queued.created,
        requeued: queued.requeued,
      },
    }, { status: 202 });
  } catch (error: unknown) {
    console.error(
      "[audio-jobs] enqueue failed",
      error instanceof Error ? error.name : "unknown error",
    );
    return NextResponse.json(
      { ok: false, error: "No se pudo encolar el procesamiento" },
      { status: 500 },
    );
  }
}
