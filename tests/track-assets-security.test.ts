import { describe, expect, it } from "vitest";
import { accessForAssetType, assetAccessDecision, bucketForAssetType, canManageTrack, canReadAsset, isSafeStorageKey, validateUploadMetadata } from "../src/lib/storage/asset-policy";
import { signUploadClaim, verifyUploadClaim } from "../src/lib/storage/upload-claim";

const admin = { id: "admin", role: "ADMIN" as const };
const owner = { id: "owner", role: "CREATOR" as const };
const other = { id: "other", role: "CREATOR" as const };

describe("FASE 2: política de assets", () => {
  it("rechaza acceso privado sin sesión", () => expect(canReadAsset({ actor: null, ownerUserId: "owner", access: "PRIVATE" })).toBe(false));
  it("rechaza acceso privado de otro usuario", () => expect(canReadAsset({ actor: other, ownerUserId: "owner", access: "PRIVATE" })).toBe(false));
  it("autoriza acceso privado del owner", () => expect(canReadAsset({ actor: owner, ownerUserId: "owner", access: "PRIVATE" })).toBe(true));
  it("autoriza acceso privado de admin", () => expect(canReadAsset({ actor: admin, ownerUserId: "owner", access: "PRIVATE" })).toBe(true));
  it("mantiene previews públicos", () => expect(canReadAsset({ actor: null, ownerUserId: null, access: "PUBLIC" })).toBe(true));
  it("rechaza creador ajeno para administrar", () => expect(canManageTrack(other, "owner")).toBe(false));
  it("envía PREVIEW al bucket público", () => expect(bucketForAssetType("PREVIEW")).toBe("PREVIEWS"));
  it.each(["MASTER", "STEM", "ALTERNATE", "DELIVERABLE"] as const)("envía %s al bucket privado", (type) => expect(bucketForAssetType(type)).toBe("PRIVATE"));
  it("marca MASTER privado", () => expect(accessForAssetType("MASTER")).toBe("PRIVATE"));
  it("acepta MIME y tamaño válidos", () => expect(validateUploadMetadata({ mime: "audio/mpeg", size: 100, allowedMimes: ["audio/mpeg"], maxBytes: 1000 }).ok).toBe(true));
  it("rechaza MIME no permitido", () => expect(validateUploadMetadata({ mime: "text/html", size: 100, allowedMimes: ["audio/mpeg"], maxBytes: 1000 }).ok).toBe(false));
  it("rechaza tamaño excesivo", () => expect(validateUploadMetadata({ mime: "audio/mpeg", size: 1001, allowedMimes: ["audio/mpeg"], maxBytes: 1000 }).ok).toBe(false));
  it.each(["../secret.wav", "/root.wav", "tracks\\other.wav", "tracks/a/../../other.wav"])("rechaza key manipulada: %s", (key) => expect(isSafeStorageKey(key)).toBe(false));
  it("acepta key generada por servidor", () => expect(isSafeStorageKey("tracks/id/preview/2026/09/06/uuid-audio.mp3")).toBe(true));
  it("responde 404 si el track no existe", () => expect(assetAccessDecision({ trackExists: false, assetExists: false, actor: admin, ownerUserId: null, access: "PRIVATE" }).status).toBe(404));
  it("responde 404 si el asset no existe", () => expect(assetAccessDecision({ trackExists: true, assetExists: false, actor: admin, ownerUserId: "owner", access: "PRIVATE" }).status).toBe(404));
  it("rechaza una firma alterada", () => {
    process.env.ASSET_UPLOAD_SIGNING_SECRET = "test-secret-with-at-least-32-characters";
    const token = signUploadClaim({ key: "tracks/id/preview/a.mp3", bucket: "PREVIEWS", assetType: "PREVIEW", mime: "audio/mpeg", size: 10, actorId: "admin", trackId: null, exp: Math.floor(Date.now() / 1000) + 60 });
    expect(verifyUploadClaim(`${token}x`)).toBeNull();
  });
  it("rechaza una firma expirada", () => {
    process.env.ASSET_UPLOAD_SIGNING_SECRET = "test-secret-with-at-least-32-characters";
    const token = signUploadClaim({ key: "tracks/id/preview/a.mp3", bucket: "PREVIEWS", assetType: "PREVIEW", mime: "audio/mpeg", size: 10, actorId: "admin", trackId: null, exp: Math.floor(Date.now() / 1000) - 1 });
    expect(verifyUploadClaim(token)).toBeNull();
  });
});
