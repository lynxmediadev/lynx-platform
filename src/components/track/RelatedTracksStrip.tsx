"use client";
/* eslint-disable @next/next/no-img-element -- Las portadas provienen de URLs dinámicas de R2. */

import Link from "next/link";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import {
  useGlobalPlayer,
  useGlobalPlayerState,
  type GlobalPlayerTrack,
} from "@/components/player/global-player-context";
import { cn } from "@/lib/utils";

export type RelatedTrack = {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl: string;
  durationSec: number | null;
  bpm: number | null;
  key: string | null;
};

function toPlayerTrack(track: RelatedTrack): GlobalPlayerTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    audioUrl: track.audioUrl,
    coverUrl: track.coverUrl,
    durationSec: track.durationSec,
    waveformB64: null,
  };
}

export default function RelatedTracksStrip({
  tracks,
}: {
  tracks: RelatedTrack[];
}) {
  const { currentTrack, isPlaying } = useGlobalPlayerState();
  const { playTrack, togglePlay } = useGlobalPlayer();
  const queue = tracks.map(toPlayerTrack);

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {tracks.map((track) => {
        const isActive = currentTrack?.id === track.id;
        return (
          <article
            key={track.id}
            className="group border-border bg-card/40 overflow-hidden rounded border"
          >
            <div className="bg-card relative aspect-[4/3] overflow-hidden">
              <img
                src={track.coverUrl}
                alt={`Cover de ${track.title}`}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                loading="lazy"
                decoding="async"
              />
              <button
                type="button"
                disabled={!track.audioUrl}
                onClick={() => {
                  if (isActive) {
                    togglePlay();
                    return;
                  }
                  playTrack(toPlayerTrack(track), {
                    queue,
                    queuePolicy: "replace",
                    queueSource: "related-tracks",
                  });
                }}
                className={cn(
                  "absolute bottom-2 left-2 inline-flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition",
                  isActive
                    ? "border-foreground bg-foreground text-background"
                    : "border-white/60 bg-black/45 text-white hover:bg-white hover:text-black",
                  !track.audioUrl && "cursor-not-allowed opacity-45",
                )}
                aria-label={
                  isActive && isPlaying
                    ? `Pausar ${track.title}`
                    : `Reproducir ${track.title}`
                }
              >
                {isActive && isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="ml-0.5 h-4 w-4" />
                )}
              </button>
            </div>

            <div className="p-3">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3
                    className="text-foreground truncate text-sm font-semibold"
                    title={track.title}
                  >
                    {track.title}
                  </h3>
                  <p
                    className="text-muted-foreground truncate text-xs"
                    title={track.artist}
                  >
                    {track.artist}
                  </p>
                </div>
                <Link
                  href={`/track/${track.id}`}
                  className="border-border text-muted-foreground hover:border-foreground hover:text-foreground inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border transition"
                  aria-label={`Abrir ${track.title}`}
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <p className="text-muted-foreground mt-2 text-[10px] tracking-[0.12em] uppercase">
                {track.bpm ? `${Math.round(track.bpm)} BPM` : "BPM —"} ·{" "}
                {track.key || "Key —"}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
