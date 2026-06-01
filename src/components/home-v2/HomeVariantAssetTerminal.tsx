import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

import FindThingsCta from "./FindThingsCta";
import HomeAssetTile from "./HomeAssetTile";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { categories, homeAssets, type HomeVariantProps } from "./data";

const terminalActions = [
  { label: "Browse catalog", href: "/catalog" },
  { label: "License a beat", href: "/track/seed-001" },
  { label: "Book mix/master", href: "/servicios/mix" },
];

export default function HomeVariantAssetTerminal({
  optionIndex = 4,
  optionTotal = 10,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden bg-background">
      <header className="grid gap-3 border-b border-border p-4 md:grid-cols-[1fr_auto] md:p-6">
        <div className="flex items-center gap-3 border-2 border-foreground px-3 py-2">
          <Search className="h-4 w-4" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Search drums, loops, beats, vocals, services, merch
          </span>
        </div>
        <FindThingsCta className="self-center text-3xl md:text-5xl" />
      </header>

      <div className="grid min-h-0 gap-3 p-4 md:grid-cols-[220px_1fr_260px] md:p-6">
        <aside className="hidden border border-border md:grid">
          {categories.slice(0, 8).map((category, index) => (
            <Link
              key={category}
              href="/catalog"
              className="flex items-center justify-between border-b border-border px-3 py-2 text-xs uppercase tracking-[0.1em] last:border-b-0 hover:bg-foreground hover:text-background"
            >
              <span>{category}</span>
              <span className="font-mono text-[10px] opacity-70">{String(index + 1).padStart(2, "0")}</span>
            </Link>
          ))}
        </aside>

        <div className="grid min-h-0 grid-cols-2 gap-2 md:grid-cols-3">
          {homeAssets.slice(0, 6).map((asset) => (
            <HomeAssetTile key={asset.title} asset={asset} compact />
          ))}
        </div>

        <aside className="grid border border-border">
          {terminalActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col justify-between border-b border-border p-4 uppercase last:border-b-0 hover:bg-foreground hover:text-background"
            >
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              <span className="mt-6 text-xl font-semibold leading-none">{action.label}</span>
            </Link>
          ))}
        </aside>
      </div>

      <footer className="border-t border-border px-4 py-3 font-cinema-title text-5xl uppercase leading-none tracking-normal md:px-6 md:text-7xl">
        Asset terminal
      </footer>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
