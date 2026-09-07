import { PrismaClient } from "@prisma/client";
import { AUDIO_JOB_LEASE_MS, recoverExpiredAudioJobs } from "../src/lib/audio-jobs/queue";
import {
  classifyAudioJob,
  DEFAULT_FAILED_RETENTION_DAYS,
  DEFAULT_READY_RETENTION_DAYS,
  DEFAULT_STALE_PENDING_HOURS,
} from "../src/lib/maintenance/audio-job-policy";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const confirmation = argument("--confirm");
const now = new Date();

function argument(name: string) {
  const exact = process.argv.find((item) => item.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  if (apply && confirmation !== "MAINTAIN_AUDIO_JOBS") {
    throw new Error(
      "Los cambios requieren --apply --confirm MAINTAIN_AUDIO_JOBS; ejecuta dry-run primero",
    );
  }
  const jobs = await prisma.audioJob.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      track: {
        select: {
          assets: {
            where: { type: "PREVIEW", access: "PUBLIC", status: "VERIFIED" },
            select: { id: true },
            take: 1,
          },
        },
      },
    },
  });
  const assetPolicyMismatches = await prisma.trackAsset.findMany({
    where: {
      OR: [
        { type: "PREVIEW", OR: [{ bucket: { not: "PREVIEWS" } }, { access: { not: "PUBLIC" } }] },
        { type: { not: "PREVIEW" }, OR: [{ bucket: { not: "PRIVATE" } }, { access: { not: "PRIVATE" } }] },
      ],
    },
    select: { id: true, trackId: true, type: true, access: true, bucket: true, status: true },
  });
  const findings = jobs.map((job) => ({
    id: job.id,
    trackId: job.trackId,
    status: job.status,
    attempts: job.attempts,
    maxAttempts: job.maxAttempts,
    findings: classifyAudioJob(
      { ...job, hasVerifiedPreview: job.track.assets.length > 0 },
      {
        now,
        leaseMs: AUDIO_JOB_LEASE_MS,
        stalePendingHours: DEFAULT_STALE_PENDING_HOURS,
        readyRetentionDays: DEFAULT_READY_RETENTION_DAYS,
        failedRetentionDays: DEFAULT_FAILED_RETENTION_DAYS,
      },
    ),
  }));
  const retentionIds = findings
    .filter((item) =>
      item.findings.some(
        (finding) =>
          finding === "ready-retention-candidate" || finding === "failed-retention-candidate",
      ),
    )
    .map((item) => item.id);

  let recovery = { requeued: 0, failed: 0 };
  let pruned = 0;
  if (apply) {
    recovery = await recoverExpiredAudioJobs();
    if (retentionIds.length > 0) {
      const result = await prisma.audioJob.deleteMany({
        where: { id: { in: retentionIds }, status: { in: ["READY", "FAILED"] } },
      });
      pruned = result.count;
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        policy: {
          stalePendingHours: DEFAULT_STALE_PENDING_HOURS,
          leaseMinutes: AUDIO_JOB_LEASE_MS / 60_000,
          readyRetentionDays: DEFAULT_READY_RETENTION_DAYS,
          failedRetentionDays: DEFAULT_FAILED_RETENTION_DAYS,
        },
        totalJobs: jobs.length,
        jobsWithFindings: findings.filter((item) => item.findings.length > 0),
        assetPolicyMismatches,
        plannedPrune: retentionIds.length,
        recovery,
        pruned,
      },
      null,
      2,
    ),
  );
}

void main()
  .catch((error: unknown) => {
    console.error(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "unknown error" }),
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
