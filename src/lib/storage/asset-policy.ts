export const TRACK_ASSET_TYPES = ["MASTER", "PREVIEW", "STEM", "ALTERNATE", "DELIVERABLE"] as const;
export type TrackAssetTypeValue = (typeof TRACK_ASSET_TYPES)[number];
export type AssetActor = { id: string | null; role: "ADMIN" | "STAFF" | "CREATOR" | "CLIENT" };

export const bucketForAssetType = (type: TrackAssetTypeValue) => type === "PREVIEW" ? "PREVIEWS" as const : "PRIVATE" as const;
export const accessForAssetType = (type: TrackAssetTypeValue) => type === "PREVIEW" ? "PUBLIC" as const : "PRIVATE" as const;
/** Un preview reemplaza deliberadamente al anterior; un master nuevo queda en historial salvo el primero. */
export const becomesCurrentOnUpload = (type: TrackAssetTypeValue, currentCount: number) => type === "PREVIEW" || (type === "MASTER" && currentCount === 0);
export const shouldProcessAsset = (type: TrackAssetTypeValue, isCurrent: boolean) => isCurrent && (type === "PREVIEW" || type === "MASTER");
export function isSafeStorageKey(key: string) {
  return Boolean(key && !key.startsWith("/") && !key.includes("\\") && !key.includes("..") && /^[a-z0-9][a-zA-Z0-9._/-]*$/.test(key));
}
export function canManageTrack(actor: AssetActor | null, ownerUserId: string | null) {
  if (!actor) return false;
  if (actor.role === "ADMIN" || actor.role === "STAFF") return true;
  return Boolean(actor.id && ownerUserId && actor.id === ownerUserId);
}
export function canReadAsset(input: { actor: AssetActor | null; ownerUserId: string | null; access: "PUBLIC" | "PRIVATE" }) {
  return input.access === "PUBLIC" || canManageTrack(input.actor, input.ownerUserId);
}
export function assetAccessDecision(input: { trackExists: boolean; assetExists: boolean; actor: AssetActor | null; ownerUserId: string | null; access: "PUBLIC" | "PRIVATE" }) {
  if (!input.trackExists) return { allowed: false as const, status: 404, error: "Track no encontrado" };
  if (!input.assetExists) return { allowed: false as const, status: 404, error: "Asset no encontrado" };
  if (!canReadAsset(input)) return { allowed: false as const, status: input.actor ? 403 : 401, error: input.actor ? "Forbidden" : "Unauthorized" };
  return { allowed: true as const, status: 200, error: null };
}
export function validateUploadMetadata(input: { mime: string; size: number; allowedMimes: string[]; maxBytes: number }) {
  const mime = input.mime.trim().toLowerCase();
  if (!input.allowedMimes.includes(mime)) return { ok: false as const, error: "MIME no permitido" };
  if (!Number.isSafeInteger(input.size) || input.size <= 0 || input.size > input.maxBytes) return { ok: false as const, error: "Tamaño de archivo no permitido" };
  return { ok: true as const, mime };
}
