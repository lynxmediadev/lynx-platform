import { PromotionCampaignStatus } from "@prisma/client";

export function canManageShowcase(role: string) {
  return role === "ADMIN" || role === "STAFF";
}

export function parseDateOrNull(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date;
}

export function isLiveStatus(status: PromotionCampaignStatus) {
  return status === PromotionCampaignStatus.LIVE;
}

export function clampCampaignPriority(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(9999, Math.max(-9999, Math.round(value)));
}

export function normalizeSlotKey(raw: string) {
  return raw.trim().toLowerCase();
}

export function isValidSlotKey(slotKey: string) {
  return /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(slotKey);
}

export function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized ? normalized : null;
}
