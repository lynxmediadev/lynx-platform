import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";

import FindThingsCta from "./FindThingsCta";
import HomeAssetTile from "./HomeAssetTile";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { homeAssets } from "./data";

const actions = [
  { label: "Catalog", href: "/catalog" },
  { label: "Mix/Master", href: "/servicios/mix" },
  { label: "Sound Design", href: "/servicios/sound-design" },
  { label: "About", href: "/about-us" },
];

export default function HomeVariantEight() {
  return (
    <section className="relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden bg-background">
      <div className="border-b border-border p-4 md:p-6">
        <div className="mx-auto flex max-w-5xl items-center gap-3 border-2 border-foreground px-4 py-3">
          <Search className="h-5 w-5" />
          <span className="flex-1 font-mono text-sm uppercase tracking-[0.12em] text-muted-foreground">
            Find drums, loops, vocals, merch, licensing and professional audio
          </span>
          <ArrowRight className="h-5 w-5" />
        </div>
      </div>

      <div className="grid min-h-0 gap-3 p-4 md:grid-cols-[1fr_280px] md:p-6">
        <div className="grid min-h-0 grid-cols-2 gap-2 md:grid-cols-3">
          {homeAssets.slice(0, 6).map((asset) => (
            <HomeAssetTile key={asset.title} asset={asset} compact />
          ))}
        </div>
        <div className="grid border border-border">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center justify-between border-b border-border px-3 py-3 text-xs uppercase tracking-[0.12em] last:border-b-0 hover:bg-foreground hover:text-background"
            >
              <span>{action.label}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-border p-4 md:grid-cols-[1fr_auto] md:p-6">
        <h1 className="font-cinema-title text-6xl uppercase leading-none tracking-normal md:text-8xl">Record shop terminal</h1>
        <FindThingsCta className="self-end text-3xl md:text-5xl" />
      </div>
      <HomeOptionIndicator index={8} total={10} />
    </section>
  );
}
