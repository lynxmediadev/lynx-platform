import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import HomeOptionIndicator from "./HomeOptionIndicator";
import { type HomeVariantProps } from "./data";

const portals = [
  { label: "Catalog", href: "/catalog" },
  { label: "Licenses", href: "/track/seed-001" },
  { label: "Samples", href: "/catalog" },
  { label: "Voices", href: "/servicios/sound-design" },
  { label: "Services", href: "/servicios/mix" },
  { label: "Drops", href: "/catalog" },
];

export default function HomeVariantPortalGrid({
  optionIndex = 17,
  optionTotal = 20,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden bg-foreground text-background">
      <header className="grid border-b border-background/30 p-4 md:grid-cols-[1fr_auto] md:p-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-background/70">Portal grid</p>
          <h1 className="font-cinema-title text-6xl uppercase leading-none tracking-normal md:text-8xl">Enter anywhere</h1>
        </div>
        <Link
          href="/catalog"
          className="self-end border border-background px-4 py-2 text-xs uppercase tracking-[0.14em] hover:bg-background hover:text-foreground"
        >
          Main portal
        </Link>
      </header>

      <div className="grid min-h-0 grid-cols-2 md:grid-cols-3">
        {portals.map((portal, index) => (
          <Link
            key={portal.label}
            href={portal.href}
            className="group relative grid min-h-0 place-items-center overflow-hidden border-b border-r border-background/30 p-4 transition hover:bg-background hover:text-foreground"
          >
            <div className="absolute inset-6 border border-background/20 transition group-hover:scale-90 group-hover:border-foreground/30" />
            <div className="absolute inset-12 border border-background/10 transition group-hover:scale-110 group-hover:border-foreground/20" />
            <span className="relative z-10 text-center">
              <span className="block font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">Portal {String(index + 1).padStart(2, "0")}</span>
              <span className="block font-cinema-title text-5xl uppercase leading-none tracking-normal md:text-7xl">{portal.label}</span>
              <ArrowUpRight className="mx-auto mt-3 h-5 w-5" />
            </span>
          </Link>
        ))}
      </div>

      <footer className="border-t border-background/30 p-3 font-mono text-[10px] uppercase tracking-[0.18em] text-background/70 md:p-4">
        Six clear entrances, one platform.
      </footer>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
