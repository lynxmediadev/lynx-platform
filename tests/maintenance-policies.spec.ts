import { describe, expect, it } from "vitest";
import { classifyAudioJob } from "../src/lib/maintenance/audio-job-policy";
import { classifyR2Object } from "../src/lib/maintenance/r2-cleanup-policy";

const now = new Date("2026-09-07T12:00:00.000Z");

describe("FASE 5: cleanup seguro de staging R2", () => {
  it("protege todo asset VERIFIED aunque esté bajo pending/", () => {
    expect(
      classifyR2Object(
        {
          key: "pending/user/preview.mp3",
          lastModified: new Date("2026-08-01T00:00:00.000Z"),
          referencedInDatabase: true,
          assetStatus: "VERIFIED",
        },
        { now, ttlHours: 24, prefix: "pending" },
      ),
    ).toMatchObject({ candidate: false, reason: "verified-asset" });
  });

  it("protege uploads recientes y propone solo pending abandonado", () => {
    const recent = classifyR2Object(
      {
        key: "pending/user/recent.mp3",
        lastModified: new Date("2026-09-07T11:00:00.000Z"),
        referencedInDatabase: false,
        assetStatus: null,
      },
      { now, ttlHours: 24, prefix: "pending" },
    );
    const abandoned = classifyR2Object(
      {
        key: "pending/user/old.mp3",
        lastModified: new Date("2026-09-01T00:00:00.000Z"),
        referencedInDatabase: false,
        assetStatus: null,
      },
      { now, ttlHours: 24, prefix: "pending" },
    );
    expect(recent).toMatchObject({ candidate: false, reason: "recent-or-active" });
    expect(abandoned).toMatchObject({ candidate: true, reason: "abandoned-pending" });
  });

  it("deja todo legacy como revisión manual", () => {
    expect(
      classifyR2Object(
        {
          key: "legacy-previews/old.mp3",
          lastModified: new Date("2025-01-01T00:00:00.000Z"),
          referencedInDatabase: false,
          assetStatus: null,
        },
        { now, ttlHours: 24, prefix: "legacy" },
      ),
    ).toMatchObject({ candidate: false, reason: "review-only-legacy" });
  });
});

describe("FASE 5: reconciliación AudioJob", () => {
  const base = {
    attempts: 1,
    maxAttempts: 3,
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    updatedAt: new Date("2026-09-01T00:00:00.000Z"),
    lockedAt: null,
    completedAt: null,
    hasVerifiedPreview: true,
  };

  it("detecta PENDING antiguo y lease expirado", () => {
    expect(
      classifyAudioJob(
        { ...base, status: "PENDING" },
        { now, leaseMs: 600_000 },
      ),
    ).toContain("stale-pending");
    expect(
      classifyAudioJob(
        {
          ...base,
          status: "PROCESSING",
          lockedAt: new Date("2026-09-07T11:40:00.000Z"),
        },
        { now, leaseMs: 600_000 },
      ),
    ).toContain("expired-lease");
  });

  it("detecta READY sin preview y FAILED agotado", () => {
    expect(
      classifyAudioJob(
        { ...base, status: "READY", hasVerifiedPreview: false },
        { now, leaseMs: 600_000 },
      ),
    ).toContain("ready-without-preview");
    expect(
      classifyAudioJob(
        { ...base, status: "FAILED", attempts: 3 },
        { now, leaseMs: 600_000 },
      ),
    ).toContain("failed-exhausted");
  });

  it("nunca propone retención para jobs activos", () => {
    const findings = classifyAudioJob(
      { ...base, status: "PROCESSING", lockedAt: now },
      { now, leaseMs: 600_000 },
    );
    expect(findings).not.toContain("ready-retention-candidate");
    expect(findings).not.toContain("failed-retention-candidate");
  });
});
