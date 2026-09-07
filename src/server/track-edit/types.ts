import type { TagType } from "@prisma/client";

export type TrackTagAssignmentDTO = {
  tag: {
    id: string;
    slug: string;
    name: string;
    type: TagType;
  };
  assignedAt: Date;
};

export type TrackEditCoreDTO = {
  id: string;
  title: string | null;
  artist: string | null;
  isrc: string | null;
  iswc: string | null;
  upc: string | null;
  licenseType: string | null;
  mediaBuy: string | null;
  bpm: number | null;
  key: string | null;
  trackType: string | null;
  genres: string[];
  subgenres: string[];
  exclusiveTerritories: string[];
  exclusiveTermMonths: number | null;
  restrictedTerritories: string[];
  restrictedIndustries: string[];
  restrictedPlatforms: string[];
  restrictedBrands: string[];
  restrictions: string[];
  pricingTier: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetCurrency: string | null;
  mfn: boolean | null;
  oneStop: boolean | null;
  clearedForSync: boolean | null;
  contentIdEnrolled: boolean | null;
  contentIdAdmin: string | null;
  contentIdWhitelist: string | null;
  tags: TrackTagAssignmentDTO[];
};

export type TrackAudioModuleDTO = {
  id: string;
  audioUrl: string | null;
  coverUrl: string | null;
  assetKey: string | null;
  assetMime: string | null;
  assetSize: number | null;
  durationSec: number | null;
  sampleRateHz: number | null;
  channels: number | null;
  bitrateKbps: number | null;
  loudnessLufs: number | null;
  loudnessRangeLu: number | null;
  lraLowLufs: number | null;
  lraHighLufs: number | null;
  truePeakDbfs: number | null;
  waveform: Buffer | Uint8Array | null;
  analysisAt: Date | null;
  assets: Array<{ storageKey: string; type: string; access: string; status: string }>;
};

export type TrackAudioHeaderDTO = {
  id: string;
  audioUrl: string | null;
  coverUrl: string | null;
  assetKey: string | null;
};

export type TrackRightsModuleDTO = {
  id: string;
  master: string | null;
  masterShares: Array<{
    id: string;
    name: string;
    sharePct: number | null;
    contact: string | null;
    notes: string | null;
    sortOrder: number | null;
  }>;
  publishingShares: Array<{
    id: string;
    role: "WRITER" | "PUBLISHER";
    name: string;
    sharePct: number | null;
    ipiNumber: string | null;
    pro: string | null;
    caeNumber: string | null;
    sortOrder: number | null;
  }>;
};

export type TrackDeliverablesModuleDTO = {
  id: string;
  versions: Array<{
    label: string;
    durationSec: number | null;
    kind: string | null;
    sortOrder: number | null;
  }>;
  stems: Array<{
    name: string;
    group: string | null;
    durationSec: number | null;
    sortOrder: number | null;
  }>;
};

export type CatalogTagOptionDTO = { id: string; slug: string; name: string };
export type MoodTagOptionDTO = { id: string; slug: string; name: string };
export type UseTagOptionDTO = { id: string; slug: string; name: string };
