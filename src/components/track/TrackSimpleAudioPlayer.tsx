"use client";

import * as React from "react";
import { Pause, Play } from "lucide-react";
import {
  useGlobalPlayer,
  useGlobalPlayerState,
} from "@/components/player/global-player-context";
import { cn } from "@/lib/utils";

type Props = {
  trackId: string;
  title: string;
  artist: string;
  src: string | null;
  coverUrl?: string | null;
  waveformB64?: string | null;
  durationSec?: number | null;
  className?: string;
};

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const total = Math.floor(value);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function TrackSimpleAudioPlayer({
  trackId,
  title,
  artist,
  src,
  coverUrl = null,
  waveformB64 = null,
  durationSec,
  className,
}: Props) {
  const { currentTrack, isPlaying: globalIsPlaying, currentSec, durationSec: globalDurationSec } =
    useGlobalPlayerState();
  const {
    playTrack: playGlobalTrack,
    togglePlay: toggleGlobalPlay,
    seekByRatio: seekGlobalByRatio,
  } = useGlobalPlayer();

  const isDisabled = !src;
  const isCurrentTrack = currentTrack?.id === trackId;
  const safeDuration = Math.max(0, isCurrentTrack ? globalDurationSec || durationSec || 0 : durationSec || 0);
  const ratio = safeDuration > 0 ? Math.max(0, Math.min(1, currentSec / safeDuration)) : 0;
  const isPlaying = isCurrentTrack && globalIsPlaying;

  const handleTogglePlay = React.useCallback(() => {
    if (!src) return;
    if (isCurrentTrack) {
      toggleGlobalPlay();
      return;
    }
    playGlobalTrack(
      {
        id: trackId,
        title,
        artist,
        audioUrl: src,
        coverUrl,
        waveformB64,
        durationSec: durationSec ?? null,
      },
      {
        queuePolicy: "keep",
        queueSource: "track-page",
      },
    );
  }, [
    src,
    isCurrentTrack,
    playGlobalTrack,
    trackId,
    title,
    artist,
    coverUrl,
    waveformB64,
    durationSec,
    toggleGlobalPlay,
  ]);

  const onSeek = (nextRatio: number) => {
    if (!src || !safeDuration) return;
    const normalized = Math.max(0, Math.min(1, nextRatio));
    if (isCurrentTrack) {
      seekGlobalByRatio(normalized);
      return;
    }
    playGlobalTrack(
      {
        id: trackId,
        title,
        artist,
        audioUrl: src,
        coverUrl,
        waveformB64,
        durationSec: durationSec ?? null,
      },
      {
        seekRatio: normalized,
        queuePolicy: "keep",
        queueSource: "track-page",
      },
    );
  };

  return (
    <div className={cn("rounded-md border border-border bg-card/50 p-3", className)}>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <button
          type="button"
          onClick={handleTogglePlay}
          disabled={isDisabled}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full border transition",
            isDisabled
              ? "cursor-not-allowed border-border text-muted-foreground"
              : isPlaying
                ? "border-foreground bg-foreground text-background"
                : "border-foreground text-foreground hover:bg-foreground hover:text-background",
          )}
          aria-label={isPlaying ? "Pausar" : "Reproducir"}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
        </button>

        <div className="min-w-0 space-y-1">
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(ratio * 1000)}
            disabled={isDisabled || safeDuration <= 0}
            onChange={(event) => onSeek(Number(event.target.value) / 1000)}
            className="h-2 w-full cursor-pointer accent-foreground"
            aria-label="Barra de progreso de audio"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentSec)}</span>
            <span>{formatTime(safeDuration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
