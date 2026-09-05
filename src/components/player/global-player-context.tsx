"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const PLAYER_SESSION_KEY = "odr:global-player:session:v1";
const PLAYER_VOLUME_STORAGE_KEY = "catalog:player-volume";

export type GlobalPlayerQueuePolicy = "replace" | "keep" | "if-empty";

export type GlobalPlayerTrack = {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl: string | null;
  waveformB64?: string | null;
  durationSec?: number | null;
};

type PersistedPlayerSnapshot = {
  track: GlobalPlayerTrack | null;
  queue: GlobalPlayerTrack[];
  queueIndex: number;
  queueSource: string | null;
  isPlaying: boolean;
  currentSec: number;
  durationSec: number;
  progress: number;
  volume: number;
};

type PlayTrackOptions = {
  queue?: GlobalPlayerTrack[];
  queuePolicy?: GlobalPlayerQueuePolicy;
  queueSource?: string | null;
  seekRatio?: number;
};

type GlobalPlayerState = {
  currentTrack: GlobalPlayerTrack | null;
  queue: GlobalPlayerTrack[];
  queueIndex: number;
  queueSource: string | null;
  isPlaying: boolean;
  currentSec: number;
  durationSec: number;
  progress: number;
  volume: number;
  hasPrev: boolean;
  hasNext: boolean;
};

type GlobalPlayerActions = {
  playTrack: (track: GlobalPlayerTrack, options?: PlayTrackOptions) => void;
  togglePlay: () => void;
  seekByRatio: (ratio: number) => void;
  seekByTime: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  playNext: () => void;
  playPrev: () => void;
  closePlayer: () => void;
  isCurrentTrack: (trackId: string) => boolean;
};

type GlobalPlayerContextValue = {
  state: GlobalPlayerState;
  actions: GlobalPlayerActions;
};

const GlobalPlayerContext = createContext<GlobalPlayerContextValue | null>(
  null,
);

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function normalizeTrack(input: GlobalPlayerTrack): GlobalPlayerTrack | null {
  if (!input?.id || !input.audioUrl) return null;
  return {
    id: input.id,
    title: input.title || "Untitled",
    artist: input.artist || "Artista",
    audioUrl: input.audioUrl,
    coverUrl: input.coverUrl ?? null,
    waveformB64: input.waveformB64 ?? null,
    durationSec:
      typeof input.durationSec === "number" &&
      Number.isFinite(input.durationSec) &&
      input.durationSec > 0
        ? Math.floor(input.durationSec)
        : null,
  };
}

function normalizeQueue(queue?: GlobalPlayerTrack[]): GlobalPlayerTrack[] {
  if (!Array.isArray(queue) || queue.length === 0) return [];
  const byId = new Map<string, GlobalPlayerTrack>();
  for (const item of queue) {
    const normalized = normalizeTrack(item);
    if (!normalized) continue;
    if (!byId.has(normalized.id)) byId.set(normalized.id, normalized);
  }
  return Array.from(byId.values());
}

function findTrackIndex(queue: GlobalPlayerTrack[], trackId: string) {
  return queue.findIndex((item) => item.id === trackId);
}

export function GlobalPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackIdRef = useRef<string | null>(null);
  const pendingSeekRatioRef = useRef<number | null>(null);
  const lastNonZeroVolumeRef = useRef(0.85);
  const latestSnapshotRef = useRef<PersistedPlayerSnapshot | null>(null);

  const [currentTrack, setCurrentTrack] = useState<GlobalPlayerTrack | null>(
    null,
  );
  const [queue, setQueue] = useState<GlobalPlayerTrack[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [queueSource, setQueueSource] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [volume, setVolumeState] = useState(0.85);

  const progress = durationSec > 0 ? clamp01(currentSec / durationSec) : 0;
  const hasPrev = queueIndex > 0;
  const hasNext = queueIndex >= 0 && queueIndex < queue.length - 1;

  useEffect(() => {
    currentTrackIdRef.current = currentTrack?.id ?? null;
  }, [currentTrack?.id]);

  const mountTrack = useCallback(
    async (
      track: GlobalPlayerTrack,
      options?: { seekRatio?: number | null; autoplay?: boolean },
    ) => {
      const audio = audioRef.current;
      if (!audio) return;

      const normalizedSeek =
        options?.seekRatio == null ? null : clamp01(options.seekRatio);
      const autoplay = options?.autoplay ?? true;

      const isSameTrack = currentTrackIdRef.current === track.id;
      setCurrentTrack(track);

      if (!isSameTrack) {
        setCurrentSec(0);
        setDurationSec(track.durationSec ?? 0);
        audio.src = track.audioUrl;
        audio.currentTime = 0;
      }

      pendingSeekRatioRef.current = normalizedSeek;
      if (
        normalizedSeek !== null &&
        audio.duration &&
        Number.isFinite(audio.duration) &&
        audio.duration > 0
      ) {
        audio.currentTime = audio.duration * normalizedSeek;
      }

      if (autoplay) {
        try {
          await audio.play();
          setIsPlaying(true);
        } catch {
          setIsPlaying(false);
        }
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    },
    [],
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDurationSec(Math.floor(audio.duration));
      }
      if (
        pendingSeekRatioRef.current !== null &&
        Number.isFinite(audio.duration) &&
        audio.duration > 0
      ) {
        audio.currentTime = audio.duration * pendingSeekRatioRef.current;
        pendingSeekRatioRef.current = null;
      }
    };

    const onTimeUpdate = () => {
      setCurrentSec(audio.currentTime || 0);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = clamp01(volume);
  }, [volume]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(PLAYER_VOLUME_STORAGE_KEY);
      if (!stored) return;
      const parsed = Number(stored);
      if (!Number.isFinite(parsed)) return;
      const normalized = clamp01(parsed);
      setVolumeState(normalized);
      if (normalized > 0) lastNonZeroVolumeRef.current = normalized;
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(PLAYER_VOLUME_STORAGE_KEY, String(volume));
    } catch {
      // ignore
    }
  }, [volume]);

  useEffect(() => {
    latestSnapshotRef.current = currentTrack
      ? {
          track: { ...currentTrack, waveformB64: null },
          queue: queue.map((track) => ({ ...track, waveformB64: null })),
          queueIndex,
          queueSource,
          isPlaying,
          currentSec,
          durationSec,
          progress,
          volume,
        }
      : null;
  }, [
    currentTrack,
    queue,
    queueIndex,
    queueSource,
    isPlaying,
    currentSec,
    durationSec,
    progress,
    volume,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const persist = () => {
      try {
        const snapshot = latestSnapshotRef.current;
        if (!snapshot) {
          window.sessionStorage.removeItem(PLAYER_SESSION_KEY);
          return;
        }
        window.sessionStorage.setItem(
          PLAYER_SESSION_KEY,
          JSON.stringify(snapshot),
        );
      } catch {
        // Storage puede estar deshabilitado o sin cuota; el player sigue funcionando.
      }
    };

    const intervalId = window.setInterval(persist, 2000);
    window.addEventListener("pagehide", persist);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("pagehide", persist);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let parsed: PersistedPlayerSnapshot | null = null;
    try {
      const raw = window.sessionStorage.getItem(PLAYER_SESSION_KEY);
      if (!raw) return;
      parsed = JSON.parse(raw) as PersistedPlayerSnapshot;
    } catch {
      return;
    }
    if (!parsed?.track) return;

    const restoredTrack = normalizeTrack(parsed.track);
    if (!restoredTrack) return;

    const restoredQueue = normalizeQueue(parsed.queue);
    const queueWithTrack =
      restoredQueue.length > 0 ? restoredQueue : [restoredTrack];
    const restoredIndex = Math.max(
      0,
      findTrackIndex(queueWithTrack, restoredTrack.id),
    );
    setQueue(queueWithTrack);
    setQueueIndex(restoredIndex >= 0 ? restoredIndex : 0);
    setQueueSource(parsed.queueSource ?? null);

    const restoredVolume = clamp01(parsed.volume);
    setVolumeState(restoredVolume);
    if (restoredVolume > 0) lastNonZeroVolumeRef.current = restoredVolume;

    const restoreRatio =
      Number.isFinite(parsed.progress) && parsed.progress > 0
        ? clamp01(parsed.progress)
        : Number.isFinite(parsed.currentSec) &&
            Number.isFinite(parsed.durationSec) &&
            parsed.durationSec > 0
          ? clamp01(parsed.currentSec / parsed.durationSec)
          : 0;

    void mountTrack(restoredTrack, {
      seekRatio: restoreRatio,
      autoplay: Boolean(parsed.isPlaying),
    });
  }, [mountTrack]);

  const playTrack = useCallback(
    (incomingTrack: GlobalPlayerTrack, options?: PlayTrackOptions) => {
      const track = normalizeTrack(incomingTrack);
      if (!track) return;

      const incomingQueue = normalizeQueue(options?.queue);
      const policy = options?.queuePolicy ?? "replace";

      let nextQueue = queue;
      let nextQueueIndex = queueIndex;
      let nextQueueSource = queueSource;

      const adoptQueue = (baseQueue: GlobalPlayerTrack[]) => {
        let built = baseQueue;
        let index = findTrackIndex(built, track.id);
        if (index < 0) {
          built = [track, ...built];
          index = 0;
        }
        return { built, index };
      };

      if (policy === "replace") {
        const { built, index } = adoptQueue(
          incomingQueue.length > 0 ? incomingQueue : [track],
        );
        nextQueue = built;
        nextQueueIndex = index;
        nextQueueSource = options?.queueSource ?? null;
      } else if (policy === "if-empty") {
        if (queue.length === 0) {
          const { built, index } = adoptQueue(
            incomingQueue.length > 0 ? incomingQueue : [track],
          );
          nextQueue = built;
          nextQueueIndex = index;
          nextQueueSource = options?.queueSource ?? null;
        } else {
          const index = findTrackIndex(queue, track.id);
          if (index >= 0) {
            nextQueue = queue;
            nextQueueIndex = index;
          } else {
            nextQueue = [...queue, track];
            nextQueueIndex = nextQueue.length - 1;
          }
        }
      } else {
        if (queue.length === 0) {
          const { built, index } = adoptQueue(
            incomingQueue.length > 0 ? incomingQueue : [track],
          );
          nextQueue = built;
          nextQueueIndex = index;
          nextQueueSource = options?.queueSource ?? null;
        } else {
          const index = findTrackIndex(queue, track.id);
          if (index >= 0) {
            nextQueue = queue;
            nextQueueIndex = index;
          } else {
            nextQueue = [...queue, track];
            nextQueueIndex = nextQueue.length - 1;
          }
        }
      }

      setQueue(nextQueue);
      setQueueIndex(nextQueueIndex);
      setQueueSource(nextQueueSource);

      void mountTrack(track, {
        seekRatio: options?.seekRatio ?? null,
        autoplay: true,
      });
    },
    [queue, queueIndex, queueSource, mountTrack],
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (audio.paused) {
      void audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
      return;
    }
    audio.pause();
    setIsPlaying(false);
  }, [currentTrack]);

  const seekByRatio = useCallback(
    (ratio: number) => {
      const audio = audioRef.current;
      if (!audio || !currentTrack) return;
      const normalized = clamp01(ratio);
      const duration =
        audio.duration && Number.isFinite(audio.duration) && audio.duration > 0
          ? audio.duration
          : durationSec;
      if (!duration || !Number.isFinite(duration) || duration <= 0) return;
      audio.currentTime = duration * normalized;
      setCurrentSec(audio.currentTime);
    },
    [currentTrack, durationSec],
  );

  const seekByTime = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;
      if (!audio || !currentTrack) return;
      const duration =
        audio.duration && Number.isFinite(audio.duration) && audio.duration > 0
          ? audio.duration
          : durationSec;
      if (!duration || !Number.isFinite(duration) || duration <= 0) return;
      const normalizedTime = Math.max(0, Math.min(duration, seconds));
      audio.currentTime = normalizedTime;
      setCurrentSec(audio.currentTime);
    },
    [currentTrack, durationSec],
  );

  const setVolume = useCallback((nextVolume: number) => {
    const normalized = clamp01(nextVolume);
    setVolumeState(normalized);
    if (normalized > 0) {
      lastNonZeroVolumeRef.current = normalized;
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (volume > 0.001) {
      setVolumeState(0);
      return;
    }
    setVolumeState(Math.max(0.2, lastNonZeroVolumeRef.current || 0.85));
  }, [volume]);

  const playPrev = useCallback(() => {
    if (!hasPrev) return;
    const previousIndex = queueIndex - 1;
    const previousTrack = queue[previousIndex];
    if (!previousTrack) return;
    setQueueIndex(previousIndex);
    void mountTrack(previousTrack, { autoplay: true });
  }, [hasPrev, queue, queueIndex, mountTrack]);

  const playNext = useCallback(() => {
    if (!hasNext) return;
    const nextIndex = queueIndex + 1;
    const nextTrack = queue[nextIndex];
    if (!nextTrack) return;
    setQueueIndex(nextIndex);
    void mountTrack(nextTrack, { autoplay: true });
  }, [hasNext, queue, queueIndex, mountTrack]);

  const closePlayer = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setCurrentTrack(null);
    setQueue([]);
    setQueueIndex(-1);
    setQueueSource(null);
    setIsPlaying(false);
    setCurrentSec(0);
    setDurationSec(0);
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.removeItem(PLAYER_SESSION_KEY);
      } catch {
        // ignore
      }
    }
  }, []);

  const isCurrentTrack = useCallback(
    (trackId: string) => Boolean(currentTrack && currentTrack.id === trackId),
    [currentTrack],
  );

  const value = useMemo<GlobalPlayerContextValue>(
    () => ({
      state: {
        currentTrack,
        queue,
        queueIndex,
        queueSource,
        isPlaying,
        currentSec,
        durationSec,
        progress,
        volume,
        hasPrev,
        hasNext,
      },
      actions: {
        playTrack,
        togglePlay,
        seekByRatio,
        seekByTime,
        setVolume,
        toggleMute,
        playNext,
        playPrev,
        closePlayer,
        isCurrentTrack,
      },
    }),
    [
      currentTrack,
      queue,
      queueIndex,
      queueSource,
      isPlaying,
      currentSec,
      durationSec,
      progress,
      volume,
      hasPrev,
      hasNext,
      playTrack,
      togglePlay,
      seekByRatio,
      seekByTime,
      setVolume,
      toggleMute,
      playNext,
      playPrev,
      closePlayer,
      isCurrentTrack,
    ],
  );

  return (
    <GlobalPlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" />
    </GlobalPlayerContext.Provider>
  );
}

export function useGlobalPlayerState() {
  const context = useContext(GlobalPlayerContext);
  if (!context) {
    throw new Error(
      "useGlobalPlayerState must be used within GlobalPlayerProvider",
    );
  }
  return context.state;
}

export function useGlobalPlayer() {
  const context = useContext(GlobalPlayerContext);
  if (!context) {
    throw new Error("useGlobalPlayer must be used within GlobalPlayerProvider");
  }
  return context.actions;
}
