import Link from "next/link";
import { ArrowRight } from "lucide-react";

import FindThingsCta from "./FindThingsCta";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { type HomeVariantProps } from "./data";

const tickerRows = [
  { symbol: "BEAT", label: "Instrumental licenses", status: "Live", href: "/catalog" },
  { symbol: "LOOP", label: "Sample packs", status: "Open", href: "/catalog" },
  { symbol: "MIX", label: "Mix/master service", status: "Book", href: "/servicios/mix" },
  { symbol: "SYNC", label: "Usage terms", status: "Clear", href: "/track/seed-001" },
  { symbol: "VOX", label: "Voice and sound brand", status: "Custom", href: "/servicios/sound-design" },
];

export default function HomeVariantProductTicker({
  optionIndex = 18,
  optionTotal = 20,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden bg-background">
      <header className="grid border-b border-border p-4 md:grid-cols-[1fr_auto] md:p-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Product ticker</p>
          <h1 className="font-cinema-title text-6xl uppercase leading-none tracking-normal md:text-8xl">Market is open</h1>
        </div>
        <FindThingsCta className="self-end text-3xl md:text-5xl" />
      </header>

      <div className="grid min-h-0">
        {tickerRows.map((row, index) => (
          <Link
            key={row.symbol}
            href={row.href}
            className="group grid grid-cols-[68px_1fr_72px_auto] items-center border-b border-border px-4 py-4 transition hover:bg-foreground hover:text-background md:grid-cols-[120px_1fr_160px_auto] md:px-6"
          >
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em]">{row.symbol}</span>
            <span className="font-cinema-title text-4xl uppercase leading-none tracking-normal md:text-6xl">{row.label}</span>
            <span className="text-right font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground group-hover:text-background/70">{row.status}</span>
            <ArrowRight className="ml-4 h-5 w-5 transition group-hover:translate-x-1" />
          </Link>
        ))}
      </div>

      <footer className="grid grid-cols-3 border-t border-border font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        <span className="border-r border-border p-3">Items {tickerRows.length}</span>
        <span className="border-r border-border p-3">Index 2026</span>
        <span className="p-3">ODR commerce layer</span>
      </footer>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
