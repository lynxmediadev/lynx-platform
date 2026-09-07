import { NextRequest, NextResponse } from "next/server";
import { canAccessTrackByRole, getRequestAuthUser } from "@/lib/account-auth/request-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestAuthUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const job = await prisma.audioJob.findUnique({
    where: { id },
    select: { id: true, trackId: true, status: true, attempts: true, maxAttempts: true, availableAt: true, startedAt: true, completedAt: true, updatedAt: true, errorMessage: true },
  });
  if (!job) return NextResponse.json({ ok: false, error: "Job no encontrado" }, { status: 404 });
  if (!await canAccessTrackByRole(user, job.trackId)) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ ok: true, job });
}
