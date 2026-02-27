"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/components/public/WaveformScrubber.tsx                         │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Dibuja una forma de onda "tipo Artlist": silueta continua rellena,        │
 * │   con overlay de progreso.                                                   │
 * │ - Sin trazo, sin línea central (solo fill).                                  │
 * │ - Re-muestrea tu Float32Array al ancho del canvas y aplica un suavizado      │
 * │   ligero para que la silueta se vea fluida.                                   │
 * │ - Click-to-seek: emite onSeek(seg).                                          │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Este componente no maneja el <audio>; solo dibuja y calcula el seek.       │
 * │ - El padre debe pasar `progress` (0..1) y `onSeek`.                           │
 * │ - No necesitas "más muestras" en BD: re-muestreamos internamente.            │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import * as React from "react";

type Props = {
  waveformB64: string | null;                 // Float32 (bytes) en base64 desde BD
  height?: number;                            // alto del canvas en px
  durationSec?: number;                       // duración total (para mapear clicks)
  progress?: number;                          // 0..1, progreso actual
  barWidth?: number;                          // opcional: ancho de barra (para compatibilidad con callers)
  gap?: number;                               // opcional: gap entre barras (compat)
  onSeek?: (timeSec: number) => void;         // callback al click
  className?: string;
  frameClassName?: string;                     // clases para el contenedor (permite quitar borde)
  colors?: {
    base?: string;                            // color parte no reproducida (acepta currentColor / var(--foreground))
    progress?: string;                        // color parte reproducida (acepta currentColor / var(--foreground))
  };
  smooth?: boolean;                           // suavizar la silueta (default true)
  smoothWindow?: number;                      // ventana del suavizado (píxeles virtuales)
};

/** base64 → Float32Array (bytes de float32) */
function b64ToFloat32(b64: string): Float32Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Float32Array(bytes.buffer);
}

/** Re-muestrea a `cols` columnas: tomamos el pico (max |v|) por columna */
function resamplePeaksAbs(src: Float32Array, cols: number): Float32Array {
  const out = new Float32Array(cols);
  const N = src.length;
  for (let c = 0; c < cols; c++) {
    const start = Math.floor((c / cols) * N);
    const end = Math.max(start + 1, Math.floor(((c + 1) / cols) * N));
    let peak = 0;
    for (let i = start; i < end; i++) {
      const v = Math.abs(src[i] ?? 0);
      if (v > peak) peak = v;
    }
    out[c] = peak; // 0..1
  }
  return out;
}

/** Suavizado caja (moving average) muy ligero para redondear la silueta */
function smoothBox(src: Float32Array, window = 3): Float32Array {
  if (window <= 1) return src;
  const out = new Float32Array(src.length);
  const half = Math.floor(window / 2);
  for (let i = 0; i < src.length; i++) {
    let sum = 0;
    let cnt = 0;
    for (let k = -half; k <= half; k++) {
      const j = i + k;
      if (j >= 0 && j < src.length) {
        sum += src[j]!;
        cnt++;
      }
    }
    out[i] = sum / (cnt || 1);
  }
  return out;
}

function makeFallbackWaveform(samples = 2048): Float32Array {
  const out = new Float32Array(samples);
  for (let i = 0; i < samples; i += 1) {
    const t = i / Math.max(1, samples - 1);
    const envelope = 0.22 + 0.16 * Math.sin(t * Math.PI * 2.8) + 0.08 * Math.sin(t * Math.PI * 9.6);
    out[i] = Math.max(0.04, Math.min(0.55, Math.abs(envelope)));
  }
  return out;
}

function isLightTheme(): boolean {
  const root = document.documentElement;
  if (root.classList.contains("light")) return true;
  const cs = getComputedStyle(root);
  return (cs.colorScheme || "").includes("light");
}

function resolveColor(input: string | undefined, el: HTMLElement | null): string {
  if (!input) return "#fff";
  const fallback = "#fff";

  // Tokens especiales
  if (input === "__theme_base__") {
    return isLightTheme() ? "rgba(0,0,0,0.52)" : "#3c3b3f";
  }
  if (input === "__theme_progress__") {
    const fgRoot = getComputedStyle(document.documentElement).getPropertyValue("--foreground");
    return fgRoot?.trim() || fallback;
  }

  if (input.includes("currentColor")) {
    const color = el ? getComputedStyle(el).color : null;
    return color || fallback;
  }
  if (input.includes("var(--foreground)")) {
    const root = el ? getComputedStyle(el) : getComputedStyle(document.documentElement);
    const fg = root.getPropertyValue("--foreground");
    return fg?.trim() || fallback;
  }
  if (input.includes("var(--background)")) {
    const root = el ? getComputedStyle(el) : getComputedStyle(document.documentElement);
    const bg = root.getPropertyValue("--background");
    return bg?.trim() || fallback;
  }
  return input;
}

export default function WaveformScrubber({
  waveformB64,
  height = 80,
  durationSec = 0,
  progress = 0,
  onSeek,
  className = "",
  frameClassName = "relative select-none rounded-[2px] bg-transparent",
  colors = {
    base: "__theme_base__",
    progress: "__theme_progress__",
  },
  smooth = true,
  smoothWindow = 5,
}: Props) {
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const wfRef = React.useRef<Float32Array | null>(null);
  const peaksRef = React.useRef<Float32Array | null>(null); // picos re-muestreados (0..1)
  const progressRef = React.useRef(0);

  /** Recalcula picos al tamaño actual */
  const recompute = React.useCallback(() => {
    const c = canvasRef.current;
    const w = wrapperRef.current;
    const wf = wfRef.current;
    if (!c || !w || !wf || wf.length === 0) return;

    const cssW = Math.max(1, Math.floor(w.clientWidth));
    const cssH = height;
    const dpr = window.devicePixelRatio || 1;

    c.width = cssW * dpr;
    c.height = cssH * dpr;
    c.style.width = `${cssW}px`;
    c.style.height = `${cssH}px`;

    // Re-muestreamos a una columna por pixel (look continuo)
    let peaks = resamplePeaksAbs(wf, cssW);

    // Suavizado ligero (opcional)
    if (smooth) {
      peaks = smoothBox(peaks, smoothWindow);
    }
    peaksRef.current = peaks;
  }, [height, smooth, smoothWindow]);

  /** Dibuja silueta y overlay de progreso */
  const draw = React.useCallback(
    (p: number) => {
      const c = canvasRef.current;
      const peaks = peaksRef.current;
      if (!c || !peaks) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const frameEl = wrapperRef.current;
      const baseColor = resolveColor(colors.base, frameEl);
      const progressColor = resolveColor(colors.progress, frameEl);

      const dpr = window.devicePixelRatio || 1;
      const W = c.width;      // px reales (DPR)
      const H = c.height;
      const cols = peaks.length;
      const mid = H / 2;

      // helper: genera el path de la silueta en el ctx (superior + inferior)
      const makePath = () => {
        ctx.beginPath();
        // Borde superior izquierda → derecha
        for (let xCSS = 0; xCSS < cols; xCSS++) {
          const peak = peaks[xCSS]!;
          const yTop = mid - peak * mid;
          const x = Math.round(xCSS * dpr);
          ctx.lineTo(x, yTop);
        }
        // Borde inferior derecha → izquierda (cerramos la "gota")
        for (let xCSS = cols - 1; xCSS >= 0; xCSS--) {
          const peak = peaks[xCSS]!;
          const yBottom = mid + peak * mid;
          const x = Math.round(xCSS * dpr);
          ctx.lineTo(x, yBottom);
        }
        ctx.closePath();
      };

      // Limpiamos
      ctx.clearRect(0, 0, W, H);

      // BASE
      ctx.fillStyle = baseColor;
      makePath();
      ctx.fill();

      // PROGRESO (clip 0..p*W)
      const clipW = Math.max(0, Math.min(W, Math.round(W * (p || 0))));
      if (clipW > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, clipW, H);
        ctx.clip();

        ctx.fillStyle = progressColor;
        makePath();
        ctx.fill();

        ctx.restore();
      }
    },
    [colors.base, colors.progress],
  );

  /** Cargar/decodificar waveform */
  React.useEffect(() => {
    if (!waveformB64) {
      wfRef.current = makeFallbackWaveform();
      requestAnimationFrame(() => {
        recompute();
        draw(progress);
      });
      return;
    }
    try {
      wfRef.current = b64ToFloat32(waveformB64);
    } catch {
      wfRef.current = makeFallbackWaveform();
    }
    requestAnimationFrame(() => {
      recompute();
      draw(progress);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveformB64]);

  /** Redibuja en resize */
  React.useEffect(() => {
    const w = wrapperRef.current;
    if (!w) return;
    const ro = new ResizeObserver(() => {
      recompute();
      draw(progress);
    });
    ro.observe(w);
    return () => ro.disconnect();
  }, [recompute, draw, progress]);

  /** Sólo repintamos cuando cambia el progreso */
  React.useEffect(() => {
    const clamped = Math.max(0, Math.min(1, progress || 0));
    progressRef.current = clamped;
    draw(clamped);
  }, [progress, draw]);

  /**
   * Re-dibuja al cambiar tema/clases en <html> o <body> (para actualizar currentColor/vars).
   */
  React.useEffect(() => {
    const nodes = [document.documentElement, document.body].filter(Boolean) as Element[];
    const observer = new MutationObserver(() => {
      draw(progressRef.current);
    });
    nodes.forEach((node) =>
      observer.observe(node, {
        attributes: true,
        attributeFilter: ["class", "style", "data-theme"],
      }),
    );
    return () => observer.disconnect();
  }, [draw]);

  /** Click → seek */
  function handleClick(e: React.MouseEvent) {
    if (!onSeek || !durationSec || durationSec <= 0) return;
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
    const t = (x / (rect.width || 1)) * durationSec;
    onSeek(t);
  }

  return (
    <div
      ref={wrapperRef}
      className={`${frameClassName} ${className}`}
      style={{ height }}
      aria-label="Forma de onda (clic para saltar)"
      onClick={handleClick}
    >
      {/* Canvas: solo fill; sin línea central */}
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
