export type AdminAssetType =
  | "MASTER"
  | "PREVIEW"
  | "STEM"
  | "ALTERNATE"
  | "DELIVERABLE";

export const adminAssetTypeLabels: Record<AdminAssetType, string> = {
  PREVIEW: "Preview",
  MASTER: "Master",
  STEM: "Stem",
  ALTERNATE: "Versión",
  DELIVERABLE: "Entregable",
};

export function clampAudioValue(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function formatAudioTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const safe = Math.floor(Math.max(0, seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}
