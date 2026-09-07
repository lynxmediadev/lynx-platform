import "server-only";
import { getPublicPreviewUrl, getS3PublicUrl } from "@/lib/storage/s3";

type PreviewAsset = { storageKey: string; status: string; access: string; type: string };
export function resolvePublicTrackAudio(input: { assets?: PreviewAsset[] | null; assetKey?: string | null; audioUrl?: string | null }) {
  const preview = input.assets?.find((asset) => asset.type === "PREVIEW" && asset.access === "PUBLIC" && asset.status === "VERIFIED");
  if (preview) return getPublicPreviewUrl(preview.storageKey);
  const key = input.assetKey?.trim() || "";
  if (key.startsWith("external:///")) return `/${key.replace(/^external:\/\/\//, "")}`;
  if (key.startsWith("external://")) {
    const value = key.replace(/^external:\/\//, "");
    return /^https?:\/\//i.test(value) || value.startsWith("/") ? value : `/${value}`;
  }
  if (key) return getS3PublicUrl(key) || input.audioUrl?.trim() || "";
  return input.audioUrl?.trim() || "";
}
