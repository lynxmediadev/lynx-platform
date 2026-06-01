import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import FindThingsCta from "./FindThingsCta";
import HomeAssetTile from "./HomeAssetTile";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { homeAssets, type HomeVariantProps } from "./data";

const licensePoints = [
  "Usage terms visible before buying",
  "Contracts and summaries in one place",
  "Catalog assets connected to real rights",
];

export default function HomeVariantLicenseFirstStorefront({
  optionIndex = 8,
  optionTotal = 10,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden bg-background">
      <header className="grid border-b border-border p-4 md:grid-cols-[1fr_auto] md:p-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">License-first storefront</p>
          <h1 className="font-cinema-title text-6xl uppercase leading-none tracking-normal md:text-8xl">Clear rights</h1>
        </div>
        <FindThingsCta className="self-end text-3xl md:text-5xl" />
      </header>

      <div className="grid min-h-0 gap-3 p-4 md:grid-cols-[1.1fr_0.9fr] md:p-6">
        <Link
          href="/track/seed-001"
          className="group flex min-h-0 flex-col justify-between border border-border bg-foreground p-5 text-background md:p-7"
        >
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">
            <span>Beat licensing</span>
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </div>
          <div>
            <h2 className="font-cinema-title text-[18vw] uppercase leading-[0.72] tracking-normal md:text-[12vw]">
              License
            </h2>
            <p className="max-w-lg text-sm uppercase leading-snug tracking-[0.1em] opacity-80">
              Buy informed: what you can release, monetize, distribute and perform is visible before checkout.
            </p>
          </div>
        </Link>

        <aside className="grid min-h-0 gap-3">
          <div className="grid border border-border">
            {licensePoints.map((point) => (
              <div key={point} className="flex items-center gap-3 border-b border-border p-3 text-xs uppercase tracking-[0.1em] last:border-b-0 md:p-4">
                <CheckCircle2 className="h-4 w-4" />
                <span>{point}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {homeAssets.slice(0, 2).map((asset) => (
              <HomeAssetTile key={asset.title} asset={asset} compact />
            ))}
          </div>
        </aside>
      </div>

      <footer className="grid grid-cols-3 border-t border-border text-[10px] uppercase tracking-[0.14em]">
        <span className="border-r border-border p-3">Contracts</span>
        <span className="border-r border-border p-3">Conditions</span>
        <span className="p-3">Catalog</span>
      </footer>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
