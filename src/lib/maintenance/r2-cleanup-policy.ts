export const DEFAULT_PENDING_TTL_HOURS = 24;

export type R2CleanupObject = {
  key: string;
  lastModified: Date | null;
  referencedInDatabase: boolean;
  assetStatus: string | null;
};

export type R2CleanupDecision = {
  candidate: boolean;
  reason:
    | "database-reference"
    | "verified-asset"
    | "recent-or-active"
    | "missing-object-date"
    | "abandoned-pending"
    | "review-only-legacy";
  ageHours: number | null;
};

export function classifyR2Object(
  object: R2CleanupObject,
  input: { now: Date; ttlHours: number; prefix: "pending" | "legacy" },
): R2CleanupDecision {
  const ageHours = object.lastModified
    ? Math.max(0, (input.now.getTime() - object.lastModified.getTime()) / 3_600_000)
    : null;

  if (object.assetStatus === "VERIFIED") {
    return { candidate: false, reason: "verified-asset", ageHours };
  }
  if (object.referencedInDatabase) {
    return { candidate: false, reason: "database-reference", ageHours };
  }
  if (input.prefix === "legacy") {
    return { candidate: false, reason: "review-only-legacy", ageHours };
  }
  if (ageHours === null) {
    return { candidate: false, reason: "missing-object-date", ageHours };
  }
  if (ageHours < input.ttlHours) {
    return { candidate: false, reason: "recent-or-active", ageHours };
  }
  return { candidate: true, reason: "abandoned-pending", ageHours };
}
