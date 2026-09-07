import { AudioJobStatus, Prisma } from "@prisma/client";
import type { AudioJob } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { nextRetryAt, sanitizeAudioJobError } from "./state";

export const AUDIO_JOB_LEASE_MS = 10 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 3;

export function audioJobIdempotencyKey(trackId: string, assetId?: string | null) {
  return `process-asset:${assetId ?? trackId}`;
}

export function sanitizeJobError(error: unknown) {
  return sanitizeAudioJobError(error);
}

export async function enqueueAudioJob(input: {
  trackId: string;
  assetId?: string | null;
  maxAttempts?: number;
}) {
  const idempotencyKey = audioJobIdempotencyKey(input.trackId, input.assetId);
  const maxAttempts = Math.max(1, Math.min(input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS, 10));
  const existing = await prisma.audioJob.findUnique({ where: { idempotencyKey } });
  if (existing) {
    if (existing.status === "FAILED") {
      const job = await prisma.audioJob.update({
        where: { id: existing.id },
        data: { status: "PENDING", attempts: 0, availableAt: new Date(), lockedAt: null, lockedBy: null, startedAt: null, completedAt: null, errorMessage: null },
      });
      return { job, created: false, requeued: true };
    }
    return { job: existing, created: false, requeued: false };
  }

  try {
    const job = await prisma.audioJob.create({
      data: { trackId: input.trackId, assetId: input.assetId ?? null, maxAttempts, idempotencyKey },
    });
    return { job, created: true, requeued: false };
  } catch (error: unknown) {
    if ((error as { code?: string }).code !== "P2002") throw error;
    const job = await prisma.audioJob.findUniqueOrThrow({ where: { idempotencyKey } });
    return { job, created: false, requeued: false };
  }
}

export async function recoverExpiredAudioJobs(now = new Date()) {
  const leaseCutoff = new Date(now.getTime() - AUDIO_JOB_LEASE_MS);
  const failed = await prisma.$executeRaw`
    UPDATE "AudioJob"
    SET "status" = 'FAILED'::"AudioJobStatus", "completedAt" = ${now},
        "lockedAt" = NULL, "lockedBy" = NULL,
        "errorMessage" = 'Worker lease expired after final attempt', "updatedAt" = ${now}
    WHERE "status" = 'PROCESSING'::"AudioJobStatus"
      AND "lockedAt" < ${leaseCutoff}
      AND "attempts" >= "maxAttempts"
  `;
  const requeued = await prisma.$executeRaw`
    UPDATE "AudioJob"
    SET "status" = 'PENDING'::"AudioJobStatus", "availableAt" = ${now},
        "lockedAt" = NULL, "lockedBy" = NULL,
        "errorMessage" = 'Worker lease expired; requeued', "updatedAt" = ${now}
    WHERE "status" = 'PROCESSING'::"AudioJobStatus"
      AND "lockedAt" < ${leaseCutoff}
      AND "attempts" < "maxAttempts"
  `;
  return { requeued: Number(requeued), failed: Number(failed) };
}

export async function claimNextAudioJob(workerId: string, now = new Date()): Promise<AudioJob | null> {
  await recoverExpiredAudioJobs(now);
  const claimed = await prisma.$transaction(async tx => {
    const rows = await tx.$queryRaw<AudioJob[]>(Prisma.sql`
      WITH candidate AS (
        SELECT "id"
        FROM "AudioJob"
        WHERE "status" = 'PENDING'::"AudioJobStatus"
          AND "availableAt" <= ${now}
          AND "attempts" < "maxAttempts"
        ORDER BY "availableAt" ASC, "createdAt" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE "AudioJob" AS job
      SET "status" = 'PROCESSING'::"AudioJobStatus",
          "attempts" = job."attempts" + 1,
          "lockedAt" = ${now},
          "lockedBy" = ${workerId},
          "startedAt" = COALESCE(job."startedAt", ${now}),
          "errorMessage" = NULL,
          "updatedAt" = ${now}
      FROM candidate
      WHERE job."id" = candidate."id"
      RETURNING job.*
    `);
    return rows[0] ?? null;
  });
  return claimed;
}

export async function markAudioJobReady(jobId: string, workerId: string) {
  const result = await prisma.audioJob.updateMany({
    where: { id: jobId, status: AudioJobStatus.PROCESSING, lockedBy: workerId },
    data: { status: AudioJobStatus.READY, completedAt: new Date(), lockedAt: null, lockedBy: null, errorMessage: null },
  });
  if (result.count !== 1) throw new Error("Audio job lease was lost before completion");
}

export async function markAudioJobFailure(jobId: string, workerId: string, error: unknown) {
  const job = await prisma.audioJob.findFirst({ where: { id: jobId, status: "PROCESSING", lockedBy: workerId } });
  if (!job) return null;
  const message = sanitizeJobError(error);
  const exhausted = job.attempts >= job.maxAttempts;
  const availableAt = nextRetryAt(job.attempts);
  await prisma.audioJob.update({
    where: { id: job.id },
    data: exhausted
      ? { status: "FAILED", completedAt: new Date(), lockedAt: null, lockedBy: null, errorMessage: message }
      : { status: "PENDING", availableAt, lockedAt: null, lockedBy: null, errorMessage: message },
  });
  return { exhausted, message };
}

export async function retryAudioJob(jobId: string) {
  const job = await prisma.audioJob.findUniqueOrThrow({ where: { id: jobId } });
  if (job.status === "PROCESSING") throw new Error("No se puede reintentar un job en procesamiento");
  return prisma.audioJob.update({
    where: { id: job.id },
    data: { status: "PENDING", attempts: 0, availableAt: new Date(), completedAt: null, lockedAt: null, lockedBy: null, errorMessage: null },
  });
}
