import { NextRequest, NextResponse } from "next/server";
import { canAccessTrackByRole, getRequestAuthUser } from "@/lib/account-auth/request-auth";
import { retryAudioJob } from "@/lib/audio-jobs/queue";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestAuthUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.audioJob.findUnique({ where: { id }, select: { trackId: true } });
  if (!existing) return NextResponse.json({ ok: false, error: "Job no encontrado" }, { status: 404 });
  if (!await canAccessTrackByRole(user, existing.trackId)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  try {
    const job = await retryAudioJob(id);
    return NextResponse.json({ ok: true, job: { id: job.id, status: job.status, attempts: job.attempts } }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "No se pudo reintentar" }, { status: 409 });
  }
}
