"use client";

import { Pause, Play } from "lucide-react";
import LoopingText from "@/components/common/LoopingText";
import { cn } from "@/lib/utils";
import type { CatalogTrack } from "./types";

type Props = {
  track: CatalogTrack;
  isSelected: boolean;
  isActive: boolean;
  showPause: boolean;
  progress: number;
  coverUrl: string;
  durationLabel: string;
  isMobileViewport: boolean;
  onSelect: () => void;
  onPlay: () => void;
};

export default function TrackListItem({
  track,
  isSelected,
  isActive,
  showPause,
  progress,
  coverUrl,
  durationLabel,
  isMobileViewport,
  onSelect,
  onPlay,
}: Props) {
  return (
    <article
      className={cn(
        "relative cursor-pointer overflow-hidden rounded-md border bg-card/80 transition focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground/60",
        isSelected
          ? "border-foreground shadow-[0_0_0_1px_rgba(243,241,234,0.28)]"
          : "border-border hover:border-foreground/60",
      )}
      role="button"
      tabIndex={0}
      aria-label={`Seleccionar ${track.title}`}
      aria-pressed={isSelected}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="flex min-w-0 items-center gap-2 p-2 sm:gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-border bg-card sm:h-20 sm:w-20">
          <img
            src={coverUrl}
            alt={`Cover de ${track.title}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="min-w-0 flex-1 text-left">
          {isMobileViewport ? (
            <LoopingText
              text={track.title}
              className="text-left text-sm font-semibold text-foreground"
              speedPxPerSecond={32}
              forceLoopOnMobile
            />
          ) : (
            <h3 className="truncate text-sm font-semibold text-foreground sm:text-[15px]">
              {track.title}
            </h3>
          )}

          {isMobileViewport ? (
            <LoopingText
              text={track.artist || "Artista"}
              className="text-left text-xs text-muted-foreground"
              speedPxPerSecond={30}
              forceLoopOnMobile
            />
          ) : (
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              {track.artist || "Artista"}
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span>{durationLabel}</span>
            {track.bpm ? <span>{Math.round(track.bpm)} BPM</span> : null}
            {track.key ? <span>{track.key}</span> : null}
          </div>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onPlay();
          }}
          className={cn(
            "mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition sm:mr-3",
            isActive
              ? "border-foreground bg-foreground text-background"
              : "border-foreground/50 text-foreground hover:bg-foreground hover:text-background",
          )}
          aria-label={showPause ? `Pausar ${track.title}` : `Reproducir ${track.title}`}
        >
          {showPause ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
      </div>

      {isActive && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/60">
          <div
            className="h-full bg-foreground transition-[width]"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}
    </article>
  );
}
