import prisma from "@/lib/prisma";
import type { Track } from "@/lib/catalog/types";

type CatalogTrack = Track & {
  waveformB64?: string | null;
  durationSec?: number | null;
};

function formatDurationSec(durationSec?: number | null): string {
  if (!durationSec || durationSec <= 0 || Number.isNaN(durationSec)) return "—";
  const m = Math.floor(durationSec / 60);
  const s = Math.floor(durationSec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function bytesToBase64(buf: Buffer | Uint8Array | null): string | null {
  if (!buf) return null;
  return Buffer.from(buf).toString("base64");
}

function mapTrackToCatalogTrack(track: {
  id: string;
  title: string;
  artist: string;
  genres: string[];
  bpm: number | null;
  key: string | null;
  licenseType: string | null;
  pricingTier: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetCurrency: string | null;
  clearedForSync: boolean | null;
  audioUrl: string;
  coverUrl: string | null;
  durationSec: number | null;
  waveform?: Buffer | Uint8Array | null;
  tags: Array<{ tag: { name: string; type: string } | null }>;
}): CatalogTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    moods: track.tags
      .filter((tagLink) => tagLink.tag?.type === "MOOD")
      .map((tagLink) => tagLink.tag?.name || "")
      .filter(Boolean),
    uses: track.tags
      .filter((tagLink) => tagLink.tag?.type === "USE")
      .map((tagLink) => tagLink.tag?.name || "")
      .filter(Boolean),
    genres: track.genres
      .map((genre) => genre.trim())
      .filter(Boolean),
    bpm: track.bpm ?? undefined,
    key: track.key ?? undefined,
    licenseType: track.licenseType,
    pricingTier: track.pricingTier,
    budgetMin: track.budgetMin,
    budgetMax: track.budgetMax,
    budgetCurrency: track.budgetCurrency,
    clearedForSync: track.clearedForSync,
    durationSec: track.durationSec ?? null,
    duration: formatDurationSec(track.durationSec),
    audioUrl: track.audioUrl,
    coverUrl: track.coverUrl,
    waveformB64: bytesToBase64((track.waveform as Buffer | null) ?? null),
  };
}

export async function fetchPlaylistCatalogTracks(params: {
  playlistId: string;
  ownerUserId?: string | null;
  isAutoAllTracks?: boolean;
  limit?: number;
}) {
  const take = Math.min(Math.max(params.limit ?? 120, 1), 300);

  if (params.isAutoAllTracks && params.ownerUserId) {
    const tracks = await prisma.track.findMany({
      where: { ownerUserId: params.ownerUserId },
      orderBy: { updatedAt: "desc" },
      take,
      select: {
        id: true,
        title: true,
        artist: true,
        genres: true,
        bpm: true,
        key: true,
        licenseType: true,
        pricingTier: true,
        budgetMin: true,
        budgetMax: true,
        budgetCurrency: true,
        clearedForSync: true,
        audioUrl: true,
        coverUrl: true,
        durationSec: true,
        waveform: true,
        tags: {
          where: { tag: { type: { in: ["MOOD", "USE"] } } },
          select: { tag: { select: { name: true, type: true } } },
        },
      },
    });
    return tracks.map(mapTrackToCatalogTrack);
  }

  const trackLinks = await prisma.playlistTrack.findMany({
    where: { playlistId: params.playlistId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take,
    select: {
      track: {
        select: {
          id: true,
          title: true,
          artist: true,
          genres: true,
          bpm: true,
          key: true,
          licenseType: true,
          pricingTier: true,
          budgetMin: true,
          budgetMax: true,
          budgetCurrency: true,
          clearedForSync: true,
          audioUrl: true,
          coverUrl: true,
          durationSec: true,
          waveform: true,
          tags: {
            where: { tag: { type: { in: ["MOOD", "USE"] } } },
            select: { tag: { select: { name: true, type: true } } },
          },
        },
      },
    },
  });

  return trackLinks.map((link) => mapTrackToCatalogTrack(link.track));
}
