"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, FileText, LayoutGrid, List, Pause, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import LoopingText from "@/components/common/LoopingText";
import { cn } from "@/lib/utils";
import type { Track } from "@/lib/catalog/types";
import type { CatalogHeroSlide } from "@/lib/banner-promotions/types";

type CatalogTrack = Track & {
  waveformB64?: string | null;
  durationSec?: number | null;
};

type ProgressMap = Record<string, number>;

type Props = {
  tracks: CatalogTrack[];
  heroSlides?: CatalogHeroSlide[];
  title?: string;
  subtitle?: string;
  eyebrow?: string;
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
  if (track.durationSec && Number.isFinite(track.durationSec) && track.durationSec > 0) {
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
  return `https://loremflickr.com/640/640/kitten?lock=${hashToPositiveInt(track.id)}`;
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
    typeof track.budgetMin === "number" && Number.isFinite(track.budgetMin) ? track.budgetMin : null;
  const max =
    typeof track.budgetMax === "number" && Number.isFinite(track.budgetMax) ? track.budgetMax : null;

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

function DetailMetaCell({
  label,
  value,
  forceLoopOnMobile = false,
}: {
  label: string;
  value: string;
  forceLoopOnMobile?: boolean;
}) {
  return (
    <div className="flex min-h-[48px] flex-col items-center justify-center px-2 py-1.5 text-center">
      <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-500">{label}</dt>
      <dd className="mt-0.5 w-full">
        <LoopingText
          text={value}
          className="text-[13px] font-semibold leading-tight text-neutral-100"
          speedPxPerSecond={32}
          forceLoopOnMobile={forceLoopOnMobile}
        />
      </dd>
    </div>
  );
}

type DetailTagTone = "mood" | "use" | "genre";

function DetailTagPill({
  value,
  tone,
}: {
  value: string;
  tone: DetailTagTone;
}) {
  const toneClass =
    tone === "mood"
      ? "border-sky-400/35 bg-sky-500/10 text-sky-100"
      : tone === "use"
        ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-100"
        : "border-neutral-600/90 bg-neutral-800/70 text-neutral-100";

  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", toneClass)}>
      {value}
    </span>
  );
}

function DetailTagColumn({
  label,
  values,
  tone,
}: {
  label: string;
  values: string[];
  tone: DetailTagTone;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">{label}</p>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {values.map((value) => (
            <DetailTagPill key={`${label}-${value}`} value={value} tone={tone} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-neutral-500">—</p>
      )}
    </div>
  );
}

export default function CatalogClient({
  tracks,
  heroSlides,
  title = "ODR Records Catalog",
  subtitle = "Explora el catálogo por carátula y revisa el detalle del track seleccionado.",
  eyebrow = "ODR Records",
  hideHeader = false,
  compact = false,
  showDetailPanel = true,
  showFilteringControls,
  catalogSlug,
  categories = [],
}: Props) {
  const router = useRouter();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const bannerSessionIdRef = useRef<string>(
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `banner-${Date.now()}`,
  );

  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(tracks[0]?.id ?? null);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressMap, setProgressMap] = useState<ProgressMap>({});
  const [activeCat, setActiveCat] = useState<string | null>(catalogSlug ?? null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMood, setActiveMood] = useState("all");
  const [activeUse, setActiveUse] = useState("all");
  const [activeGenre, setActiveGenre] = useState("all");
  const [bpmMin, setBpmMin] = useState("");
  const [bpmMax, setBpmMax] = useState("");
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [viewMode, setViewMode] = useState<CatalogViewMode>("grid");

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
    const query = searchTerm.trim().toLowerCase();
    const rawMin = parseOptionalNumber(bpmMin);
    const rawMax = parseOptionalNumber(bpmMax);
    const minBpm = rawMin !== null && rawMax !== null ? Math.min(rawMin, rawMax) : rawMin;
    const maxBpm = rawMin !== null && rawMax !== null ? Math.max(rawMin, rawMax) : rawMax;

    return tracks.filter((track) => {
      const matchesMood =
        activeMood === "all" ||
        track.moods.some((mood) => mood.toLowerCase() === activeMood.toLowerCase());
      if (!matchesMood) return false;

      const matchesUse =
        activeUse === "all" ||
        track.uses.some((use) => use.toLowerCase() === activeUse.toLowerCase());
      if (!matchesUse) return false;

      const trackGenres = track.genres ?? [];
      const matchesGenre =
        activeGenre === "all" ||
        trackGenres.some((genre) => genre.toLowerCase() === activeGenre.toLowerCase());
      if (!matchesGenre) return false;

      if (minBpm !== null || maxBpm !== null) {
        if (typeof track.bpm !== "number" || !Number.isFinite(track.bpm)) return false;
        if (minBpm !== null && track.bpm < minBpm) return false;
        if (maxBpm !== null && track.bpm > maxBpm) return false;
      }

      if (!query) return true;
      const haystack = `${track.title} ${track.artist} ${track.moods.join(" ")} ${track.uses.join(
        " ",
      )} ${trackGenres.join(" ")} ${track.bpm ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [tracks, searchTerm, activeMood, activeUse, activeGenre, bpmMin, bpmMax]);

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
          track: slide.playableTrackId ? trackById.get(slide.playableTrackId) ?? null : null,
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
          .filter((trackId): trackId is string => typeof trackId === "string" && trackId.length > 0),
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
          FALLBACK_BANNER_IMAGES[fallbackIndex % FALLBACK_BANNER_IMAGES.length] ??
          FALLBACK_BANNER_IMAGES[0]!;
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

  const activeBannerSlide = bannerSlides[activeSlideIndex] ?? bannerSlides[0] ?? null;

  const selectedTrack = useMemo(
    () =>
      visibleTracks.find((track) => track.id === selectedTrackId) ??
      visibleTracks[0] ??
      null,
    [selectedTrackId, visibleTracks],
  );

  const currentTrack = useMemo(
    () => tracks.find((track) => track.id === currentTrackId) ?? null,
    [currentTrackId, tracks],
  );

  useEffect(() => {
    if (!visibleTracks.length) {
      setSelectedTrackId(null);

      if (currentTrackId) {
        audioRef.current?.pause();
        setCurrentTrackId(null);
        setIsPlaying(false);
      }
      return;
    }

    if (
      !selectedTrackId ||
      !visibleTracks.some((track) => track.id === selectedTrackId)
    ) {
      const firstTrackId = visibleTracks[0]?.id ?? null;
      setSelectedTrackId(firstTrackId);
    }

    if (
      currentTrackId &&
      !visibleTracks.some((track) => track.id === currentTrackId)
    ) {
      audioRef.current?.pause();
      setCurrentTrackId(null);
      setIsPlaying(false);
    }
  }, [visibleTracks, selectedTrackId, currentTrackId]);

  useEffect(() => {
    setActiveCat(catalogSlug ?? null);
  }, [catalogSlug]);

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
  }, [activeBannerSlide?.id]);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const onTimeUpdate = () => {
      if (!currentTrackId) return;
      const duration =
        audioEl.duration && Number.isFinite(audioEl.duration)
          ? Math.floor(audioEl.duration)
          : resolveDuration(currentTrack);
      if (!duration) return;
      setProgressMap((prev) => ({
        ...prev,
        [currentTrackId]: Math.min(1, audioEl.currentTime / duration),
      }));
    };

    const onEnded = () => {
      setIsPlaying(false);
      if (!currentTrackId) return;
      setProgressMap((prev) => ({ ...prev, [currentTrackId]: 0 }));
    };

    const onLoadedMetadata = () => {
      if (pendingSeekRef.current === null) return;
      if (!audioEl.duration || !Number.isFinite(audioEl.duration)) return;
      audioEl.currentTime = audioEl.duration * pendingSeekRef.current;
      pendingSeekRef.current = null;
    };

    audioEl.addEventListener("timeupdate", onTimeUpdate);
    audioEl.addEventListener("ended", onEnded);
    audioEl.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      audioEl.removeEventListener("timeupdate", onTimeUpdate);
      audioEl.removeEventListener("ended", onEnded);
      audioEl.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [currentTrackId, currentTrack]);

  const playTrack = (track: CatalogTrack) => {
    const audioEl = audioRef.current;
    if (!audioEl || !track.audioUrl) return;

    if (currentTrackId === track.id) {
      if (isPlaying) {
        audioEl.pause();
        setIsPlaying(false);
      } else {
        audioEl
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
      return;
    }

    setSelectedTrackId(track.id);
    setCurrentTrackId(track.id);
    pendingSeekRef.current = null;
    setProgressMap((prev) => ({ ...prev, [track.id]: 0 }));

    audioEl.src = track.audioUrl;
    audioEl.currentTime = 0;
    audioEl
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  };

  const seekTrack = (track: CatalogTrack, ratio: number) => {
    const audioEl = audioRef.current;
    if (!audioEl || !track.audioUrl) return;

    const nextRatio = Math.max(0, Math.min(1, ratio));

    if (currentTrackId === track.id && audioEl.duration && Number.isFinite(audioEl.duration)) {
      audioEl.currentTime = audioEl.duration * nextRatio;
      setProgressMap((prev) => ({ ...prev, [track.id]: nextRatio }));
      if (!isPlaying) {
        audioEl
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
      return;
    }

    setSelectedTrackId(track.id);
    setCurrentTrackId(track.id);
    pendingSeekRef.current = nextRatio;
    setProgressMap((prev) => ({ ...prev, [track.id]: nextRatio }));

    audioEl.src = track.audioUrl;
    audioEl
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
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

  const trackHeroEvent = (eventType: "VIEW" | "CLICK_CTA" | "CLICK_PLAY", slide: BannerSlideView | null) => {
    if (!slide?.promotionItemId) return;
    const payload = {
      placement: "CATALOG_HERO" as const,
      itemId: slide.promotionItemId,
      eventType,
      sessionId: bannerSessionIdRef.current,
      path: typeof window !== "undefined" ? window.location.pathname : "/catalog",
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
    setActiveSlideIndex((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
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
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  };

  const panelDuration = resolveDuration(selectedTrack);
  const panelProgress = selectedTrack ? progressMap[selectedTrack.id] ?? 0 : 0;
  const panelCurrentSec = panelDuration * panelProgress;
  const panelTrackIsPlaying = !!selectedTrack && selectedTrack.id === currentTrackId && isPlaying;
  const selectedTrackGenres = normalizeTags(selectedTrack?.genres ?? [], 4);
  const selectedTrackMoods = normalizeTags(selectedTrack?.moods ?? [], 5);
  const selectedTrackUses = normalizeTags(selectedTrack?.uses ?? [], 5);
  const selectedTrackGenreLabel =
    selectedTrackGenres.length > 0 ? selectedTrackGenres.join(" · ") : "—";
  const selectedTrackBpmValue =
    typeof selectedTrack?.bpm === "number" && Number.isFinite(selectedTrack.bpm)
      ? Math.round(selectedTrack.bpm)
      : null;
  const selectedTrackBpmBadge = selectedTrackBpmValue ? `BPM: ${selectedTrackBpmValue}` : "BPM: —";
  const selectedTrackLicenseLabel =
    formatLicenseTypeLabel(selectedTrack?.licenseType) ?? "No definida";
  const selectedTrackSyncLabel =
    selectedTrack?.clearedForSync === false ? "Sync bajo revisión" : "Sync disponible";
  const selectedTrackLicenseCards = selectedTrack ? deriveCatalogLicenseCards(selectedTrack) : [];
  const activeSlideIsExternal = !!activeBannerSlide && isExternalHref(activeBannerSlide.ctaHref);

  return (
    <div className="bg-[var(--lm-bg-deep)] text-[var(--lm-text-main)]">
      <audio ref={audioRef} preload="metadata" />

      <div
        className={cn(
          "mx-auto w-[90vw] max-w-[1700px] min-w-0",
          compact ? "py-4" : "py-6 sm:py-8",
        )}
      >
        {!hideHeader && activeBannerSlide && (
          <header className="mb-2.5">
            <div className="relative overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
              <img
                src={activeBannerSlide.imageUrl}
                alt={`Banner ${activeBannerSlide.title}`}
                className="h-[170px] w-full object-cover sm:h-[185px] md:h-[205px]"
                loading="eager"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/65 to-black/20" />

              <div className="absolute inset-0 flex items-end">
                <div className="w-full max-w-3xl px-4 py-3 sm:px-5 sm:py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-300">
                    {eyebrow}
                  </p>
                  <h1 className="mt-1 line-clamp-2 text-xl font-semibold leading-tight text-neutral-100 sm:text-2xl">
                    {activeBannerSlide.title}
                  </h1>
                  <p className="mt-1 line-clamp-2 text-xs text-neutral-200 sm:text-sm">
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
                          ? "border-neutral-100 bg-neutral-100 text-neutral-950 hover:opacity-90"
                          : "cursor-not-allowed border-neutral-700 text-neutral-600",
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
                        onClick={() => trackHeroEvent("CLICK_CTA", activeBannerSlide)}
                        className="inline-flex h-9 items-center rounded border border-neutral-100 px-3 text-sm font-semibold text-neutral-100 transition hover:bg-neutral-100 hover:text-neutral-950"
                      >
                        {activeBannerSlide.ctaLabel}
                      </a>
                    ) : (
                      <Link
                        href={activeBannerSlide.ctaHref}
                        onClick={() => trackHeroEvent("CLICK_CTA", activeBannerSlide)}
                        className="inline-flex h-9 items-center rounded border border-neutral-100 px-3 text-sm font-semibold text-neutral-100 transition hover:bg-neutral-100 hover:text-neutral-950"
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
                      ? "bg-neutral-100"
                      : "bg-neutral-800 hover:bg-neutral-600",
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
                    className="inline-flex h-6 w-6 items-center justify-center rounded border border-neutral-700 text-neutral-300 transition hover:border-neutral-400 hover:text-neutral-100"
                    aria-label="Slide anterior"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={goNextSlide}
                    className="inline-flex h-6 w-6 items-center justify-center rounded border border-neutral-700 text-neutral-300 transition hover:border-neutral-400 hover:text-neutral-100"
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
                "h-7 rounded-full border px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition",
                !activeCat
                  ? "border-neutral-100 bg-neutral-100 text-neutral-950"
                  : "border-neutral-700 text-neutral-100 hover:border-neutral-400",
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
                  "h-7 rounded-full border px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition",
                  activeCat === category.slug
                    ? "border-neutral-100 bg-neutral-100 text-neutral-950"
                    : "border-neutral-700 text-neutral-100 hover:border-neutral-400",
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {shouldShowFilteringControls && tracks.length > 0 && (
          <section className="mb-2 rounded border border-neutral-800 bg-neutral-900/40 p-2">
            <div className="grid items-end gap-1.5 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_130px_130px_130px_78px_78px_auto]">
              <label className="min-w-0">
                <span className="sr-only">Buscar</span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar..."
                  className="h-7 w-full rounded border border-neutral-700 bg-neutral-950 px-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-100 focus:outline-none"
                />
              </label>

              <label className="min-w-0">
                <span className="sr-only">Mood</span>
                <select
                  value={activeMood}
                  onChange={(event) => setActiveMood(event.target.value)}
                  className="h-7 w-full rounded border border-neutral-700 bg-neutral-950 px-2 text-xs text-neutral-100 focus:border-neutral-100 focus:outline-none"
                >
                  <option value="all">Mood</option>
                  {moodOptions.map((mood) => (
                    <option key={mood} value={mood}>
                      {mood}
                    </option>
                  ))}
                </select>
              </label>

              <label className="min-w-0">
                <span className="sr-only">Uso</span>
                <select
                  value={activeUse}
                  onChange={(event) => setActiveUse(event.target.value)}
                  className="h-7 w-full rounded border border-neutral-700 bg-neutral-950 px-2 text-xs text-neutral-100 focus:border-neutral-100 focus:outline-none"
                >
                  <option value="all">Uso</option>
                  {useOptions.map((use) => (
                    <option key={use} value={use}>
                      {use}
                    </option>
                  ))}
                </select>
              </label>

              <label className="min-w-0">
                <span className="sr-only">Género</span>
                <select
                  value={activeGenre}
                  onChange={(event) => setActiveGenre(event.target.value)}
                  className="h-7 w-full rounded border border-neutral-700 bg-neutral-950 px-2 text-xs text-neutral-100 focus:border-neutral-100 focus:outline-none"
                >
                  <option value="all">Género</option>
                  {genreOptions.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="min-w-0">
                <span className="sr-only">BPM mínimo</span>
                <input
                  type="number"
                  min={0}
                  max={400}
                  step={1}
                  inputMode="numeric"
                  value={bpmMin}
                  onChange={(event) => setBpmMin(event.target.value)}
                  placeholder="Min"
                  className="h-7 w-full rounded border border-neutral-700 bg-neutral-950 px-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-100 focus:outline-none"
                />
              </label>

              <label className="min-w-0">
                <span className="sr-only">BPM máximo</span>
                <input
                  type="number"
                  min={0}
                  max={400}
                  step={1}
                  inputMode="numeric"
                  value={bpmMax}
                  onChange={(event) => setBpmMax(event.target.value)}
                  placeholder="Max"
                  className="h-7 w-full rounded border border-neutral-700 bg-neutral-950 px-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-100 focus:outline-none"
                />
              </label>

              <div className="flex items-center justify-end gap-1 sm:col-span-2 xl:col-span-1">
                <span className="inline-flex h-7 items-center rounded border border-neutral-700 px-2 text-xs text-neutral-300">
                  {visibleTracks.length}/{tracks.length}
                </span>
                {!compact && (
                  <div className="inline-flex h-7 overflow-hidden rounded border border-neutral-700">
                    <button
                      type="button"
                      onClick={() => handleViewModeChange("grid")}
                      aria-label="Vista grid"
                      aria-pressed={effectiveViewMode === "grid"}
                      title="Vista grid"
                      className={cn(
                        "inline-flex w-8 items-center justify-center transition",
                        effectiveViewMode === "grid"
                          ? "bg-neutral-100 text-neutral-950"
                          : "text-neutral-300 hover:bg-neutral-800",
                      )}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleViewModeChange("list")}
                      aria-label="Vista lista"
                      aria-pressed={effectiveViewMode === "list"}
                      title="Vista lista"
                      className={cn(
                        "inline-flex w-8 items-center justify-center border-l border-neutral-700 transition",
                        effectiveViewMode === "list"
                          ? "bg-neutral-100 text-neutral-950"
                          : "text-neutral-300 hover:bg-neutral-800",
                      )}
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => clearTrackFilters()}
                  disabled={!hasActiveTrackFilters}
                  className={cn(
                    "h-7 rounded border px-2 text-xs font-semibold transition",
                    hasActiveTrackFilters
                      ? "border-neutral-300 text-neutral-100 hover:border-neutral-100"
                      : "cursor-not-allowed border-neutral-700 text-neutral-600",
                  )}
                >
                  Limpiar
                </button>
              </div>
            </div>
          </section>
        )}

        <div
          className={cn(
            "grid gap-6 xl:gap-8",
            showDetailPanel
              ? "lg:grid-cols-[minmax(0,1fr)_450px] xl:grid-cols-[minmax(0,1fr)_520px]"
              : "grid-cols-1",
          )}
        >
          <section>
            {tracks.length === 0 ? (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 px-5 py-8 text-sm text-neutral-300">
                No hay tracks disponibles en este catálogo.
              </div>
            ) : visibleTracks.length === 0 ? (
              <div className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-950/60 px-5 py-8 text-sm text-neutral-300">
                <p>No encontramos tracks con esos filtros.</p>
                {hasActiveTrackFilters && (
                  <button
                    type="button"
                    onClick={() => clearTrackFilters({ focusSearch: true })}
                    className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-100 transition hover:border-neutral-100"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : effectiveViewMode === "grid" ? (
              <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                {visibleTracks.map((track) => {
                  const isSelected = track.id === selectedTrack?.id;
                  const isActive = track.id === currentTrackId;
                  const showPause = isActive && isPlaying;

                  return (
                    <li key={track.id}>
                      <article
                        className={cn(
                          "group overflow-hidden rounded-md border bg-neutral-900/80 transition",
                          isSelected
                            ? "border-neutral-100 shadow-[0_0_0_1px_rgba(243,241,234,0.35)]"
                            : "border-neutral-800 hover:border-neutral-600",
                        )}
                      >
                        <div className="relative aspect-square w-full overflow-hidden bg-neutral-900">
                          <img
                            src={resolveCatalogCoverUrl(track)}
                            alt={`Cover de ${track.title}`}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                            loading="lazy"
                          />

                          <button
                            type="button"
                            onClick={() => setSelectedTrackId(track.id)}
                            className="absolute inset-0 z-10"
                            aria-pressed={isSelected}
                            aria-label={`Seleccionar ${track.title}`}
                          />

                          <button
                            type="button"
                            onClick={() => playTrack(track)}
                            className={cn(
                              "absolute bottom-2 left-2 z-20 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur transition",
                              isActive
                                ? "border-neutral-100 bg-neutral-100 text-neutral-950"
                                : "border-neutral-300/70 bg-black/40 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-950",
                            )}
                            aria-label={showPause ? `Pausar ${track.title}` : `Reproducir ${track.title}`}
                          >
                            {showPause ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </button>

                          {isActive && (
                            <div className="absolute inset-x-0 bottom-0 z-20 h-1 bg-black/60">
                              <div
                                className="h-full bg-neutral-100 transition-[width]"
                                style={{ width: `${Math.round((progressMap[track.id] ?? 0) * 100)}%` }}
                              />
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedTrackId(track.id)}
                          className="block w-full text-left"
                          aria-pressed={isSelected}
                        >
                          <div className="space-y-1 px-2.5 py-2.5">
                            <h3 className="line-clamp-2 text-[15px] font-semibold leading-tight text-neutral-100">
                              {track.title}
                            </h3>
                            <p className="line-clamp-1 text-sm text-neutral-400">{track.artist || "Artista"}</p>
                          </div>
                        </button>
                      </article>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ul className="space-y-2">
                {visibleTracks.map((track) => {
                  const isSelected = track.id === selectedTrack?.id;
                  const isActive = track.id === currentTrackId;
                  const showPause = isActive && isPlaying;
                  const durationLabel = getTrackDurationLabel(track);

                  return (
                    <li key={track.id}>
                      <article
                        className={cn(
                          "relative overflow-hidden rounded-md border bg-neutral-900/80 transition",
                          isSelected
                            ? "border-neutral-100 shadow-[0_0_0_1px_rgba(243,241,234,0.28)]"
                            : "border-neutral-800 hover:border-neutral-600",
                        )}
                      >
                        <div className="flex items-center gap-2 p-2 sm:gap-3">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-neutral-800 bg-neutral-900 sm:h-20 sm:w-20">
                            <img
                              src={resolveCatalogCoverUrl(track)}
                              alt={`Cover de ${track.title}`}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                            <button
                              type="button"
                              onClick={() => setSelectedTrackId(track.id)}
                              className="absolute inset-0"
                              aria-label={`Seleccionar ${track.title}`}
                              aria-pressed={isSelected}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedTrackId(track.id)}
                            className="min-w-0 flex-1 text-left"
                            aria-label={`Ver detalle de ${track.title}`}
                            aria-pressed={isSelected}
                          >
                            <h3 className="line-clamp-1 text-sm font-semibold text-neutral-100 sm:text-[15px]">
                              {track.title}
                            </h3>
                            <p className="line-clamp-1 text-xs text-neutral-400 sm:text-sm">
                              {track.artist || "Artista"}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-neutral-400">
                              <span>{durationLabel}</span>
                              {track.bpm ? <span>{Math.round(track.bpm)} BPM</span> : null}
                              {track.key ? <span>{track.key}</span> : null}
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => playTrack(track)}
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition",
                              isActive
                                ? "border-neutral-100 bg-neutral-100 text-neutral-950"
                                : "border-neutral-300/70 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-950",
                            )}
                            aria-label={showPause ? `Pausar ${track.title}` : `Reproducir ${track.title}`}
                          >
                            {showPause ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </button>
                        </div>

                        {isActive && (
                          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/60">
                            <div
                              className="h-full bg-neutral-100 transition-[width]"
                              style={{ width: `${Math.round((progressMap[track.id] ?? 0) * 100)}%` }}
                            />
                          </div>
                        )}
                      </article>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {showDetailPanel && (
            <aside className="self-start lg:sticky lg:top-[calc(var(--header-h)+1rem)]">
              <section className="rounded-md border border-neutral-800 bg-neutral-950/90 p-4 sm:p-5">
                {selectedTrack ? (
                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-md border border-neutral-800 bg-neutral-900">
                      <img
                        src={resolveCatalogCoverUrl(selectedTrack)}
                        alt={`Cover grande de ${selectedTrack.title}`}
                        className="aspect-[2/1] w-full object-cover"
                      />
                    </div>

                    <div className="space-y-2 rounded-md border border-neutral-800 bg-neutral-900/45 p-3">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => playTrack(selectedTrack)}
                          className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-full border transition",
                            panelTrackIsPlaying
                              ? "border-neutral-100 bg-neutral-100 text-neutral-950"
                              : "border-neutral-100 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-950",
                          )}
                          aria-label={panelTrackIsPlaying ? "Pausar track" : "Reproducir track"}
                        >
                          {panelTrackIsPlaying ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="ml-0.5 h-5 w-5" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-lg font-semibold leading-tight">{selectedTrack.title}</p>
                          <p className="line-clamp-1 text-sm text-neutral-400">de {selectedTrack.artist}</p>
                        </div>
                        <span className="rounded border border-neutral-700 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-neutral-300">
                          {selectedTrackBpmBadge}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <input
                          type="range"
                          min={0}
                          max={1000}
                          value={Math.round(panelProgress * 1000)}
                          onChange={(event) => {
                            if (!selectedTrack) return;
                            seekTrack(selectedTrack, Number(event.target.value) / 1000);
                          }}
                          className="h-2 w-full cursor-pointer accent-neutral-100"
                          aria-label="Progreso de reproducción"
                        />
                        <div className="flex items-center justify-between text-xs text-neutral-400">
                          <span>{formatTime(panelCurrentSec)}</span>
                          <span>{formatTime(panelDuration)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/track/${selectedTrack.id}`}
                        className="inline-flex items-center justify-center rounded border border-neutral-100 bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-950 transition hover:opacity-90"
                      >
                        Ver detalles
                      </Link>
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 rounded border border-neutral-300/70 px-3 py-2 text-sm font-semibold text-neutral-100 transition hover:border-neutral-100"
                          >
                            <FileText className="h-4 w-4" />
                            Licencias
                          </button>
                        </DialogTrigger>
                        <DialogContent className="border-neutral-800 bg-neutral-950 text-neutral-100 sm:max-w-xl">
                          <DialogHeader>
                            <DialogTitle>Licencias disponibles</DialogTitle>
                            <DialogDescription className="text-neutral-400">
                              {selectedTrack.title} · {selectedTrack.artist}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {selectedTrackLicenseCards.map((card) => (
                              <article
                                key={card.id}
                                className="rounded border border-neutral-800 bg-neutral-900/60 p-3"
                              >
                                <p className="text-sm font-semibold text-neutral-100">{card.title}</p>
                                <p className="mt-2 text-xl font-semibold leading-none text-neutral-100">
                                  {card.price}
                                </p>
                                <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-neutral-400">
                                  {card.formats}
                                </p>
                                <p className="mt-1 text-xs text-neutral-400">{card.note}</p>
                              </article>
                            ))}
                          </div>
                          <div className="flex items-center justify-between gap-2 text-xs text-neutral-400">
                            <p>Valores referenciales sujetos al uso final.</p>
                            <Link
                              href={`/track/${selectedTrack.id}`}
                              className="inline-flex items-center rounded border border-neutral-300/70 px-2.5 py-1.5 font-semibold text-neutral-100 transition hover:border-neutral-100"
                            >
                              Ver ficha completa
                            </Link>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="overflow-hidden rounded-md border border-neutral-800 bg-neutral-900/30">
                      <dl className="grid grid-cols-3 divide-x divide-neutral-800/80 border-b border-neutral-800/80">
                        <DetailMetaCell label="BPM" value={selectedTrackBpmValue ? String(selectedTrackBpmValue) : "—"} />
                        <DetailMetaCell label="Tonalidad" value={selectedTrack.key ?? "—"} />
                        <DetailMetaCell label="Género" value={selectedTrackGenreLabel} />
                      </dl>
                      <dl className="grid grid-cols-3 divide-x divide-neutral-800/80">
                        <DetailMetaCell
                          label="Duración"
                          value={selectedTrack.duration || formatTime(panelDuration)}
                        />
                        <DetailMetaCell label="Licencia" value={selectedTrackLicenseLabel} />
                        <DetailMetaCell
                          label="Estado sync"
                          value={selectedTrackSyncLabel}
                          forceLoopOnMobile
                        />
                      </dl>
                    </div>

                    {(selectedTrackMoods.length > 0 || selectedTrackUses.length > 0) && (
                      <div className="rounded-md border border-neutral-800 bg-neutral-900/30 p-2.5">
                        <div className="grid grid-cols-2 divide-x divide-neutral-800/80">
                          <div className="pr-2.5">
                            <DetailTagColumn label="Moods" values={selectedTrackMoods} tone="mood" />
                          </div>
                          <div className="pl-2.5">
                            <DetailTagColumn label="Usos" values={selectedTrackUses} tone="use" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400">Selecciona un track para ver detalles.</p>
                )}
              </section>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
