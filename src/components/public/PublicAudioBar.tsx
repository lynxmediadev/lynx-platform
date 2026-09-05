"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/components/public/PublicAudioBar.tsx                           │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Objetivo                                                                    │
 * │ - Reproductor compacto: botón play/pause + tiempo + forma de onda clickable │
 * │   que además **auto-reproduce** si estaba en pausa al hacer click en la onda│
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Usamos un <audio> oculto y lo controlamos con refs.                       │
 * │ - El estado `isPlaying` se actualiza SOLO por eventos del <audio>           │
 * │   (play/pause/ended), no al “dedo”; así evitamos el warning de play/pause.  │
 * │ - En `onSeek`: movemos currentTime y, si estaba pausado, llamamos a play(). │
 * │ - Pasamos `progress` (0..1) al WaveformScrubber para colorear el avance.    │
 * │ - Layout flexible:                                                           │
 * │   - `layout="stacked"` (default): botón + tiempo a la izquierda, waveform   │
 * │     a la derecha.                                                           │
 * │   - `layout="inline"`: solo waveform + tiempo en un contenedor a la derecha │
 * │     (para heroes públicos con play externo).                                │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import * as React from "react";
import WaveformScrubber from "./WaveformScrubber";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  src: string | null;
  durationSec?: number; // fallback de duración (si no hay metadata del audio aún)
  waveformB64: string | null;
  interactive?: boolean;
  waveformColors?: { base?: string; progress?: string };
  className?: string;
  frameClassName?: string;
  barWidth?: number;
  gap?: number;
  onPlaybackChange?: (isPlaying: boolean) => void;
  onReady?: (controls: {
    toggle: () => Promise<void> | void;
    play: () => Promise<void> | void;
    pause: () => void;
  }) => void;
  layout?: "stacked" | "inline";
};

function fmtTime(sec: number) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function PublicAudioBar({
  src,
  durationSec = 0,
  waveformB64,
  interactive = true,
  waveformColors,
  className,
  frameClassName,
  barWidth = 3,
  gap = 0,
  onPlaybackChange,
  onReady,
  layout = "stacked",
}: Props) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Estado derivado **solo** por eventos del <audio>
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [cur, setCur] = React.useState(0);
  const [dur, setDur] = React.useState(durationSec || 0);

  const disabled = !src;

  // Suscribimos eventos del <audio> para mantener el estado “de verdad”
  React.useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onMeta = () => setDur(el.duration || durationSec || 0);
    const onTime = () => setCur(el.currentTime || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, [durationSec]);

  // Botón play/pause
  const toggle = React.useCallback(async () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      try {
        await el.play(); // los eventos actualizarán isPlaying
      } catch {
        /* autoplay bloqueado u otro detalle */
      }
    } else {
      el.pause(); // evento “pause” actualizará isPlaying
    }
  }, []);

  const play = React.useCallback(async () => {
    const el = audioRef.current;
    if (!el) return;
    try {
      await el.play();
    } catch {
      /* ignore */
    }
  }, []);

  const pause = React.useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
  }, []);

  // Click en waveform → mover el tiempo
  function handleSeek(sec: number) {
    const el = audioRef.current;
    if (!el || !dur) return;

    // 1) Clamp y asignación del tiempo
    el.currentTime = Math.max(0, Math.min(sec, dur));

    // 2) Si estaba en pausa, reproducimos (gesto de usuario → permitido)
    if (el.paused) {
      el.play().catch(() => {
        /* si falla, lo ignoramos; no forzamos estado manual */
      });
    }
  }

  // Progreso para pintar la parte “reproducida”
  const progress = !dur ? 0 : Math.max(0, Math.min(1, cur / dur));
  const baseWaveHeight = layout === "inline" ? 64 : 64;
  const waveHeight = Math.round(baseWaveHeight * 0.5); // altura reducida ~50%

  // Avisar estado al padre si se requiere
  React.useEffect(() => {
    if (onPlaybackChange) {
      onPlaybackChange(isPlaying);
    }
  }, [isPlaying, onPlaybackChange]);

  // Registrar controles externos
  React.useEffect(() => {
    if (!onReady) return;
    onReady({ toggle, play, pause });
  }, [onReady, play, pause, toggle]);

  return (
    <div
      className={cn(
        "border-border bg-card/80 rounded-[2px] border p-3 shadow-sm",
        className,
      )}
    >
      {layout === "stacked" ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={cn(
                "border-border bg-background flex h-10 w-10 items-center justify-center rounded-[2px] border text-sm font-medium transition",
                disabled
                  ? "cursor-not-allowed opacity-70"
                  : "text-foreground hover:bg-border/20 focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              )}
              onClick={toggle}
              disabled={disabled}
            >
              <span className="sr-only">
                {isPlaying ? "Pausar" : "Reproducir"}
              </span>
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <div className="border-border bg-background/80 text-muted-foreground flex h-9 min-w-[92px] items-center justify-center rounded-[2px] border px-2 text-[11px] tabular-nums">
              {fmtTime(cur)} / {fmtTime(dur)}
            </div>
          </div>

          <div className="flex min-h-[48px] flex-1 items-center">
            <WaveformScrubber
              waveformB64={waveformB64}
              height={waveHeight}
              durationSec={dur}
              progress={progress}
              onSeek={interactive ? handleSeek : undefined}
              className="w-full"
              barWidth={barWidth} // barras compactas pero sólidas
              gap={gap} // sin huecos entre barras
              frameClassName={frameClassName}
              colors={{
                base: waveformColors?.base ?? "__theme_base__", // COLOR BASE DEL PLAYER
                progress: waveformColors?.progress ?? "__theme_progress__", // COLOR DE AVANCE PLAYER
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-stretch gap-3">
          <div
            className="flex min-w-0 flex-1 items-center"
            style={{ height: waveHeight }}
          >
            <WaveformScrubber
              waveformB64={waveformB64}
              height={waveHeight}
              durationSec={dur}
              progress={progress}
              onSeek={interactive ? handleSeek : undefined}
              className="h-full w-full"
              barWidth={barWidth}
              gap={gap}
              frameClassName={frameClassName}
              colors={{
                base: waveformColors?.base ?? "__theme_base__",
                progress: waveformColors?.progress ?? "__theme_progress__",
              }}
            />
          </div>
          <div
            aria-hidden="true"
            className="flex items-center"
            style={{ height: waveHeight }}
          >
            <div className="bg-border w-px" style={{ height: waveHeight }} />
          </div>
          <div
            className="border-border bg-background/80 text-foreground flex w-[132px] min-w-[120px] items-center justify-center rounded-[2px] border px-3 text-[12px] leading-none font-medium tabular-nums"
            style={{ height: waveHeight, minHeight: waveHeight }}
          >
            {fmtTime(cur)} / {fmtTime(dur)}
          </div>
        </div>
      )}

      {/* Audio real (oculto pero controlado por ref) */}
      <audio ref={audioRef} src={src ?? undefined} preload="metadata" />
    </div>
  );
}
