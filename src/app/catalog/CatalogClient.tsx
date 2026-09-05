"use client";
/* eslint-disable @next/next/no-img-element -- Las portadas y campañas usan URLs dinámicas de R2. */

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import {
  TrackCollectionBrowser,
  type CatalogTrack,
  type ProgressMap,
} from "@/components/catalog/adapters";
import {
  useGlobalPlayer,
  useGlobalPlayerState,
  type GlobalPlayerTrack,
} from "@/components/player/global-player-context";
import { cn } from "@/lib/utils";
import type { CatalogHeroSlide } from "@/lib/banner-promotions/types";

type Props = {
  tracks: CatalogTrack[];
  heroSlides?: CatalogHeroSlide[];
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  embedded?: boolean;
  compact?: boolean;
  hideHeader?: boolean;
  showDetailPanel?: boolean;
  showFilteringControls?: boolean;
  catalogSlug?: string;
  categories?: { slug: string; name: string }[];
};

type BannerSlideView = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaHref: string;
  ctaLabel: string;
  durationMs: number;
  track: CatalogTrack | null;
  promotionItemId: string | null;
};

const FALLBACK_BANNER_IMAGES = [
  "/images/hero/hero-bg-1.png",
  "/images/hero/hero-bg-2.png",
  "/images/hero/hero-bg-3.png",
  "/images/hero/hero-bg-4.png",
];
const MIN_BANNER_SLIDES = 10;
const VIEW_MODE_STORAGE_KEY = "catalog:view-mode";
const INITIAL_TRACK_LIMIT = 30;
const TRACK_BATCH_SIZE = 30;

type CatalogViewMode = "grid" | "list";

function isCatalogViewMode(value: unknown): value is CatalogViewMode {
  return value === "grid" || value === "list";
}

function parseDurationSeconds(value?: string | null): number {
  if (!value) return 0;
  const parts = value.trim().split(":");
  if (parts.length === 2) {
    const minutes = Number(parts[0]);
    const seconds = Number(parts[1]);
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return 0;
    return Math.max(0, minutes * 60 + seconds);
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
}

function formatTime(seconds: number): string {
  const normalized = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(normalized / 60);
  const secs = normalized % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function parseOptionalNumber(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) return null;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
}

function resolveDuration(track: CatalogTrack | null): number {
  if (!track) return 0;
  if (
    track.durationSec &&
    Number.isFinite(track.durationSec) &&
    track.durationSec > 0
  ) {
    return Math.floor(track.durationSec);
  }
  return parseDurationSeconds(track.duration);
}

function hashToPositiveInt(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function resolveCatalogCoverUrl(track: CatalogTrack): string {
  const cleanCover = track.coverUrl?.trim();
  if (cleanCover) return cleanCover;
  return (
    FALLBACK_BANNER_IMAGES[
      hashToPositiveInt(track.id) % FALLBACK_BANNER_IMAGES.length
    ] ?? FALLBACK_BANNER_IMAGES[0]!
  );
}

function toGlobalPlayerTrack(track: CatalogTrack): GlobalPlayerTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist || "Artista",
    audioUrl: track.audioUrl,
    coverUrl: resolveCatalogCoverUrl(track),
    waveformB64: track.waveformB64 ?? null,
    durationSec: track.durationSec ?? null,
  };
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href.trim());
}

function getTrackDurationLabel(track: CatalogTrack): string {
  if (track.duration && track.duration !== "—") return track.duration;
  const durationSec = resolveDuration(track);
  return durationSec > 0 ? formatTime(durationSec) : "—";
}

function formatLicenseTypeLabel(value?: string | null): string | null {
  if (!value) return null;
  switch (value) {
    case "NON_EXCLUSIVE":
      return "No exclusiva";
    case "EXCLUSIVE":
      return "Exclusiva";
    case "LIMITED_EXCLUSIVE":
      return "Exclusiva limitada";
    case "BUYOUT":
      return "Buyout";
    default:
      return value;
  }
}

function formatPricingTierLabel(value?: string | null): string | null {
  if (!value) return null;
  switch (value) {
    case "LOW":
      return "Low";
    case "MID":
      return "Mid";
    case "HIGH":
      return "High";
    case "BESPOKE":
      return "Bespoke";
    default:
      return value;
  }
}

function formatCurrencyAmount(
  amount: number | null | undefined,
  currency: string | null | undefined,
): string | null {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return null;
  const code = (currency ?? "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${code} ${Math.round(amount)}`;
  }
}

type CatalogLicenseCard = {
  id: string;
  title: string;
  price: string;
  formats: string;
  note: string;
};

function deriveCatalogLicenseCards(track: CatalogTrack): CatalogLicenseCard[] {
  const min =
    typeof track.budgetMin === "number" && Number.isFinite(track.budgetMin)
      ? track.budgetMin
      : null;
  const max =
    typeof track.budgetMax === "number" && Number.isFinite(track.budgetMax)
      ? track.budgetMax
      : null;

  let standard = min;
  let premium: number | null = null;
  let exclusive = max;

  if (min !== null && max !== null) {
    premium = Math.round(min + (max - min) * 0.45);
  } else if (min !== null) {
    premium = Math.round(min * 1.6);
    exclusive = Math.round(min * 2.4);
  } else if (max !== null) {
    standard = Math.round(max * 0.45);
    premium = Math.round(max * 0.7);
    exclusive = max;
  }

  const price = (amount: number | null) =>
    formatCurrencyAmount(amount, track.budgetCurrency) ?? "A cotizar";
  const tierLabel = formatPricingTierLabel(track.pricingTier);
  const licenseType = (track.licenseType ?? "").toUpperCase();

  const standardCard: CatalogLicenseCard = {
    id: "standard",
    title: "Licencia estándar",
    price: price(standard),
    formats: "MP3",
    note: "Uso digital base",
  };
  const premiumCard: CatalogLicenseCard = {
    id: "premium",
    title: "Licencia ampliada",
    price: price(premium),
    formats: "MP3, WAV",
    note: "Mayor flexibilidad de uso",
  };
  const exclusiveCard: CatalogLicenseCard = {
    id: "exclusive",
    title: "Licencia exclusiva",
    price: price(exclusive),
    formats: "MP3, WAV, STEMS",
    note: tierLabel ? `Tier ${tierLabel}` : "Asignación exclusiva del asset",
  };

  if (licenseType === "EXCLUSIVE" || licenseType === "BUYOUT") {
    return [exclusiveCard];
  }
  if (licenseType === "NON_EXCLUSIVE") {
    return [standardCard, premiumCard];
  }
  return [standardCard, premiumCard, exclusiveCard];
}

function normalizeTags(values?: string[] | null, max = 8): string[] {
  if (!Array.isArray(values) || values.length === 0) return [];
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, max);
}

export default function CatalogClient({
  tracks,
  heroSlides,
  title = "ODR Records Catalog",
  subtitle = "Explora el catálogo por carátula y revisa el detalle del track seleccionado.",
  eyebrow = "ODR Records",
  embedded = false,
  hideHeader = false,
  compact = false,
  showDetailPanel = true,
  showFilteringControls,
  catalogSlug,
  categories = [],
}: Props) {
  const router = useRouter();
  const {
    currentTrack: globalCurrentTrack,
    isPlaying,
    currentSec: globalCurrentSec,
    durationSec: globalDurationSec,
    progress: globalProgress,
  } = useGlobalPlayerState();
  const {
    playTrack: playGlobalTrack,
    togglePlay,
    seekByRatio,
  } = useGlobalPlayer();
  const bannerSessionIdRef = useRef<string>(
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `banner-${Date.now()}`,
  );

  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(
    tracks[0]?.id ?? null,
  );
  const [activeCat, setActiveCat] = useState<string | null>(
    catalogSlug ?? null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMood, setActiveMood] = useState("all");
  const [activeUse, setActiveUse] = useState("all");
  const [activeGenre, setActiveGenre] = useState("all");
  const [bpmMin, setBpmMin] = useState("");
  const [bpmMax, setBpmMax] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [viewMode, setViewMode] = useState<CatalogViewMode>("grid");
  const [visibleTrackLimit, setVisibleTrackLimit] =
    useState(INITIAL_TRACK_LIMIT);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const shouldShowFilteringControls = showFilteringControls ?? !compact;
  const effectiveViewMode: CatalogViewMode = compact ? "grid" : viewMode;

  const moodOptions = useMemo(() => {
    const set = new Set<string>();
    for (const track of tracks) {
      for (const mood of track.moods) {
        const cleanMood = mood.trim();
        if (cleanMood) set.add(cleanMood);
      }
    }
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" }),
    );
  }, [tracks]);

  const useOptions = useMemo(() => {
    const set = new Set<string>();
    for (const track of tracks) {
      for (const use of track.uses) {
        const cleanUse = use.trim();
        if (cleanUse) set.add(cleanUse);
      }
    }
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" }),
    );
  }, [tracks]);

  const genreOptions = useMemo(() => {
    const set = new Set<string>();
    for (const track of tracks) {
      for (const genre of track.genres ?? []) {
        const cleanGenre = genre.trim();
        if (cleanGenre) set.add(cleanGenre);
      }
    }
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" }),
    );
  }, [tracks]);

  const visibleTracks = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase();
    const rawMin = parseOptionalNumber(bpmMin);
    const rawMax = parseOptionalNumber(bpmMax);
    const minBpm =
      rawMin !== null && rawMax !== null ? Math.min(rawMin, rawMax) : rawMin;
    const maxBpm =
      rawMin !== null && rawMax !== null ? Math.max(rawMin, rawMax) : rawMax;

    return tracks.filter((track) => {
      const matchesMood =
        activeMood === "all" ||
        track.moods.some(
          (mood) => mood.toLowerCase() === activeMood.toLowerCase(),
        );
      if (!matchesMood) return false;

      const matchesUse =
        activeUse === "all" ||
        track.uses.some((use) => use.toLowerCase() === activeUse.toLowerCase());
      if (!matchesUse) return false;

      const trackGenres = track.genres ?? [];
      const matchesGenre =
        activeGenre === "all" ||
        trackGenres.some(
          (genre) => genre.toLowerCase() === activeGenre.toLowerCase(),
        );
      if (!matchesGenre) return false;

      if (minBpm !== null || maxBpm !== null) {
        if (typeof track.bpm !== "number" || !Number.isFinite(track.bpm))
          return false;
        if (minBpm !== null && track.bpm < minBpm) return false;
        if (maxBpm !== null && track.bpm > maxBpm) return false;
      }

      if (!query) return true;
      const haystack =
        `${track.title} ${track.artist} ${track.moods.join(" ")} ${track.uses.join(
          " ",
        )} ${trackGenres.join(" ")} ${track.bpm ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [
    tracks,
    deferredSearchTerm,
    activeMood,
    activeUse,
    activeGenre,
    bpmMin,
    bpmMax,
  ]);

  const displayedTracks = useMemo(
    () => visibleTracks.slice(0, visibleTrackLimit),
    [visibleTracks, visibleTrackLimit],
  );

  // Keep the selected ID valid when a filter removes the current track. The
  // detail panel and the collection browser both consume this same ID, rather
  // than independently falling back to the first card.
  useEffect(() => {
    if (visibleTracks.length === 0) {
      if (selectedTrackId !== null) setSelectedTrackId(null);
      return;
    }

    if (!visibleTracks.some((track) => track.id === selectedTrackId)) {
      setSelectedTrackId(visibleTracks[0]?.id ?? null);
    }
  }, [visibleTracks, selectedTrackId]);

  const bannerSourceTracks = useMemo(
    () => (visibleTracks.length > 0 ? visibleTracks : tracks),
    [visibleTracks, tracks],
  );

  const trackById = useMemo(
    () => new Map(tracks.map((track) => [track.id, track])),
    [tracks],
  );

  const bannerSlides = useMemo<BannerSlideView[]>(() => {
    const slides: BannerSlideView[] = [];

    if (heroSlides && heroSlides.length > 0) {
      slides.push(
        ...heroSlides.map((slide) => ({
          id: slide.id,
          title: slide.title,
          subtitle: slide.subtitle,
          imageUrl: slide.imageUrl,
          ctaHref: slide.ctaHref,
          ctaLabel: slide.ctaLabel,
          durationMs: slide.durationMs,
          track: slide.playableTrackId
            ? (trackById.get(slide.playableTrackId) ?? null)
            : null,
          promotionItemId: slide.promotionItemId ?? null,
        })),
      );
    } else if (bannerSourceTracks.length > 0) {
      slides.push(
        ...bannerSourceTracks.slice(0, MIN_BANNER_SLIDES).map((track) => ({
          id: track.id,
          title: track.title,
          subtitle: track.artist
            ? `${track.artist}${track.bpm ? ` · ${Math.round(track.bpm)} BPM` : ""}`
            : subtitle,
          imageUrl: resolveCatalogCoverUrl(track),
          ctaHref: `/track/${track.id}`,
          ctaLabel: "Ir al track",
          durationMs: 5000,
          track,
          promotionItemId: null,
        })),
      );
    }

    if (slides.length < MIN_BANNER_SLIDES) {
      const usedTrackIds = new Set(
        slides
          .map((slide) => slide.track?.id)
          .filter(
            (trackId): trackId is string =>
              typeof trackId === "string" && trackId.length > 0,
          ),
      );

      for (const track of bannerSourceTracks) {
        if (slides.length >= MIN_BANNER_SLIDES) break;
        if (usedTrackIds.has(track.id)) continue;

        usedTrackIds.add(track.id);
        slides.push({
          id: `autofill-track-${track.id}`,
          title: track.title,
          subtitle: track.artist
            ? `${track.artist}${track.bpm ? ` · ${Math.round(track.bpm)} BPM` : ""}`
            : subtitle,
          imageUrl: resolveCatalogCoverUrl(track),
          ctaHref: `/track/${track.id}`,
          ctaLabel: "Ir al track",
          durationMs: 5000,
          track,
          promotionItemId: null,
        });
      }
    }

    if (slides.length < MIN_BANNER_SLIDES) {
      let fallbackIndex = 0;
      while (slides.length < MIN_BANNER_SLIDES) {
        const imageUrl =
          FALLBACK_BANNER_IMAGES[
            fallbackIndex % FALLBACK_BANNER_IMAGES.length
          ] ?? FALLBACK_BANNER_IMAGES[0]!;
        const nextIndex = slides.length + 1;
        slides.push({
          id: `autofill-fallback-${nextIndex}`,
          title,
          subtitle,
          imageUrl,
          ctaHref: "/catalog",
          ctaLabel: "Explorar catálogo",
          durationMs: 5000,
          track: null,
          promotionItemId: null,
        });
        fallbackIndex += 1;
      }
    }

    return slides;
  }, [heroSlides, trackById, bannerSourceTracks, title, subtitle]);

  const activeBannerSlide =
    bannerSlides[activeSlideIndex] ?? bannerSlides[0] ?? null;

  const selectedTrack = useMemo(
    () => visibleTracks.find((track) => track.id === selectedTrackId) ?? null,
    [selectedTrackId, visibleTracks],
  );

  const playbackQueue = useMemo(
    () => (visibleTracks.length > 0 ? visibleTracks : tracks),
    [visibleTracks, tracks],
  );
  const playbackQueueGlobal = useMemo(
    () => playbackQueue.map((track) => toGlobalPlayerTrack(track)),
    [playbackQueue],
  );
  const currentTrackId = globalCurrentTrack?.id ?? null;
  const progressMap = useMemo<ProgressMap>(() => {
    if (!globalCurrentTrack) return {};
    return { [globalCurrentTrack.id]: globalProgress };
  }, [globalCurrentTrack, globalProgress]);

  useEffect(() => {
    setActiveCat(catalogSlug ?? null);
  }, [catalogSlug]);

  useEffect(() => {
    setVisibleTrackLimit(INITIAL_TRACK_LIMIT);
  }, [deferredSearchTerm, activeMood, activeUse, activeGenre, bpmMin, bpmMax]);

  useEffect(() => {
    if (compact || typeof window === "undefined") return;
    try {
      const storedValue = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (isCatalogViewMode(storedValue)) {
        setViewMode(storedValue);
      }
    } catch {
      // ignore storage access issues
    }
  }, [compact]);

  useEffect(() => {
    if (bannerSlides.length === 0) {
      setActiveSlideIndex(0);
      return;
    }
    setActiveSlideIndex((prev) => Math.min(prev, bannerSlides.length - 1));
  }, [bannerSlides.length]);

  useEffect(() => {
    if (hideHeader || bannerSlides.length <= 1) return;

    const activeDuration =
      activeBannerSlide && Number.isFinite(activeBannerSlide.durationMs)
        ? Math.max(2000, activeBannerSlide.durationMs)
        : 5000;

    const timerId = window.setTimeout(() => {
      setActiveSlideIndex((prev) => (prev + 1) % bannerSlides.length);
    }, activeDuration);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [hideHeader, bannerSlides.length, activeSlideIndex, activeBannerSlide]);

  useEffect(() => {
    if (!activeBannerSlide) return;
    trackHeroEvent("VIEW", activeBannerSlide);
  }, [activeBannerSlide]);

  const playTrack = (track: CatalogTrack) => {
    if (currentTrackId === track.id) {
      togglePlay();
      return;
    }

    setSelectedTrackId(track.id);
    playGlobalTrack(toGlobalPlayerTrack(track), {
      queue: playbackQueueGlobal,
      queuePolicy: "replace",
      queueSource: "catalog",
    });
  };

  const seekTrack = (track: CatalogTrack, ratio: number) => {
    const nextRatio = Math.max(0, Math.min(1, ratio));

    if (currentTrackId === track.id) {
      seekByRatio(nextRatio);
      if (!isPlaying) {
        togglePlay();
      }
      return;
    }

    setSelectedTrackId(track.id);
    playGlobalTrack(toGlobalPlayerTrack(track), {
      queue: playbackQueueGlobal,
      queuePolicy: "replace",
      queueSource: "catalog",
      seekRatio: nextRatio,
    });
  };

  const handleCategoryChange = (slug: string | null) => {
    const next = slug === activeCat ? null : slug;
    setActiveCat(next);

    const url = next ? `/catalog?cat=${encodeURIComponent(next)}` : "/catalog";
    router.replace(url);
    router.refresh();
  };

  const handleViewModeChange = (nextMode: CatalogViewMode) => {
    setViewMode(nextMode);
    if (compact || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, nextMode);
    } catch {
      // ignore storage access issues
    }
  };

  const trackHeroEvent = (
    eventType: "VIEW" | "CLICK_CTA" | "CLICK_PLAY",
    slide: BannerSlideView | null,
  ) => {
    if (!slide?.promotionItemId) return;
    const payload = {
      placement: "CATALOG_HERO" as const,
      itemId: slide.promotionItemId,
      eventType,
      sessionId: bannerSessionIdRef.current,
      path:
        typeof window !== "undefined" ? window.location.pathname : "/catalog",
    };

    void fetch("/api/catalog/hero-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => undefined);
  };

  const goToSlide = (index: number) => {
    if (bannerSlides.length === 0) return;
    setActiveSlideIndex(Math.max(0, Math.min(index, bannerSlides.length - 1)));
  };

  const goPrevSlide = () => {
    if (bannerSlides.length <= 1) return;
    setActiveSlideIndex(
      (prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length,
    );
  };

  const goNextSlide = () => {
    if (bannerSlides.length <= 1) return;
    setActiveSlideIndex((prev) => (prev + 1) % bannerSlides.length);
  };

  const hasActiveTrackFilters =
    searchTerm.trim().length > 0 ||
    activeMood !== "all" ||
    activeUse !== "all" ||
    activeGenre !== "all" ||
    bpmMin.trim().length > 0 ||
    bpmMax.trim().length > 0;

  const clearTrackFilters = (options?: { focusSearch?: boolean }) => {
    setSearchTerm("");
    setActiveMood("all");
    setActiveUse("all");
    setActiveGenre("all");
    setBpmMin("");
    setBpmMax("");

    if (options?.focusSearch) {
      setMobileFiltersOpen(true);
      requestAnimationFrame(() => {
        const searchInputs = Array.from(
          document.querySelectorAll<HTMLInputElement>(
            'input[data-catalog-search="true"]',
          ),
        );
        const visibleSearchInput = searchInputs.find(
          (input) => input.offsetParent !== null && !input.disabled,
        );
        (visibleSearchInput ?? searchInputs[0])?.focus();
      });
    }
  };

  const panelDuration =
    selectedTrack && selectedTrack.id === currentTrackId
      ? globalDurationSec || resolveDuration(selectedTrack)
      : resolveDuration(selectedTrack);
  const panelProgress = selectedTrack
    ? selectedTrack.id === currentTrackId
      ? globalProgress
      : 0
    : 0;
  const panelCurrentSec =
    selectedTrack && selectedTrack.id === currentTrackId ? globalCurrentSec : 0;
  const panelTrackIsPlaying =
    !!selectedTrack && selectedTrack.id === currentTrackId && isPlaying;
  const selectedTrackGenres = normalizeTags(selectedTrack?.genres ?? [], 4);
  const selectedTrackMoods = normalizeTags(selectedTrack?.moods ?? [], 5);
  const selectedTrackUses = normalizeTags(selectedTrack?.uses ?? [], 5);
  const selectedTrackGenreLabel =
    selectedTrackGenres.length > 0 ? selectedTrackGenres.join(" · ") : "—";
  const selectedTrackBpmValue =
    typeof selectedTrack?.bpm === "number" && Number.isFinite(selectedTrack.bpm)
      ? Math.round(selectedTrack.bpm)
      : null;
  const selectedTrackBpmBadge = selectedTrackBpmValue
    ? `BPM: ${selectedTrackBpmValue}`
    : "BPM: —";
  const selectedTrackLicenseLabel =
    formatLicenseTypeLabel(selectedTrack?.licenseType) ?? "No definida";
  const selectedTrackSyncLabel =
    selectedTrack?.clearedForSync === false
      ? "Sync bajo revisión"
      : "Sync disponible";
  const selectedTrackLicenseCards = selectedTrack
    ? deriveCatalogLicenseCards(selectedTrack)
    : [];
  const activeSlideIsExternal =
    !!activeBannerSlide && isExternalHref(activeBannerSlide.ctaHref);
  const filterSelectClass =
    "h-7 w-full appearance-none rounded border border-border bg-background px-2 pr-9 text-xs text-foreground focus:border-foreground focus:outline-none";

  return (
    <div className="bg-background text-foreground overflow-x-clip">
      <div
        className={cn(
          embedded
            ? "w-full max-w-none min-w-0 overflow-x-visible"
            : "mx-auto w-[90vw] max-w-[1700px] min-w-0 overflow-x-clip",
          compact ? "py-4" : "pt-2 pb-6 sm:pt-3 sm:pb-8",
        )}
      >
        {!hideHeader && activeBannerSlide && (
          <header className="mb-2.5 min-w-0">
            <div className="border-border bg-background relative overflow-hidden rounded-lg border">
              <img
                src={activeBannerSlide.imageUrl}
                alt={`Banner ${activeBannerSlide.title}`}
                className="h-[170px] w-full object-cover sm:h-[185px] md:h-[205px]"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/65 to-black/20" />

              <div className="absolute inset-0 flex items-end">
                <div className="w-full max-w-3xl px-4 py-3 sm:px-5 sm:py-4">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-white/80 uppercase">
                    {eyebrow}
                  </p>
                  <h1 className="mt-1 line-clamp-2 text-xl leading-tight font-semibold text-white sm:text-2xl">
                    {activeBannerSlide.title}
                  </h1>
                  <p className="mt-1 line-clamp-2 text-xs text-white/90 sm:text-sm">
                    {activeBannerSlide.subtitle}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (activeBannerSlide.track) {
                          playTrack(activeBannerSlide.track);
                          trackHeroEvent("CLICK_PLAY", activeBannerSlide);
                        }
                      }}
                      disabled={!activeBannerSlide.track}
                      className={cn(
                        "inline-flex h-9 w-9 items-center justify-center rounded-full border transition",
                        activeBannerSlide.track
                          ? "border-white bg-white text-black hover:bg-white/90"
                          : "cursor-not-allowed border-white/35 bg-black/20 text-white/45",
                      )}
                      aria-label={
                        activeBannerSlide.track
                          ? `Reproducir ${activeBannerSlide.title}`
                          : "Reproducción no disponible"
                      }
                    >
                      <Play className="ml-0.5 h-4 w-4" />
                    </button>

                    {activeSlideIsExternal ? (
                      <a
                        href={activeBannerSlide.ctaHref}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() =>
                          trackHeroEvent("CLICK_CTA", activeBannerSlide)
                        }
                        className="inline-flex h-9 items-center rounded border border-white/90 bg-black/20 px-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white hover:text-black"
                      >
                        {activeBannerSlide.ctaLabel}
                      </a>
                    ) : (
                      <Link
                        href={activeBannerSlide.ctaHref}
                        onClick={() =>
                          trackHeroEvent("CLICK_CTA", activeBannerSlide)
                        }
                        className="inline-flex h-9 items-center rounded border border-white/90 bg-black/20 px-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white hover:text-black"
                      >
                        {activeBannerSlide.ctaLabel}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-1.5 flex items-center gap-1">
              {bannerSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "h-1 flex-1 rounded-full transition",
                    index === activeSlideIndex
                      ? "bg-foreground"
                      : "bg-border hover:bg-foreground/40",
                  )}
                  aria-label={`Ir al slide ${index + 1}`}
                  aria-pressed={index === activeSlideIndex}
                />
              ))}

              {bannerSlides.length > 1 && (
                <div className="ml-1 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={goPrevSlide}
                    className="border-border text-muted-foreground hover:border-foreground/70 hover:text-foreground inline-flex h-6 w-6 items-center justify-center rounded border transition"
                    aria-label="Slide anterior"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={goNextSlide}
                    className="border-border text-muted-foreground hover:border-foreground/70 hover:text-foreground inline-flex h-6 w-6 items-center justify-center rounded border transition"
                    aria-label="Siguiente slide"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </header>
        )}

        {categories.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleCategoryChange(null)}
              className={cn(
                "h-7 rounded-full border px-2.5 text-[10px] font-semibold tracking-[0.12em] uppercase transition",
                !activeCat
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-foreground hover:border-foreground/70",
              )}
            >
              Todo
            </button>
            {categories.map((category) => (
              <button
                key={category.slug}
                type="button"
                onClick={() => handleCategoryChange(category.slug)}
                className={cn(
                  "h-7 rounded-full border px-2.5 text-[10px] font-semibold tracking-[0.12em] uppercase transition",
                  activeCat === category.slug
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-foreground hover:border-foreground/70",
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        <TrackCollectionBrowser
          tracks={displayedTracks}
          totalTracks={visibleTracks.length}
          selectedTrackId={selectedTrackId}
          selectedTrack={selectedTrack}
          currentTrackId={currentTrackId}
          isPlaying={isPlaying}
          progressMap={progressMap}
          showDetailPanel={showDetailPanel}
          viewMode={effectiveViewMode}
          onViewModeChange={handleViewModeChange}
          compact={compact}
          shouldShowFilteringControls={shouldShowFilteringControls}
          hasActiveTrackFilters={hasActiveTrackFilters}
          mobileFiltersOpen={mobileFiltersOpen}
          onMobileFiltersOpenChange={setMobileFiltersOpen}
          onClearTrackFilters={clearTrackFilters}
          onSelectTrackId={setSelectedTrackId}
          onPlayTrack={playTrack}
          onSeekTrack={seekTrack}
          resolveCoverUrl={resolveCatalogCoverUrl}
          getTrackDurationLabel={getTrackDurationLabel}
          formatTime={formatTime}
          filterSelectClass={filterSelectClass}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          activeMood={activeMood}
          onActiveMoodChange={setActiveMood}
          activeUse={activeUse}
          onActiveUseChange={setActiveUse}
          activeGenre={activeGenre}
          onActiveGenreChange={setActiveGenre}
          bpmMin={bpmMin}
          onBpmMinChange={setBpmMin}
          bpmMax={bpmMax}
          onBpmMaxChange={setBpmMax}
          moodOptions={moodOptions}
          useOptions={useOptions}
          genreOptions={genreOptions}
          panelDuration={panelDuration}
          panelProgress={panelProgress}
          panelCurrentSec={panelCurrentSec}
          panelTrackIsPlaying={panelTrackIsPlaying}
          selectedTrackBpmBadge={selectedTrackBpmBadge}
          selectedTrackBpmValue={selectedTrackBpmValue}
          selectedTrackGenreLabel={selectedTrackGenreLabel}
          selectedTrackLicenseLabel={selectedTrackLicenseLabel}
          selectedTrackSyncLabel={selectedTrackSyncLabel}
          selectedTrackMoods={selectedTrackMoods}
          selectedTrackUses={selectedTrackUses}
          selectedTrackLicenseCards={selectedTrackLicenseCards}
        />

        {displayedTracks.length < visibleTracks.length ? (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() =>
                setVisibleTrackLimit((current) => current + TRACK_BATCH_SIZE)
              }
              className="border-border text-foreground hover:border-foreground inline-flex h-10 items-center rounded border px-5 text-sm font-semibold transition"
            >
              Ver más tracks ({visibleTracks.length - displayedTracks.length})
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
