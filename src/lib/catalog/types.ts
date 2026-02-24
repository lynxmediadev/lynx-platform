// src/lib/catalog/types.ts
export interface Track {
  id: string;
  title: string;
  artist: string;
  moods: string[];
  uses: string[];
  genres?: string[];
  bpm?: number;
  duration: string;
  key?: string;
  licenseType?: string | null;
  pricingTier?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  budgetCurrency?: string | null;
  clearedForSync?: boolean | null;
  audioUrl: string;
  coverUrl?: string | null;
  waveform?: number[];
}
