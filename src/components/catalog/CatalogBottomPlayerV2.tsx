"use client";

import Link from "next/link";
import {
  ExternalLink,
  FileText,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import WaveformScrubber from "@/components/public/WaveformScrubber";
import LoopingText from "@/components/common/LoopingText";
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

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] w-full overflow-x-clip border-t border-border/90 bg-background/95 shadow-[0_-8px_30px_rgba(0,0,0,0.38)] backdrop-blur-md supports-[backdrop-filter]:bg-background/88">
      <div className="mx-auto grid w-[90vw] max-w-[1700px] min-w-0 grid-cols-[auto_minmax(0,1fr)_110px_auto] items-center gap-2 py-2 sm:grid-cols-[76px_150px_minmax(140px,1fr)_auto] md:grid-cols-[84px_180px_minmax(180px,1fr)_auto] lg:grid-cols-[92px_210px_minmax(220px,1fr)_auto] xl:grid-cols-[96px_230px_minmax(240px,1fr)_auto]">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={`/track/${trackId}`}
            className="relative hidden h-9 w-9 shrink-0 overflow-hidden rounded border border-border bg-card transition hover:border-foreground/70 sm:block"
            aria-label={`Ver track ${title}`}
          >
            <img src={coverUrl} alt={`Cover de ${title}`} className="h-full w-full object-cover" loading="lazy" />
          </Link>

          <button
            type="button"
            onClick={onTogglePlay}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border border-border bg-card text-foreground transition hover:border-foreground/70 hover:bg-foreground hover:text-background"
            aria-label={isPlaying ? "Pausar reproducción" : "Reproducir track"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </button>
        </div>

        <div className="min-w-0">
          <Link
            href={`/track/${trackId}`}
            className="block min-w-0 hover:opacity-90"
            aria-label={`Ver detalle de ${title}`}
          >
            <LoopingText
              text={title}
              className="text-left text-[11px] font-semibold leading-tight text-foreground sm:text-[12px]"
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
              className="text-left text-[9px] leading-tight text-muted-foreground sm:text-[10px]"
              speedPxPerSecond={30}
              forceLoopOnMobile
            />
          </Link>
        </div>

        <div className="flex min-w-0 items-center">
          <div className="min-w-0 flex-1 px-16">
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
                  colors={{ base: "__theme_base__", progress: "__theme_progress__" }}
                />
              </div>
              <div className="hidden shrink-0 text-[10px] tabular-nums text-muted-foreground sm:block">
                {formatTime(currentSec)} / {formatTime(durationSec)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            className={cn(
              "hidden h-8 w-8 items-center justify-center rounded border transition lg:inline-flex",
              hasPrev
                ? "border-border bg-card text-foreground hover:border-foreground/70 hover:bg-muted"
                : "cursor-not-allowed border-border/70 bg-card text-muted-foreground/55",
            )}
            aria-label="Track anterior"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            className={cn(
              "hidden h-8 w-8 items-center justify-center rounded border transition lg:inline-flex",
              hasNext
                ? "border-border bg-card text-foreground hover:border-foreground/70 hover:bg-muted"
                : "cursor-not-allowed border-border/70 bg-card text-muted-foreground/55",
            )}
            aria-label="Siguiente track"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>

          <Link
            href={`/track/${trackId}`}
            className="hidden h-8 w-8 items-center justify-center rounded border border-border bg-card text-foreground transition hover:border-foreground/70 hover:bg-muted lg:inline-flex"
            aria-label="Abrir ficha del track"
            title="Abrir track"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>

          <Link
            href={`/track/${trackId}#licencias`}
            className="hidden h-8 w-8 items-center justify-center rounded border border-border bg-card text-foreground transition hover:border-foreground/70 hover:bg-muted lg:inline-flex"
            aria-label="Ver licencias"
            title="Ver licencias"
          >
            <FileText className="h-3.5 w-3.5" />
          </Link>

          <button
            type="button"
            onClick={onToggleMute}
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-border bg-card text-foreground transition hover:border-foreground/70 hover:bg-muted"
            aria-label={isMuted ? "Activar audio" : "Silenciar audio"}
            title={isMuted ? "Activar audio" : "Silenciar audio"}
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>

          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(volume * 100)}
            onChange={(event) => onVolumeChange(Number(event.target.value) / 100)}
            className="hidden h-2 w-20 cursor-pointer accent-foreground xl:block"
            aria-label="Volumen general"
          />

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-border bg-card text-foreground transition hover:border-foreground/70 hover:bg-muted"
            aria-label="Cerrar reproductor"
            title="Cerrar reproductor"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
