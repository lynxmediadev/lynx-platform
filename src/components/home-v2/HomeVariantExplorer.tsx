"use client";

import { useEffect, useMemo } from "react";
import type { ComponentType } from "react";

import HomeVariantEditorialWall from "./HomeVariantEditorialWall";
import HomeVariantOdrIndex from "./HomeVariantOdrIndex";
import HomeVariantSearchMonolith from "./HomeVariantSearchMonolith";
import HomeVariantSignalBoard from "./HomeVariantSignalBoard";
import type { HomeVariantProps } from "./data";

const variants: ComponentType<HomeVariantProps>[] = [
  HomeVariantEditorialWall,
  HomeVariantSignalBoard,
  HomeVariantSearchMonolith,
  HomeVariantOdrIndex,
];

const inverseThemeIndexes = new Set([0, 1, 2]);

export default function HomeVariantExplorer() {
  const panelStyle = useMemo(
    () => ({ height: "calc(100dvh - var(--header-h))" as const }),
    [],
  );

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

  return (
    <main className="-mx-4 sm:-mx-6">
      <div
        className="overflow-y-auto overscroll-y-contain snap-y snap-proximity md:snap-mandatory"
        style={panelStyle}
      >
        {variants.map((Variant, index) => (
          <div
            key={index}
            className={`snap-start ${inverseThemeIndexes.has(index) ? "home-theme-inverse" : ""}`}
            style={panelStyle}
          >
            <Variant optionIndex={index + 1} optionTotal={variants.length} />
          </div>
        ))}
      </div>
    </main>
  );
}
