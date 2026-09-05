"use client";

/* eslint-disable @next/next/no-img-element -- Las portadas provienen de URLs dinámicas de R2. */
import { Pause, Play } from "lucide-react";
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
  onSelect,
  onPlay,
}: Props) {
  return (
    <article
      className={cn(
        "bg-card/80 focus-visible:ring-foreground/60 relative cursor-pointer overflow-hidden rounded-md border transition focus:outline-none focus-visible:ring-1",
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
        <div className="border-border bg-card relative h-16 w-16 shrink-0 overflow-hidden rounded border sm:h-20 sm:w-20">
          <img
            src={coverUrl}
            alt={`Cover de ${track.title}`}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="min-w-0 flex-1 text-left">
          <h3
            className="text-foreground truncate text-sm font-semibold sm:text-[15px]"
            title={track.title}
          >
            {track.title}
          </h3>
          <p
            className="text-muted-foreground truncate text-xs sm:text-sm"
            title={track.artist || "Artista"}
          >
            {track.artist || "Artista"}
          </p>
          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-[11px]">
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
          aria-label={
            showPause ? `Pausar ${track.title}` : `Reproducir ${track.title}`
          }
        >
          {showPause ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>
      </div>

      {isActive && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/60">
          <div
            className="bg-foreground h-full transition-[width]"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}
    </article>
  );
}
