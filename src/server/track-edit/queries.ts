import prisma from "@/lib/prisma";
import { cache } from "react";
import type {
  CatalogTagOptionDTO,
  MoodTagOptionDTO,
  TrackAudioHeaderDTO,
  TrackAudioModuleDTO,
  TrackDeliverablesModuleDTO,
  TrackEditCoreDTO,
  TrackRightsModuleDTO,
  UseTagOptionDTO,
} from "./types";

export const getTrackEditCore = cache(async (id: string): Promise<TrackEditCoreDTO | null> => {
  return prisma.track.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      artist: true,
      isrc: true,
      iswc: true,
      upc: true,
      licenseType: true,
      mediaBuy: true,
      bpm: true,
      key: true,
      trackType: true,
      genres: true,
      subgenres: true,
      exclusiveTerritories: true,
      exclusiveTermMonths: true,
      restrictedTerritories: true,
      restrictedIndustries: true,
      restrictedPlatforms: true,
      restrictedBrands: true,
      restrictions: true,
      pricingTier: true,
      budgetMin: true,
      budgetMax: true,
      budgetCurrency: true,
      mfn: true,
      oneStop: true,
      clearedForSync: true,
      contentIdEnrolled: true,
      contentIdAdmin: true,
      contentIdWhitelist: true,
      tags: {
        select: {
          tag: { select: { id: true, slug: true, name: true, type: true } },
          assignedAt: true,
        },
        orderBy: { assignedAt: "asc" },
      },
    },
  });
});

export const getTrackAudioModule = cache(async (id: string): Promise<TrackAudioModuleDTO | null> => {
  return prisma.track.findUnique({
    where: { id },
    select: {
      id: true,
      audioUrl: true,
      coverUrl: true,
      assetKey: true,
      assetMime: true,
      assetSize: true,
      durationSec: true,
      sampleRateHz: true,
      channels: true,
      bitrateKbps: true,
      loudnessLufs: true,
      loudnessRangeLu: true,
      lraLowLufs: true,
      lraHighLufs: true,
      truePeakDbfs: true,
      waveform: true,
      analysisAt: true,
      assets: {
        where: { type: "PREVIEW", access: "PUBLIC", status: "VERIFIED" },
        select: { storageKey: true, type: true, access: true, status: true },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });
});

export const getTrackAudioHeaderModule = cache(async (id: string): Promise<TrackAudioHeaderDTO | null> => {
  return prisma.track.findUnique({
    where: { id },
    select: {
      id: true,
      audioUrl: true,
      coverUrl: true,
      assetKey: true,
    },
  });
});

export const getTrackRightsModule = cache(async (id: string): Promise<TrackRightsModuleDTO | null> => {
  return prisma.track.findUnique({
    where: { id },
    select: {
      id: true,
      master: true,
      publishingShares: {
        select: {
          id: true,
          role: true,
          name: true,
          ipiNumber: true,
          pro: true,
          caeNumber: true,
          sharePct: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      masterShares: {
        select: {
          id: true,
          name: true,
          sharePct: true,
          contact: true,
          notes: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
});

export const getTrackDeliverablesModule = cache(async (id: string): Promise<TrackDeliverablesModuleDTO | null> => {
  return prisma.track.findUnique({
    where: { id },
    select: {
      id: true,
      versions: {
        select: {
          label: true,
          durationSec: true,
          kind: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      stems: {
        select: {
          name: true,
          group: true,
          durationSec: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
});

export const getCatalogTagOptions = cache(async (): Promise<CatalogTagOptionDTO[]> => {
  return prisma.tag.findMany({
    where: { type: "CATALOG" },
    select: { id: true, slug: true, name: true },
    orderBy: { name: "asc" },
  });
});

export const getMoodTagOptions = cache(async (): Promise<MoodTagOptionDTO[]> => {
  return prisma.tag.findMany({
    where: { type: "MOOD" },
    select: { id: true, slug: true, name: true },
    orderBy: { name: "asc" },
  });
});

export const getUseTagOptions = cache(async (): Promise<UseTagOptionDTO[]> => {
  return prisma.tag.findMany({
    where: { type: "USE" },
    select: { id: true, slug: true, name: true },
    orderBy: { name: "asc" },
  });
});

export const getTagOptionsBundle = cache(
  async (): Promise<{
    moodOptions: MoodTagOptionDTO[];
    useOptions: UseTagOptionDTO[];
    catalogOptions: CatalogTagOptionDTO[];
  }> => {
    const rows = await prisma.tag.findMany({
      where: {
        type: { in: ["MOOD", "USE", "CATALOG"] },
      },
      select: { id: true, slug: true, name: true, type: true },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    const moodOptions: MoodTagOptionDTO[] = [];
    const useOptions: UseTagOptionDTO[] = [];
    const catalogOptions: CatalogTagOptionDTO[] = [];

    for (const row of rows) {
      const item = { id: row.id, slug: row.slug, name: row.name };
      if (row.type === "MOOD") moodOptions.push(item);
      else if (row.type === "USE") useOptions.push(item);
      else if (row.type === "CATALOG") catalogOptions.push(item);
    }

    return { moodOptions, useOptions, catalogOptions };
  },
);

export const getTrackCreativePageData = cache(async (id: string) => {
  return prisma.track.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      artist: true,
      audioUrl: true,
      coverUrl: true,
      assetKey: true,
      bpm: true,
      key: true,
      trackType: true,
      genres: true,
      subgenres: true,
      tags: {
        select: {
          tag: { select: { id: true, slug: true, name: true, type: true } },
          assignedAt: true,
        },
        orderBy: { assignedAt: "asc" },
      },
    },
  });
});

export const getTrackRightsPageData = cache(async (id: string) => {
  return prisma.track.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      artist: true,
      audioUrl: true,
      coverUrl: true,
      assetKey: true,
      mfn: true,
      oneStop: true,
      clearedForSync: true,
      contentIdEnrolled: true,
      contentIdAdmin: true,
      contentIdWhitelist: true,
      restrictions: true,
      master: true,
      publishingShares: {
        select: {
          id: true,
          role: true,
          name: true,
          ipiNumber: true,
          pro: true,
          caeNumber: true,
          sharePct: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      masterShares: {
        select: {
          id: true,
          name: true,
          sharePct: true,
          contact: true,
          notes: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
});

export const getTrackMetadataPageData = cache(async (id: string) => {
  return prisma.track.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      artist: true,
      audioUrl: true,
      coverUrl: true,
      assetKey: true,
      ownerUserId: true,
      isrc: true,
      iswc: true,
      upc: true,
      licenseType: true,
      mediaBuy: true,
      exclusiveTerritories: true,
      exclusiveTermMonths: true,
      restrictedTerritories: true,
      restrictedIndustries: true,
      restrictedPlatforms: true,
      restrictedBrands: true,
      restrictions: true,
      pricingTier: true,
      budgetMin: true,
      budgetMax: true,
      budgetCurrency: true,
      licenseAssignments: {
        select: {
          licenseTemplateId: true,
          isEnabled: true,
          sortOrder: true,
          priceOverride: true,
          summaryOverrideJson: true,
          termsOverrideJson: true,
          agreementOverrideText: true,
        },
        orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      },
    },
  });
});

export const getTrackDeliverablesPageData = cache(async (id: string) => {
  return prisma.track.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      artist: true,
      audioUrl: true,
      coverUrl: true,
      assetKey: true,
      versions: {
        select: {
          label: true,
          durationSec: true,
          kind: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      stems: {
        select: {
          name: true,
          group: true,
          durationSec: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
});

export const getTrackOverviewPageData = cache(async (id: string) => {
  return prisma.track.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      artist: true,
      isrc: true,
      iswc: true,
      upc: true,
      bpm: true,
      trackType: true,
      oneStop: true,
      clearedForSync: true,
      audioUrl: true,
      coverUrl: true,
      assetKey: true,
      tags: {
        select: {
          tag: { select: { id: true, slug: true, name: true, type: true } },
          assignedAt: true,
        },
        orderBy: { assignedAt: "asc" },
      },
      publishingShares: {
        select: {
          role: true,
          sharePct: true,
        },
      },
      masterShares: {
        select: {
          sharePct: true,
        },
      },
      _count: {
        select: {
          versions: true,
          stems: true,
        },
      },
    },
  });
});
