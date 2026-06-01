import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import FindThingsCta from "./FindThingsCta";
import HomeAssetTile from "./HomeAssetTile";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { homeAssets, type HomeVariantProps } from "./data";

export default function HomeVariantMonochromeMarketplace({
  optionIndex = 9,
  optionTotal = 10,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative grid h-full grid-rows-[auto_1fr] overflow-hidden bg-background">
      <header className="grid border-b border-border p-4 md:grid-cols-[1fr_auto] md:p-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Monochrome marketplace</p>
          <h1 className="font-cinema-title text-6xl uppercase leading-none tracking-normal md:text-8xl">All goods</h1>
        </div>
        <FindThingsCta className="self-end text-3xl md:text-5xl" />
      </header>

      <div className="grid min-h-0 gap-3 p-4 md:grid-cols-[1fr_320px] md:p-6">
        <div className="grid min-h-0 grid-cols-2 gap-2 md:grid-cols-4">
          {homeAssets.slice(0, 8).map((asset) => (
            <HomeAssetTile key={asset.title} asset={asset} compact imageClassName="grayscale" />
          ))}
        </div>

        <aside className="grid border border-border">
          <Link
            href="/catalog"
            className="group flex flex-col justify-between border-b border-border bg-foreground p-5 text-background"
          >
            <ArrowUpRight className="h-5 w-5 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
            <span className="mt-10 font-cinema-title text-6xl uppercase leading-none tracking-normal md:text-8xl">Index</span>
          </Link>
          {["Digital assets", "Physical drops", "Audio services"].map((item) => (
            <Link
              key={item}
              href="/catalog"
              className="flex items-center justify-between border-b border-border p-4 text-xs uppercase tracking-[0.12em] last:border-b-0 hover:bg-foreground hover:text-background"
            >
              <span>{item}</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          ))}
        </aside>
      </div>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
