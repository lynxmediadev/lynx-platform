// src/app/api/tracks/[id]/audio-check/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { getAudioCheckStatus } from "@/lib/audio/audio-check";
import { canAccessTrackByRole, getRequestAuthUser } from "@/lib/account-auth/request-auth";
import { resolvePublicTrackAudio } from "@/lib/storage/public-track-audio";

export const dynamic = "force-dynamic";

type AudioCheckParams = {
  id: string;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<AudioCheckParams> },
) {
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
    return NextResponse.json({ ok: false, error: "Falta id en la ruta" }, { status: 400 });
  }

  const track = await db.track.findUnique({
    where: { id },
    select: {
      audioUrl: true,
      assetKey: true,
      assets: {
        where: { type: "PREVIEW", access: "PUBLIC", status: "VERIFIED" },
        select: { storageKey: true, type: true, access: true, status: true },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });

  const audioUrl = track ? resolvePublicTrackAudio(track) : "";
  if (!audioUrl) {
    return NextResponse.json({ ok: false, error: "Audio URL vacío" }, { status: 400 });
  }

  const audioCheck = await getAudioCheckStatus(audioUrl, {
    cacheKey: id,
  });

  if (audioCheck.status === "ok") {
    return NextResponse.json({
      ok: true,
      audioUrl,
      resolvedAudioUrl: audioCheck.resolvedAudioUrl,
    });
  }

  return NextResponse.json(
    { ok: false, error: audioCheck.message ?? "Audio URL no accesible" },
    { status: 400 },
  );
}
