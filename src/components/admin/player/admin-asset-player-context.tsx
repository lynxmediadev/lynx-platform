"use client";

import * as React from "react";
import { FileAudio, Pause, Play, Volume2, VolumeX, X } from "lucide-react";

import {
  adminAssetTypeLabels,
  clampAudioValue,
  formatAudioTime,
  type AdminAssetType,
} from "./admin-asset-player-utils";

export type AdminPlayerAsset = {
  id: string;
  trackId: string;
  label: string;
  type: AdminAssetType;
};

type AdminAssetPlayerState = {
  currentAsset: AdminPlayerAsset | null;
  isPlaying: boolean;
  currentSec: number;
  durationSec: number;
  progress: number;
  volume: number;
  error: string | null;
};

type AdminAssetPlayerActions = {
  playAsset: (asset: AdminPlayerAsset, sourceUrl: string) => Promise<boolean>;
  pause: () => void;
  togglePlay: () => void;
  seekByTime: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  closePlayer: () => void;
};

type AdminAssetPlayerContextValue = {
  state: AdminAssetPlayerState;
  actions: AdminAssetPlayerActions;
};

const AdminAssetPlayerContext =
  React.createContext<AdminAssetPlayerContextValue | null>(null);

function playerError(error: unknown) {
  if (error instanceof DOMException && error.name === "NotSupportedError") {
    return "Este formato no se puede reproducir en el navegador. Puedes descargarlo desde la fila.";
  }
  return "No se pudo reproducir este archivo. Solicita una URL nueva o descárgalo.";
}

export function AdminAssetPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const currentAssetRef = React.useRef<AdminPlayerAsset | null>(null);
  const pendingSeekRef = React.useRef(0);
  const lastNonZeroVolumeRef = React.useRef(0.8);

  const [currentAsset, setCurrentAsset] =
    React.useState<AdminPlayerAsset | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentSec, setCurrentSec] = React.useState(0);
  const [durationSec, setDurationSec] = React.useState(0);
  const [volume, setVolumeState] = React.useState(0.8);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    currentAssetRef.current = currentAsset;
  }, [currentAsset]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      const duration =
        Number.isFinite(audio.duration) && audio.duration > 0
          ? audio.duration
          : 0;
      setDurationSec(duration);
      if (duration > 0 && pendingSeekRef.current > 0) {
        audio.currentTime = Math.min(pendingSeekRef.current, duration);
      }
      pendingSeekRef.current = 0;
    };
    const onTimeUpdate = () => setCurrentSec(audio.currentTime || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentSec(
        Number.isFinite(audio.duration) && audio.duration > 0
          ? audio.duration
          : 0,
      );
    };
    const onError = () => {
      setIsPlaying(false);
      setError(
        "Este formato no se puede reproducir en el navegador. Puedes descargarlo desde la fila.",
      );
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, []);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = clampAudioValue(volume);
  }, [volume]);

  const playAsset = React.useCallback(
    async (asset: AdminPlayerAsset, sourceUrl: string) => {
      const audio = audioRef.current;
      if (!audio || !sourceUrl) return false;

      const resumeAt =
        currentAssetRef.current?.id === asset.id ? audio.currentTime || 0 : 0;
      audio.pause();
      pendingSeekRef.current = resumeAt;
      setCurrentAsset(asset);
      setCurrentSec(resumeAt);
      setDurationSec(0);
      setError(null);
      audio.src = sourceUrl;
      audio.load();

      try {
        await audio.play();
        setIsPlaying(true);
        return true;
      } catch (reason) {
        setIsPlaying(false);
        setError(playerError(reason));
        return false;
      }
    },
    [],
  );

  const pause = React.useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentAssetRef.current) return;
    if (audio.paused) {
      void audio.play().catch((reason) => {
        setIsPlaying(false);
        setError(playerError(reason));
      });
      return;
    }
    audio.pause();
  }, []);

  const seekByTime = React.useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !currentAssetRef.current) return;
    const duration =
      Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : durationSec;
    if (!Number.isFinite(duration) || duration <= 0) return;
    const next = Math.max(0, Math.min(duration, seconds));
    audio.currentTime = next;
    setCurrentSec(next);
  }, [durationSec]);

  const setVolume = React.useCallback((nextVolume: number) => {
    const normalized = clampAudioValue(nextVolume);
    setVolumeState(normalized);
    if (normalized > 0) lastNonZeroVolumeRef.current = normalized;
  }, []);

  const toggleMute = React.useCallback(() => {
    setVolumeState((current) => {
      if (current > 0.001) return 0;
      return Math.max(0.15, lastNonZeroVolumeRef.current || 0.8);
    });
  }, []);

  const closePlayer = React.useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    pendingSeekRef.current = 0;
    setCurrentAsset(null);
    setIsPlaying(false);
    setCurrentSec(0);
    setDurationSec(0);
    setError(null);
  }, []);

  const value = React.useMemo<AdminAssetPlayerContextValue>(
    () => ({
      state: {
        currentAsset,
        isPlaying,
        currentSec,
        durationSec,
        progress: durationSec > 0 ? clampAudioValue(currentSec / durationSec) : 0,
        volume,
        error,
      },
      actions: {
        playAsset,
        pause,
        togglePlay,
        seekByTime,
        setVolume,
        toggleMute,
        closePlayer,
      },
    }),
    [
      closePlayer,
      currentAsset,
      currentSec,
      durationSec,
      error,
      isPlaying,
      pause,
      playAsset,
      seekByTime,
      setVolume,
      toggleMute,
      togglePlay,
      volume,
    ],
  );

  return (
    <AdminAssetPlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" />
      <AdminAssetPlayerHost />
    </AdminAssetPlayerContext.Provider>
  );
}

export function useAdminAssetPlayerState() {
  const context = React.useContext(AdminAssetPlayerContext);
  if (!context) {
    throw new Error(
      "useAdminAssetPlayerState must be used within AdminAssetPlayerProvider",
    );
  }
  return context.state;
}

export function useAdminAssetPlayer() {
  const context = React.useContext(AdminAssetPlayerContext);
  if (!context) {
    throw new Error(
      "useAdminAssetPlayer must be used within AdminAssetPlayerProvider",
    );
  }
  return context.actions;
}

export function AdminAssetPlayerContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentAsset } = useAdminAssetPlayerState();
  return (
    <div className={currentAsset ? "pb-[116px] sm:pb-[92px]" : undefined}>
      {children}
    </div>
  );
}

function AdminAssetPlayerHost() {
  const {
    currentAsset,
    isPlaying,
    currentSec,
    durationSec,
    volume,
    error,
  } = useAdminAssetPlayerState();
  const {
    togglePlay,
    seekByTime,
    setVolume,
    toggleMute,
    closePlayer,
  } = useAdminAssetPlayer();

  if (!currentAsset) return null;

  return (
    <section
      aria-label="Reproductor de assets del administrador"
      className="border-border bg-card/98 fixed inset-x-0 bottom-0 z-50 border-t shadow-[0_-8px_30px_rgba(0,0,0,0.28)] backdrop-blur"
    >
      <div className="mx-auto grid min-h-[64px] w-[calc(100%-2rem)] max-w-[1360px] grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-2 py-2 sm:grid-cols-[minmax(10rem,15rem)_auto_minmax(12rem,1fr)_auto_auto] sm:gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="bg-primary/10 text-primary inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
            <FileAudio className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12px] leading-tight font-semibold">
              {currentAsset.label}
            </p>
            <p className="text-muted-foreground mt-0.5 text-[10px] leading-tight">
              {adminAssetTypeLabels[currentAsset.type]}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pausar" : "Reproducir"}
          title={isPlaying ? "Pausar" : "Reproducir"}
          className="border-border hover:bg-muted/50 focus-visible:ring-ring inline-flex h-9 w-9 items-center justify-center rounded-md border focus-visible:ring-2 focus-visible:outline-none"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Play className="h-4 w-4" aria-hidden="true" />
          )}
        </button>

        <div className="order-last col-span-4 flex min-w-0 items-center gap-2 text-[10px] tabular-nums sm:order-none sm:col-span-1 sm:text-xs">
          <input
            type="range"
            min="0"
            max={durationSec || 0}
            step="0.01"
            value={Math.min(currentSec, durationSec || 0)}
            disabled={durationSec <= 0}
            onChange={(event) => seekByTime(Number(event.target.value))}
            aria-label="Posición de reproducción"
            className="accent-primary h-1.5 min-w-0 flex-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          />
          <span className="text-muted-foreground shrink-0 whitespace-nowrap">
            {formatAudioTime(currentSec)} / {formatAudioTime(durationSec)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={volume > 0.001 ? "Silenciar" : "Activar sonido"}
            title={volume > 0.001 ? "Silenciar" : "Activar sonido"}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex h-8 w-8 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none"
          >
            {volume > 0.001 ? (
              <Volume2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <VolumeX className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            aria-label="Volumen"
            className="accent-primary hidden h-1.5 w-20 cursor-pointer sm:block"
          />
        </div>

        <button
          type="button"
          onClick={closePlayer}
          aria-label="Cerrar reproductor"
          title="Cerrar reproductor"
          className="border-border hover:bg-muted/50 focus-visible:ring-ring inline-flex h-9 w-9 items-center justify-center rounded-md border focus-visible:ring-2 focus-visible:outline-none"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        {error ? (
          <p role="alert" className="text-destructive w-full text-xs">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
