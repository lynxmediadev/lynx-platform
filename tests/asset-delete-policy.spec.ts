import { describe, expect, it, vi } from "vitest";

import { assetDeleteDecision } from "../src/lib/storage/asset-policy";
import { deleteTrackAssetStorageAndRecord } from "../src/lib/storage/delete-track-asset";

const admin = { id: "admin", role: "ADMIN" as const };
const owner = { id: "owner", role: "CREATOR" as const };
const other = { id: "other", role: "CREATOR" as const };

function decision(
  overrides: Partial<Parameters<typeof assetDeleteDecision>[0]> = {},
) {
  return assetDeleteDecision({
    trackExists: true,
    assetExists: true,
    actor: admin,
    ownerUserId: "owner",
    type: "STEM",
    isCurrent: false,
    verifiedAlternativeCount: 0,
    storageKey: "tracks/track-1/stem/file.wav",
    hasExplicitLegacyReference: false,
    ...overrides,
  });
}

describe("eliminación segura de TrackAsset", () => {
  it("rechaza una petición sin sesión", () => {
    expect(decision({ actor: null }).status).toBe(401);
  });

  it("rechaza un usuario que no administra el track", () => {
    expect(decision({ actor: other }).status).toBe(403);
    expect(decision({ actor: owner }).allowed).toBe(true);
  });

  it("trata un asset de otro track como no encontrado", () => {
    expect(decision({ assetExists: false }).status).toBe(404);
  });

  it.each(["PREVIEW", "MASTER"] as const)(
    "protege el %s vigente incluso cuando hay alternativas",
    (type) => {
      const result = decision({
        type,
        isCurrent: true,
        verifiedAlternativeCount: 1,
      });
      expect(result.allowed).toBe(false);
      expect(result.status).toBe(409);
      expect(result.error).toContain("Marca otro");
    },
  );

  it("protege el único preview vigente y exige subir un reemplazo", () => {
    const result = decision({ type: "PREVIEW", isCurrent: true });
    expect(result.allowed).toBe(false);
    expect(result.status).toBe(409);
    expect(result.error).toContain("Sube otro preview");
  });

  it("permite eliminar previews y masters históricos", () => {
    expect(decision({ type: "PREVIEW", isCurrent: false }).allowed).toBe(
      true,
    );
    expect(decision({ type: "MASTER", isCurrent: false }).allowed).toBe(true);
  });

  it("bloquea una referencia legacy exacta", () => {
    const result = decision({ hasExplicitLegacyReference: true });
    expect(result.allowed).toBe(false);
    expect(result.status).toBe(409);
  });

  it("bloquea una storageKey insegura", () => {
    const result = decision({ storageKey: "../other-track/master.wav" });
    expect(result.allowed).toBe(false);
    expect(result.status).toBe(409);
  });

  it("si R2 falla conserva el registro PostgreSQL", async () => {
    const deleteRecord = vi.fn(async () => 1);
    const markRecordMissing = vi.fn(async () => undefined);
    const result = await deleteTrackAssetStorageAndRecord({
      deleteObject: vi.fn(async () => {
        throw new Error("R2 unavailable");
      }),
      deleteRecord,
      markRecordMissing,
    });

    expect(result).toEqual({
      ok: false,
      phase: "storage",
      recordMarkedMissing: false,
    });
    expect(deleteRecord).not.toHaveBeenCalled();
    expect(markRecordMissing).not.toHaveBeenCalled();
  });

  it("si PostgreSQL falla marca el registro como MISSING", async () => {
    const markRecordMissing = vi.fn(async () => undefined);
    const result = await deleteTrackAssetStorageAndRecord({
      deleteObject: vi.fn(async () => undefined),
      deleteRecord: vi.fn(async () => {
        throw new Error("database unavailable");
      }),
      markRecordMissing,
    });

    expect(result).toEqual({
      ok: false,
      phase: "database",
      recordMarkedMissing: true,
    });
    expect(markRecordMissing).toHaveBeenCalledOnce();
  });

  it("considera seguro que el objeto R2 ya no exista y tolera una carrera de repetición", async () => {
    const result = await deleteTrackAssetStorageAndRecord({
      deleteObject: vi.fn(async () => undefined),
      deleteRecord: vi.fn(async () => 0),
      markRecordMissing: vi.fn(async () => undefined),
    });

    expect(result).toEqual({ ok: true, alreadyDeleted: true });
  });
});
