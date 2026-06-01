"use client";

import { useEffect, useMemo } from "react";
import type { ComponentType } from "react";

import HomeVariantAssetCircuit from "./HomeVariantAssetCircuit";
import HomeVariantDropLedger from "./HomeVariantDropLedger";
import HomeVariantEditorialWall from "./HomeVariantEditorialWall";
import HomeVariantMonitorWall from "./HomeVariantMonitorWall";
import HomeVariantOdrIndex from "./HomeVariantOdrIndex";
import HomeVariantPortalGrid from "./HomeVariantPortalGrid";
import HomeVariantProductTicker from "./HomeVariantProductTicker";
import HomeVariantSearchMonolith from "./HomeVariantSearchMonolith";
import HomeVariantSignalBoard from "./HomeVariantSignalBoard";
import HomeVariantSoundMuseum from "./HomeVariantSoundMuseum";
import HomeVariantSplitDecision from "./HomeVariantSplitDecision";
import HomeVariantTen from "./HomeVariantTen";
import type { HomeVariantProps } from "./data";

const variants: ComponentType<HomeVariantProps>[] = [
  HomeVariantEditorialWall,
  HomeVariantSignalBoard,
  HomeVariantSearchMonolith,
  HomeVariantOdrIndex,
  HomeVariantTen,
  HomeVariantPortalGrid,
  HomeVariantDropLedger,
  HomeVariantSoundMuseum,
  HomeVariantSplitDecision,
  HomeVariantAssetCircuit,
  HomeVariantProductTicker,
  HomeVariantMonitorWall,
];

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
          <div key={index} className="snap-start" style={panelStyle}>
            <Variant optionIndex={index + 1} optionTotal={variants.length} />
          </div>
        ))}
      </div>
    </main>
  );
}
