import {
  BannerPlacement,
  BannerTargetType,
  PlaylistStatus,
  PlaylistVisibility,
  PromotionCampaignStatus,
  ServiceCategory,
  ServiceOfferStatus,
  SoundKitStatus,
} from "@prisma/client";
import prisma from "@/lib/prisma";
import type { CatalogHeroSlide } from "@/lib/banner-promotions/types";

const DEFAULT_DURATION_MS = 5000;
const MIN_DURATION_MS = 2000;
const MAX_DURATION_MS = 15000;

const FALLBACK_IMAGES = [
  "/images/hero/hero-bg-1.png",
  "/images/hero/hero-bg-2.png",
  "/images/hero/hero-bg-3.png",
  "/images/hero/hero-bg-4.png",
];

const LEGACY_SLOT_BY_PLACEMENT: Record<BannerPlacement, string> = {
  CATALOG_HERO: "catalog.hero.main",
};

type PromotionCandidate = {
  id: string;
  name: string;
  startsAt: Date | null;
  updatedAt: Date;
  priority?: number;
};

type ResolvedSlidesMeta = {
  slides: CatalogHeroSlide[];
  activePromotionId: string | null;
};

type ResolvedShowcaseSlides = ResolvedSlidesMeta & {
  slotId: string | null;
  slotKey: string;
};

function isInWindow(params: { now: Date; startsAt?: Date | null; endsAt?: Date | null }) {
  if (params.startsAt && params.startsAt > params.now) return false;
  if (params.endsAt && params.endsAt < params.now) return false;
  return true;
}

function normalizeDurationMs(value: number | null | undefined) {
  const raw = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : DEFAULT_DURATION_MS;
  return Math.min(MAX_DURATION_MS, Math.max(MIN_DURATION_MS, raw));
}

function hashToPositiveInt(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function isSafeHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function sanitizeHref(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return fallback;
  if (trimmed.startsWith("/")) return trimmed;
  if (isSafeHttpUrl(trimmed)) return trimmed;
  return fallback;
}

function sanitizeImage(value: string | null | undefined, fallbackKey: string) {
  const trimmed = value?.trim() ?? "";
  if (trimmed.startsWith("/")) return trimmed;
  if (isSafeHttpUrl(trimmed)) return trimmed;
  return FALLBACK_IMAGES[hashToPositiveInt(fallbackKey) % FALLBACK_IMAGES.length] ?? FALLBACK_IMAGES[0]!;
}

function serviceHrefByCategory(category: ServiceCategory) {
  if (category === "MIX_MASTER") return "/servicios/mix";
  if (category === "SOUND_DESIGN") return "/servicios/sound-design";
  return "/servicios/design";
}

function clampLimit(limit: number | undefined, fallback = 12) {
  return Math.min(Math.max(limit ?? fallback, 1), 40);
}

function pickEffectivePromotion(candidates: PromotionCandidate[]) {
  if (candidates.length === 0) return null;

  return candidates
    .slice()
    .sort((a, b) => {
      const aPriority = a.priority ?? 0;
      const bPriority = b.priority ?? 0;
      if (bPriority !== aPriority) return bPriority - aPriority;

      const aStarts = a.startsAt?.getTime() ?? Number.NEGATIVE_INFINITY;
      const bStarts = b.startsAt?.getTime() ?? Number.NEGATIVE_INFINITY;
      if (bStarts !== aStarts) return bStarts - aStarts;

      return b.updatedAt.getTime() - a.updatedAt.getTime();
    })[0] ?? null;
}

async function resolveSlidesForPromotion(params: {
  promotionId: string;
  limit: number;
  now: Date;
}): Promise<CatalogHeroSlide[]> {
  const items = await prisma.bannerPromotionItem.findMany({
    where: {
      promotionId: params.promotionId,
      isEnabled: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: params.now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: params.now } }] },
      ],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: params.limit,
    select: {
      id: true,
      targetType: true,
      targetId: true,
      titleOverride: true,
      subtitleOverride: true,
      imageUrlOverride: true,
      ctaLabel: true,
      ctaHrefOverride: true,
      durationMs: true,
      startsAt: true,
      endsAt: true,
    },
  });

  if (items.length === 0) return [];

  const activeItems = items.filter((item) =>
    isInWindow({ now: params.now, startsAt: item.startsAt, endsAt: item.endsAt }),
  );
  if (activeItems.length === 0) return [];

  const trackIds = activeItems
    .filter((item) => item.targetType === "TRACK" && item.targetId)
    .map((item) => item.targetId!) as string[];

  const playlistIds = activeItems
    .filter((item) => item.targetType === "PLAYLIST" && item.targetId)
    .map((item) => item.targetId!) as string[];

  const soundKitIds = activeItems
    .filter((item) => item.targetType === "SOUND_KIT" && item.targetId)
    .map((item) => item.targetId!) as string[];

  const serviceIds = activeItems
    .filter((item) => item.targetType === "SERVICE_OFFER" && item.targetId)
    .map((item) => item.targetId!) as string[];

  const artistNames = activeItems
    .filter((item) => item.targetType === "ARTIST" && item.targetId)
    .map((item) => item.targetId!.trim())
    .filter(Boolean);

  const [tracks, playlists, soundKits, services, artists] = await Promise.all([
    trackIds.length
      ? prisma.track.findMany({
          where: { id: { in: trackIds } },
          select: {
            id: true,
            title: true,
            artist: true,
            bpm: true,
            coverUrl: true,
            audioUrl: true,
          },
        })
      : Promise.resolve([]),
    playlistIds.length
      ? prisma.playlist.findMany({
          where: { id: { in: playlistIds } },
          select: {
            id: true,
            name: true,
            description: true,
            publicId: true,
            coverUrl: true,
            status: true,
            visibility: true,
          },
        })
      : Promise.resolve([]),
    soundKitIds.length
      ? prisma.soundKit.findMany({
          where: { id: { in: soundKitIds } },
          select: {
            id: true,
            name: true,
            description: true,
            slug: true,
            coverUrl: true,
            status: true,
          },
        })
      : Promise.resolve([]),
    serviceIds.length
      ? prisma.serviceOffer.findMany({
          where: { id: { in: serviceIds } },
          select: {
            id: true,
            name: true,
            description: true,
            slug: true,
            status: true,
            category: true,
          },
        })
      : Promise.resolve([]),
    artistNames.length
      ? prisma.track.findMany({
          where: { artist: { in: artistNames } },
          select: {
            id: true,
            artist: true,
            title: true,
            coverUrl: true,
            audioUrl: true,
          },
          distinct: ["artist"],
          orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        })
      : Promise.resolve([]),
  ]);

  const trackMap = new Map(tracks.map((row) => [row.id, row]));
  const playlistMap = new Map(playlists.map((row) => [row.id, row]));
  const soundKitMap = new Map(soundKits.map((row) => [row.id, row]));
  const serviceMap = new Map(services.map((row) => [row.id, row]));
  const artistMap = new Map(artists.map((row) => [row.artist.trim(), row]));

  const slides: CatalogHeroSlide[] = [];

  for (const item of activeItems) {
    const durationMs = normalizeDurationMs(item.durationMs);

    if (item.targetType === BannerTargetType.TRACK) {
      const track = item.targetId ? trackMap.get(item.targetId) : null;
      if (!track || !track.audioUrl?.trim()) continue;

      slides.push({
        id: item.id,
        promotionId: params.promotionId,
        promotionItemId: item.id,
        sourceType: "TRACK",
        sourceId: track.id,
        title: item.titleOverride?.trim() || track.title,
        subtitle:
          item.subtitleOverride?.trim() ||
          `${track.artist}${track.bpm ? ` · ${Math.round(track.bpm)} BPM` : ""}`,
        imageUrl: sanitizeImage(item.imageUrlOverride || track.coverUrl, `${item.id}:track`),
        ctaLabel: item.ctaLabel?.trim() || "Ir al track",
        ctaHref: sanitizeHref(item.ctaHrefOverride, `/track/${track.id}`),
        playableTrackId: track.id,
        durationMs,
      });
      continue;
    }

    if (item.targetType === BannerTargetType.PLAYLIST) {
      const playlist = item.targetId ? playlistMap.get(item.targetId) : null;
      if (!playlist || playlist.status !== PlaylistStatus.PUBLISHED || playlist.visibility !== PlaylistVisibility.PUBLIC) {
        continue;
      }

      slides.push({
        id: item.id,
        promotionId: params.promotionId,
        promotionItemId: item.id,
        sourceType: "PLAYLIST",
        sourceId: playlist.id,
        title: item.titleOverride?.trim() || playlist.name,
        subtitle: item.subtitleOverride?.trim() || playlist.description?.trim() || "Playlist destacada",
        imageUrl: sanitizeImage(item.imageUrlOverride || playlist.coverUrl, `${item.id}:playlist`),
        ctaLabel: item.ctaLabel?.trim() || "Ir a playlist",
        ctaHref: sanitizeHref(item.ctaHrefOverride, `/playlist/${playlist.publicId}`),
        playableTrackId: null,
        durationMs,
      });
      continue;
    }

    if (item.targetType === BannerTargetType.SOUND_KIT) {
      const soundKit = item.targetId ? soundKitMap.get(item.targetId) : null;
      if (!soundKit || soundKit.status !== SoundKitStatus.PUBLISHED) continue;

      slides.push({
        id: item.id,
        promotionId: params.promotionId,
        promotionItemId: item.id,
        sourceType: "SOUND_KIT",
        sourceId: soundKit.id,
        title: item.titleOverride?.trim() || soundKit.name,
        subtitle: item.subtitleOverride?.trim() || soundKit.description?.trim() || "Sound kit destacado",
        imageUrl: sanitizeImage(item.imageUrlOverride || soundKit.coverUrl, `${item.id}:sound-kit`),
        ctaLabel: item.ctaLabel?.trim() || "Ver detalle",
        ctaHref: sanitizeHref(item.ctaHrefOverride, "/catalog"),
        playableTrackId: null,
        durationMs,
      });
      continue;
    }

    if (item.targetType === BannerTargetType.SERVICE_OFFER) {
      const service = item.targetId ? serviceMap.get(item.targetId) : null;
      if (!service || service.status !== ServiceOfferStatus.ACTIVE) continue;

      slides.push({
        id: item.id,
        promotionId: params.promotionId,
        promotionItemId: item.id,
        sourceType: "SERVICE_OFFER",
        sourceId: service.id,
        title: item.titleOverride?.trim() || service.name,
        subtitle: item.subtitleOverride?.trim() || service.description?.trim() || "Servicio destacado",
        imageUrl: sanitizeImage(item.imageUrlOverride, `${item.id}:service`),
        ctaLabel: item.ctaLabel?.trim() || "Ver servicio",
        ctaHref: sanitizeHref(item.ctaHrefOverride, serviceHrefByCategory(service.category)),
        playableTrackId: null,
        durationMs,
      });
      continue;
    }

    if (item.targetType === BannerTargetType.ARTIST) {
      const artistName = item.targetId?.trim();
      if (!artistName) continue;
      const artist = artistMap.get(artistName);
      if (!artist) continue;

      slides.push({
        id: item.id,
        promotionId: params.promotionId,
        promotionItemId: item.id,
        sourceType: "ARTIST",
        sourceId: artist.artist,
        title: item.titleOverride?.trim() || artist.artist,
        subtitle: item.subtitleOverride?.trim() || `Explora tracks de ${artist.artist}`,
        imageUrl: sanitizeImage(item.imageUrlOverride || artist.coverUrl, `${item.id}:artist`),
        ctaLabel: item.ctaLabel?.trim() || "Ver artista",
        ctaHref: sanitizeHref(item.ctaHrefOverride, `/catalog?artist=${encodeURIComponent(artist.artist)}`),
        playableTrackId: artist.audioUrl?.trim() ? artist.id : null,
        durationMs,
      });
      continue;
    }

    if (item.targetType === BannerTargetType.EXTERNAL_URL) {
      const href = sanitizeHref(item.ctaHrefOverride, "");
      if (!href) continue;

      slides.push({
        id: item.id,
        promotionId: params.promotionId,
        promotionItemId: item.id,
        sourceType: "EXTERNAL_URL",
        sourceId: item.targetId?.trim() || null,
        title: item.titleOverride?.trim() || "Contenido destacado",
        subtitle: item.subtitleOverride?.trim() || "Promoción externa",
        imageUrl: sanitizeImage(item.imageUrlOverride, `${item.id}:external`),
        ctaLabel: item.ctaLabel?.trim() || "Abrir",
        ctaHref: href,
        playableTrackId: null,
        durationMs,
      });
    }
  }

  return slides;
}

async function resolveByLegacyPlacement(params: {
  placement: BannerPlacement;
  now: Date;
  limit: number;
}): Promise<ResolvedSlidesMeta> {
  const candidates = await prisma.bannerPromotion.findMany({
    where: {
      placement: params.placement,
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: params.now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: params.now } }] },
      ],
    },
    select: {
      id: true,
      name: true,
      startsAt: true,
      updatedAt: true,
      priority: true,
    },
  });

  const active = pickEffectivePromotion(candidates);
  if (!active) return { slides: [], activePromotionId: null };

  const slides = await resolveSlidesForPromotion({
    promotionId: active.id,
    now: params.now,
    limit: params.limit,
  });

  return {
    slides,
    activePromotionId: active.id,
  };
}

export async function resolveShowcaseSlides(params: {
  slotKey: string;
  now?: Date;
  limit?: number;
}) {
  const resolved = await resolveShowcaseSlidesWithMeta(params);
  return resolved.slides;
}

export async function resolveShowcaseSlidesWithMeta(params: {
  slotKey: string;
  now?: Date;
  limit?: number;
}): Promise<ResolvedShowcaseSlides> {
  const now = params.now ?? new Date();
  const limit = clampLimit(params.limit);

  const slot = await prisma.promotionSlot.findUnique({
    where: { key: params.slotKey },
    select: { id: true, key: true, isEnabled: true },
  });

  if (!slot || !slot.isEnabled) {
    return {
      slides: [],
      activePromotionId: null,
      slotId: slot?.id ?? null,
      slotKey: params.slotKey,
    };
  }

  const candidates = await prisma.bannerPromotion.findMany({
    where: {
      slotId: slot.id,
      status: PromotionCampaignStatus.LIVE,
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    select: {
      id: true,
      name: true,
      startsAt: true,
      updatedAt: true,
      priority: true,
    },
  });

  const active = pickEffectivePromotion(candidates);
  if (!active) {
    return {
      slides: [],
      activePromotionId: null,
      slotId: slot.id,
      slotKey: slot.key,
    };
  }

  const slides = await resolveSlidesForPromotion({
    promotionId: active.id,
    now,
    limit,
  });

  return {
    slides,
    activePromotionId: active.id,
    slotId: slot.id,
    slotKey: slot.key,
  };
}

export async function resolveBannerSlides(params: {
  placement: BannerPlacement;
  now?: Date;
  limit?: number;
}): Promise<CatalogHeroSlide[]> {
  const resolved = await resolveBannerSlidesWithMeta(params);
  return resolved.slides;
}

export async function resolveBannerSlidesWithMeta(params: {
  placement: BannerPlacement;
  now?: Date;
  limit?: number;
}): Promise<ResolvedSlidesMeta> {
  const slotKey = LEGACY_SLOT_BY_PLACEMENT[params.placement];
  if (slotKey) {
    const bySlot = await resolveShowcaseSlidesWithMeta({
      slotKey,
      now: params.now,
      limit: params.limit,
    });

    if (bySlot.slides.length > 0 || bySlot.activePromotionId) {
      return {
        slides: bySlot.slides,
        activePromotionId: bySlot.activePromotionId,
      };
    }
  }

  const now = params.now ?? new Date();
  const limit = clampLimit(params.limit);
  return resolveByLegacyPlacement({
    placement: params.placement,
    now,
    limit,
  });
}

export async function trackBannerPromotionEvent(params: {
  placement: BannerPlacement;
  itemId?: string | null;
  eventType: "VIEW" | "CLICK_CTA" | "CLICK_PLAY";
  sessionId?: string | null;
  path?: string | null;
  userAgent?: string | null;
  ip?: string | null;
}) {
  await prisma.bannerPromotionEvent.create({
    data: {
      placement: params.placement,
      itemId: params.itemId ?? null,
      eventType: params.eventType,
      sessionId: params.sessionId ?? null,
      path: params.path ?? null,
      userAgent: params.userAgent ?? null,
      ip: params.ip ?? null,
    },
  });
}
