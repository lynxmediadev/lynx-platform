"use client";
/* eslint-disable @next/next/no-img-element -- Las portadas provienen de URLs dinámicas de R2. */

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ExternalLink,
  FileText,
  Pause,
  Play,
  Share2,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import WaveformScrubber from "@/components/public/WaveformScrubber";
import LoopingText from "@/components/common/LoopingText";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  trackId: string;
  title: string;
  artist: string;
  coverUrl: string;
  waveformB64?: string | null;
  isPlaying: boolean;
  currentSec: number;
  durationSec: number;
  progress: number;
  volume: number;
  hasPrev: boolean;
  hasNext: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (timeSec: number) => void;
  onVolumeChange: (next: number) => void;
  onToggleMute: () => void;
  onClose: () => void;
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

type ActionTooltipProps = {
  label: string;
  forceVisible?: boolean;
  children: ReactNode;
};

function ActionTooltip({
  label,
  forceVisible = false,
  children,
}: ActionTooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        className={cn(
          "pointer-events-none absolute -top-8 left-1/2 z-20 -translate-x-1/2 rounded border px-2 py-0.5 text-[12px] font-semibold whitespace-nowrap opacity-0 shadow transition-opacity duration-150",
          "bg-foreground/90 text-background border-black/80 dark:border-white/80 dark:bg-white dark:text-black",
          "group-focus-within:opacity-100 group-hover:opacity-100",
          forceVisible && "opacity-100",
        )}
      >
        {label}
      </span>
    </span>
  );
}

const PLAYER_LICENSE_PREVIEW = [
  {
    id: "basic",
    title: "MP3 Lease (Basic)",
    price: "US$19",
    detail: "MP3 · uso digital base",
  },
  {
    id: "premium",
    title: "WAV Lease (Premium)",
    price: "US$39",
    detail: "MP3, WAV · mayor alcance",
  },
  {
    id: "unlimited",
    title: "Unlimited Lease",
    price: "US$79",
    detail: "MP3, WAV, STEMS · sin límite estándar",
  },
];

export default function CatalogBottomPlayerV2({
  trackId,
  title,
  artist,
  coverUrl,
  waveformB64 = null,
  isPlaying,
  currentSec,
  durationSec,
  progress,
  volume,
  hasPrev,
  hasNext,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onClose,
}: Props) {
  const isMuted = volume <= 0.001;
  const [didCopyTrackUrl, setDidCopyTrackUrl] = useState(false);

  useEffect(() => {
    if (!didCopyTrackUrl) return undefined;
    const timeoutId = window.setTimeout(() => setDidCopyTrackUrl(false), 1300);
    return () => window.clearTimeout(timeoutId);
  }, [didCopyTrackUrl]);

  const copyTrackUrl = async () => {
    const trackUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/track/${trackId}`
        : `/track/${trackId}`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(trackUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = trackUrl;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setDidCopyTrackUrl(true);
    } catch {
      // no-op: if copy fails we keep the button in normal state
    }
  };

  return (
    <div className="border-border/90 bg-background/95 supports-[backdrop-filter]:bg-background/88 fixed inset-x-0 bottom-0 z-[90] w-full overflow-x-clip border-t shadow-[0_-8px_30px_rgba(0,0,0,0.38)] backdrop-blur-md">
      <div className="mx-auto grid w-[90vw] max-w-[1700px] min-w-0 grid-cols-[auto_minmax(0,1fr)_110px_auto] items-center gap-2 py-2 sm:grid-cols-[76px_170px_minmax(130px,1fr)_auto] md:grid-cols-[84px_200px_minmax(170px,1fr)_auto] lg:grid-cols-[92px_235px_minmax(205px,1fr)_auto] xl:grid-cols-[96px_255px_minmax(225px,1fr)_auto]">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={`/track/${trackId}`}
            className="border-border bg-card hover:border-foreground/70 relative hidden h-9 w-9 shrink-0 overflow-hidden rounded border transition sm:block"
            aria-label={`Ver track ${title}`}
          >
            <img
              src={coverUrl}
              alt={`Cover de ${title}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </Link>

          <button
            type="button"
            onClick={onTogglePlay}
            className="border-border bg-card text-foreground hover:border-foreground/70 hover:bg-foreground hover:text-background inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border transition"
            aria-label={isPlaying ? "Pausar reproducción" : "Reproducir track"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="ml-0.5 h-4 w-4" />
            )}
          </button>
        </div>

        <div className="min-w-0 sm:-ml-1">
          <Link
            href={`/track/${trackId}`}
            className="block min-w-0 hover:opacity-90"
            aria-label={`Ver detalle de ${title}`}
          >
            <LoopingText
              text={title}
              className="text-foreground text-left text-[11px] leading-tight font-semibold sm:text-[12px]"
              speedPxPerSecond={34}
              forceLoopOnMobile
            />
          </Link>
          <Link
            href={`/track/${trackId}`}
            className="block min-w-0 hover:opacity-90"
            aria-label={`Ver artista de ${artist}`}
          >
            <LoopingText
              text={artist || "Artista"}
              className="text-muted-foreground text-left text-[9px] leading-tight sm:text-[10px]"
              speedPxPerSecond={30}
              forceLoopOnMobile
            />
          </Link>
        </div>

        <div className="flex min-w-0 items-center">
          <div className="min-w-0 flex-1 px-8">
            <div className="flex min-w-0 items-center gap-2">
              <div className="min-w-0 flex-1">
                <WaveformScrubber
                  waveformB64={waveformB64}
                  durationSec={durationSec}
                  progress={progress}
                  onSeek={onSeek}
                  height={18}
                  className="w-full"
                  frameClassName="relative select-none rounded border-x border-border/70 bg-card/20"
                  colors={{
                    base: "__theme_base__",
                    progress: "__theme_progress__",
                  }}
                />
              </div>
              <div className="text-muted-foreground hidden shrink-0 text-[10px] tabular-nums sm:block">
                {formatTime(currentSec)} / {formatTime(durationSec)}
              </div>
            </div>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-1.5">
          <ActionTooltip label="Skip anterior">
            <button
              type="button"
              onClick={onPrev}
              disabled={!hasPrev}
              className={cn(
                "hidden h-8 w-8 items-center justify-center rounded border transition lg:inline-flex",
                hasPrev
                  ? "border-border bg-card text-foreground hover:border-foreground/70 hover:bg-muted"
                  : "border-border/70 bg-card text-muted-foreground/55 cursor-not-allowed",
              )}
              aria-label="Skip anterior"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </button>
          </ActionTooltip>

          <ActionTooltip label="Skip siguiente">
            <button
              type="button"
              onClick={onNext}
              disabled={!hasNext}
              className={cn(
                "hidden h-8 w-8 items-center justify-center rounded border transition lg:inline-flex",
                hasNext
                  ? "border-border bg-card text-foreground hover:border-foreground/70 hover:bg-muted"
                  : "border-border/70 bg-card text-muted-foreground/55 cursor-not-allowed",
              )}
              aria-label="Skip siguiente"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </button>
          </ActionTooltip>

          <ActionTooltip label="Abrir track">
            <Link
              href={`/track/${trackId}`}
              className="border-border bg-card text-foreground hover:border-foreground/70 hover:bg-muted hidden h-8 w-8 items-center justify-center rounded border transition md:inline-flex"
              aria-label="Abrir ficha del track"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </ActionTooltip>

          <Dialog>
            <ActionTooltip label="Ver licencias">
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="border-border bg-card text-foreground hover:border-foreground/70 hover:bg-muted hidden h-8 w-8 items-center justify-center rounded border transition md:inline-flex"
                  aria-label="Ver licencias"
                >
                  <FileText className="h-3.5 w-3.5" />
                </button>
              </DialogTrigger>
            </ActionTooltip>
            <DialogContent className="border-border bg-background text-foreground sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Licencias de {title}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2 sm:grid-cols-3">
                {PLAYER_LICENSE_PREVIEW.map((license) => (
                  <article
                    key={license.id}
                    className="border-border bg-card/70 rounded border p-3"
                  >
                    <p className="text-foreground text-sm font-semibold">
                      {license.title}
                    </p>
                    <p className="text-foreground mt-2 text-xl leading-none font-semibold">
                      {license.price}
                    </p>
                    <p className="text-muted-foreground mt-2 text-xs">
                      {license.detail}
                    </p>
                  </article>
                ))}
              </div>
              <p className="text-muted-foreground text-xs">
                Vista previa con dummy data para validar UI/UX. Los valores
                reales vendrán desde catálogo/licenciamiento.
              </p>
            </DialogContent>
          </Dialog>

          <ActionTooltip
            label={didCopyTrackUrl ? "Copiado" : "Copiar URL"}
            forceVisible={didCopyTrackUrl}
          >
            <button
              type="button"
              onClick={(event) => {
                void copyTrackUrl();
                event.currentTarget.blur();
              }}
              className={cn(
                "hidden h-8 w-8 items-center justify-center rounded border transition md:inline-flex",
                didCopyTrackUrl
                  ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                  : "border-border bg-card text-foreground hover:border-foreground/70 hover:bg-muted",
              )}
              aria-label="Copiar URL del track"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </ActionTooltip>

          <ActionTooltip label={isMuted ? "Activar audio" : "Silenciar audio"}>
            <button
              type="button"
              onClick={onToggleMute}
              className="border-border bg-card text-foreground hover:border-foreground/70 hover:bg-muted inline-flex h-8 w-8 items-center justify-center rounded border transition"
              aria-label={isMuted ? "Activar audio" : "Silenciar audio"}
            >
              {isMuted ? (
                <VolumeX className="h-3.5 w-3.5" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
            </button>
          </ActionTooltip>

          <input
            type="range"
            min={0}
            max={1}
            step={0.005}
            value={Math.max(0, Math.min(1, volume))}
            onChange={(event) => onVolumeChange(Number(event.target.value))}
            className="accent-foreground hidden h-2 w-20 cursor-pointer xl:block"
            aria-label="Volumen general"
          />

          <ActionTooltip label="Cerrar player">
            <button
              type="button"
              onClick={onClose}
              className="border-border bg-card text-foreground hover:border-foreground/70 hover:bg-muted inline-flex h-8 w-8 items-center justify-center rounded border transition"
              aria-label="Cerrar reproductor"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </ActionTooltip>
        </div>
      </div>
    </div>
  );
}
