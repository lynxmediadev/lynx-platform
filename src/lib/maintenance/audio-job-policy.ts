export const DEFAULT_STALE_PENDING_HOURS = 24;
export const DEFAULT_READY_RETENTION_DAYS = 30;
export const DEFAULT_FAILED_RETENTION_DAYS = 90;

type JobLike = {
  status: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
  lockedAt: Date | null;
  completedAt: Date | null;
  hasVerifiedPreview: boolean;
};

export type AudioJobFinding =
  | "stale-pending"
  | "expired-lease"
  | "ready-without-preview"
  | "failed-exhausted"
  | "ready-retention-candidate"
  | "failed-retention-candidate";

export function classifyAudioJob(
  job: JobLike,
  input: {
    now: Date;
    leaseMs: number;
    stalePendingHours?: number;
    readyRetentionDays?: number;
    failedRetentionDays?: number;
  },
) {
  const findings: AudioJobFinding[] = [];
  const stalePendingMs =
    (input.stalePendingHours ?? DEFAULT_STALE_PENDING_HOURS) * 3_600_000;
  const readyRetentionMs =
    (input.readyRetentionDays ?? DEFAULT_READY_RETENTION_DAYS) * 86_400_000;
  const failedRetentionMs =
    (input.failedRetentionDays ?? DEFAULT_FAILED_RETENTION_DAYS) * 86_400_000;

  if (
    job.status === "PENDING" &&
    input.now.getTime() - job.updatedAt.getTime() >= stalePendingMs
  ) {
    findings.push("stale-pending");
  }
  if (
    job.status === "PROCESSING" &&
    job.lockedAt &&
    input.now.getTime() - job.lockedAt.getTime() >= input.leaseMs
  ) {
    findings.push("expired-lease");
  }
  if (job.status === "READY" && !job.hasVerifiedPreview) {
    findings.push("ready-without-preview");
  }
  if (job.status === "FAILED" && job.attempts >= job.maxAttempts) {
    findings.push("failed-exhausted");
  }
  if (
    job.status === "READY" &&
    job.completedAt &&
    input.now.getTime() - job.completedAt.getTime() >= readyRetentionMs
  ) {
    findings.push("ready-retention-candidate");
  }
  if (
    job.status === "FAILED" &&
    job.completedAt &&
    input.now.getTime() - job.completedAt.getTime() >= failedRetentionMs
  ) {
    findings.push("failed-retention-candidate");
  }

  return findings;
}
