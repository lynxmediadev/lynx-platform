import type { Track } from "@/lib/catalog/types";

export type CatalogTrack = Track & {
  waveformB64?: string | null;
  durationSec?: number | null;
};

export type ProgressMap = Record<string, number>;

export type CatalogLicenseCard = {
  id: string;
  title: string;
  price: string;
  formats: string;
  note: string;
};
