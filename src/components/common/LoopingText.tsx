"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  className?: string;
  speedPxPerSecond?: number;
  forceLoopOnMobile?: boolean;
};

export default function LoopingText({
  text,
  className,
  speedPxPerSecond = 40,
  forceLoopOnMobile = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const [shouldLoop, setShouldLoop] = useState(false);
  const [durationSec, setDurationSec] = useState(10);
  const [distancePx, setDistancePx] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const update = () => {
      const containerWidth = container.clientWidth;
      const textWidth = measure.scrollWidth;
      const isMobileViewport = window.matchMedia("(max-width: 768px)").matches;
      const hardOverflow = textWidth > containerWidth + 4;
      const nearOverflowOnMobile =
        forceLoopOnMobile && isMobileViewport && textWidth > containerWidth - 10;
      const overflow = hardOverflow || nearOverflowOnMobile;
      setShouldLoop(overflow);
      if (overflow) {
        const gapPx = 24;
        const travelPx = Math.max(1, Math.ceil(textWidth + gapPx));
        const safeSpeed = Math.max(18, speedPxPerSecond);
        const nextDuration = Math.max(4.5, travelPx / safeSpeed);
        setDistancePx(travelPx);
        setDurationSec(nextDuration);
      } else {
        setDistancePx(0);
      }
    };

    const scheduleUpdate = () => {
      update();
      window.setTimeout(update, 120);
      window.setTimeout(update, 480);
      window.setTimeout(update, 1100);
    };

    const rafId = window.requestAnimationFrame(scheduleUpdate);
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("orientationchange", scheduleUpdate);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(scheduleUpdate);
      observer.observe(container);
      observer.observe(measure);
    }

    // Font swap async puede cambiar el ancho real en mobile.
    const fonts = document.fonts;
    if (fonts?.ready) {
      void fonts.ready.then(scheduleUpdate).catch(() => undefined);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("orientationchange", scheduleUpdate);
      observer?.disconnect();
    };
  }, [text, speedPxPerSecond, forceLoopOnMobile]);

  const loopStyle = useMemo<CSSProperties | undefined>(() => {
    if (!shouldLoop || distancePx <= 0) return undefined;
    return {
      animation: `lm-loop-scroll ${durationSec}s linear infinite`,
      WebkitAnimation: `lm-loop-scroll ${durationSec}s linear infinite`,
      ["--lm-loop-distance" as keyof CSSProperties]: `-${distancePx}px`,
    };
  }, [shouldLoop, durationSec, distancePx]);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden">
      <span
        ref={measureRef}
        aria-hidden
        className={cn(
          "pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap px-0 text-left",
          className,
        )}
      >
        {text}
      </span>
      {shouldLoop ? (
        <div
          className={cn(
            "flex w-max items-center whitespace-nowrap will-change-transform [transform:translate3d(0,0,0)]",
            className,
          )}
          style={loopStyle}
        >
          <span className="inline-block shrink-0 whitespace-nowrap pr-6">
            {text}
          </span>
          <span aria-hidden className="inline-block shrink-0 whitespace-nowrap pr-6">
            {text}
          </span>
        </div>
      ) : (
        <span className={cn("block truncate whitespace-nowrap text-center", className)}>
          {text}
        </span>
      )}
    </div>
  );
}
