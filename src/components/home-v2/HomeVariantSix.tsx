import { Search } from "lucide-react";

import FindThingsCta from "./FindThingsCta";
import HomeAssetTile from "./HomeAssetTile";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { categories, homeAssets } from "./data";

export default function HomeVariantSix() {
  return (
    <section className="relative grid h-full grid-rows-[auto_auto_1fr_auto] overflow-hidden bg-background">
      <div className="border-b border-border p-4 md:p-6">
        <div className="mx-auto flex max-w-4xl items-center gap-2 border border-foreground bg-background px-3 py-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <span className="flex-1 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Search assets, licenses, drops and audio services
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 border-b border-border p-4 md:grid-cols-[1fr_auto] md:p-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Operational catalog</p>
          <h1 className="font-cinema-title text-6xl uppercase leading-none tracking-normal md:text-8xl">
            Find what works
          </h1>
        </div>
        <FindThingsCta className="self-end text-3xl md:text-5xl" />
      </div>

      <div className="grid min-h-0 gap-3 p-4 md:grid-cols-[0.65fr_1fr] md:p-6">
        <div className="grid grid-cols-2 content-start gap-2 md:grid-cols-3">
          {categories.slice(0, 9).map((item) => (
            <span key={item} className="border border-border px-2 py-2 text-center text-[10px] uppercase tracking-[0.12em]">
              {item}
            </span>
          ))}
        </div>
        <div className="grid min-h-0 grid-cols-3 gap-2">
          {homeAssets.slice(0, 3).map((asset) => (
            <HomeAssetTile key={asset.title} asset={asset} compact />
          ))}
        </div>
      </div>

      <div className="border-t border-border bg-foreground px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-background">
        One screen. Many entry points. Catalog first, services still alive.
      </div>
      <HomeOptionIndicator index={6} total={10} />
    </section>
  );
}
