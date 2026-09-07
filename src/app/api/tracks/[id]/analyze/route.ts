// src/app/api/tracks/[id]/analyze/route.ts
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Route Handler: POST /api/tracks/[id]/analyze                               │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Recibe el ID de un track desde la ruta dinámica `[id]`.                  │
 * │ - Ejecuta analyzeTrackById(id), que:                                       │
 * │     • Descarga el audio (assetKey/audioUrl).                               │
 * │     • Corre ffprobe (duración, sample rate, canales, bitrate).             │
 * │     • Corre ebur128/loudnorm (LUFS, LRA, True Peak).                       │
 * │     • Genera waveform y actualiza la fila del track en Prisma.            │
 * │ - Devuelve un JSON con:                                                    │
 * │     { ok: true, updated, warnings, debug }.                                │
 * │ - Publica el payload en globalThis.__lynx_last_payload para debug admin.   │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Nota técnica (Next 15):                                                    │
 * │ - En Next 15, `params` en route handlers se recibe como Promise, por lo    │
 * │   que debes hacer `const { id } = await params;` en vez de usar            │
 * │   `context.params.id` directamente.                                        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeTrackById } from "@/lib/audio/analyze";
import { canAccessTrackByRole, getRequestAuthUser } from "@/lib/account-auth/request-auth";
import { audioProcessingMode, enqueueAudioJob } from "@/lib/audio-jobs/queue";
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
    (globalThis as any).__lynx_last_payload = payload;
    return NextResponse.json(payload, { status: 400 });
  }

  try {
    if (audioProcessingMode() === "queue") {
      const asset = await prisma.trackAsset.findFirst({
        where: { trackId: id, status: "VERIFIED", type: { in: ["MASTER", "PREVIEW"] } },
        orderBy: [{ type: "asc" }, { updatedAt: "desc" }],
        select: { id: true },
      });
      if (!asset) {
        return NextResponse.json({ ok: false, error: "El track no tiene un master o preview verificado" }, { status: 409 });
      }
      const queued = await enqueueAudioJob({ trackId: id, assetId: asset.id });
      return NextResponse.json({
        ok: true,
        queued: true,
        job: { id: queued.job.id, status: queued.job.status, created: queued.created, requeued: queued.requeued },
      }, { status: 202 });
    }

    const { updated, warnings, debug } = await analyzeTrackById(id);

    const payload = {
      ok: true,
      updated,
      warnings,
      debug,
    };

    (globalThis as any).__lynx_last_payload = payload;
    return NextResponse.json(payload);
  } catch (e: any) {
    const payload: any = {
      ok: false,
      error: e?.message ?? "Analyze error",
    };

    if (e?.code) {
      payload.code = e.code;
    }

    if (process.env.DEBUG_AUDIO) {
      payload.extra = { stack: e?.stack };
    }

    (globalThis as any).__lynx_last_payload = payload;
    return NextResponse.json(payload, { status: 500 });
  }
}
