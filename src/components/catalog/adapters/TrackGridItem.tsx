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
  onSelect: () => void;
  onPlay: () => void;
};

export default function TrackGridItem({
  track,
  isSelected,
  isActive,
  showPause,
  progress,
  coverUrl,
  onSelect,
  onPlay,
}: Props) {
  return (
    <article
      className={cn(
        "group bg-card/80 cursor-pointer overflow-hidden rounded-md border transition",
        isSelected
          ? "border-foreground shadow-[0_0_0_1px_rgba(243,241,234,0.35)]"
          : "border-border hover:border-foreground/60",
      )}
    >
      <div className="bg-card relative aspect-square w-full overflow-hidden">
        <img
          src={coverUrl}
          alt={`Cover de ${track.title}`}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          loading="lazy"
          decoding="async"
        />

        <button
          type="button"
          onClick={onSelect}
          className="absolute inset-0 z-10 cursor-pointer"
          aria-pressed={isSelected}
          aria-label={`Seleccionar ${track.title}`}
        />

        <button
          type="button"
          onClick={onPlay}
          className={cn(
            "absolute bottom-2 left-2 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border backdrop-blur transition",
            isActive
              ? "border-foreground bg-foreground text-background"
              : "border-foreground/50 text-foreground hover:bg-foreground hover:text-background bg-black/40",
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

        {isActive && (
          <div className="absolute inset-x-0 bottom-0 z-20 h-1 bg-black/60">
            <div
              className="bg-foreground h-full transition-[width]"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onSelect}
        className="block w-full cursor-pointer text-left"
        aria-pressed={isSelected}
      >
        <div className="space-y-1 px-2.5 py-2.5">
          <h3
            className="text-foreground truncate text-left text-[15px] leading-tight font-semibold"
            title={track.title}
          >
            {track.title}
          </h3>
          <p
            className="text-muted-foreground truncate text-left text-sm"
            title={track.artist || "Artista"}
          >
            {track.artist || "Artista"}
          </p>
        </div>
      </button>
    </article>
  );
}
