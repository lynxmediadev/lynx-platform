import Link from "next/link";
import { ArrowRight } from "lucide-react";

import FindThingsCta from "./FindThingsCta";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { type HomeVariantProps } from "./data";

const nodes = [
  { label: "Tracks", href: "/catalog", className: "md:col-start-1 md:row-start-1" },
  { label: "Licenses", href: "/track/seed-001", className: "md:col-start-3 md:row-start-1" },
  { label: "Samples", href: "/catalog", className: "md:col-start-2 md:row-start-2" },
  { label: "Services", href: "/servicios/mix", className: "md:col-start-4 md:row-start-2" },
  { label: "Voices", href: "/catalog", className: "md:col-start-1 md:row-start-3" },
  { label: "Merch", href: "/catalog", className: "md:col-start-3 md:row-start-3" },
];

export default function HomeVariantAssetCircuit({
  optionIndex = 10,
  optionTotal = 10,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden bg-foreground text-background">
      <header className="grid border-b border-background/30 p-4 md:grid-cols-[1fr_auto] md:p-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-background/70">Asset circuit</p>
          <h1 className="font-cinema-title text-6xl uppercase leading-none tracking-normal md:text-8xl">Ecosystem map</h1>
        </div>
        <FindThingsCta dark className="self-end text-3xl md:text-5xl" />
      </header>

      <div className="relative grid min-h-0 p-4 md:grid-cols-4 md:grid-rows-3 md:gap-4 md:p-8">
        <div className="pointer-events-none absolute inset-8 hidden border border-background/20 md:block" />
        <div className="pointer-events-none absolute left-1/2 top-8 hidden h-[calc(100%-4rem)] border-l border-background/20 md:block" />
        <div className="pointer-events-none absolute left-8 top-1/2 hidden w-[calc(100%-4rem)] border-t border-background/20 md:block" />

        {nodes.map((node, index) => (
          <Link
            key={node.label}
            href={node.href}
            className={`group z-10 mb-2 flex min-h-[76px] items-center justify-between border border-background bg-foreground px-4 py-3 uppercase tracking-[0.12em] transition hover:bg-background hover:text-foreground md:mb-0 ${node.className}`}
          >
            <span>
              <span className="block font-mono text-[10px] opacity-70">NODE {String(index + 1).padStart(2, "0")}</span>
              <span className="block font-cinema-title text-4xl leading-none tracking-normal md:text-5xl">{node.label}</span>
            </span>
            <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
          </Link>
        ))}
      </div>

      <footer className="border-t border-background/30 p-3 font-mono text-[10px] uppercase tracking-[0.18em] text-background/70 md:p-4">
        Every entry point should lead to catalog, licensing or professional services.
      </footer>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
