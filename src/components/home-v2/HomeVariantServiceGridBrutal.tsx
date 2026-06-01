import Link from "next/link";
import { ArrowUpRight, Disc3, FileText, Package, SlidersHorizontal } from "lucide-react";

import FindThingsCta from "./FindThingsCta";
import HomeOptionIndicator from "./HomeOptionIndicator";
import type { HomeVariantProps } from "./data";

const gridItems = [
  { title: "Assets", copy: "Drums, loops, samples, beats, vocals.", href: "/catalog", icon: Disc3 },
  { title: "Licenses", copy: "Usage clarity before purchase.", href: "/track/seed-001", icon: FileText },
  { title: "Services", copy: "Mix, master and sound design.", href: "/servicios/mix", icon: SlidersHorizontal },
  { title: "Goods", copy: "Drops, records and physical ODR objects.", href: "/catalog", icon: Package },
];

export default function HomeVariantServiceGridBrutal({
  optionIndex = 5,
  optionTotal = 10,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative grid h-full grid-rows-[auto_1fr] overflow-hidden bg-background">
      <header className="grid border-b border-border p-4 md:grid-cols-[1fr_auto] md:p-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Service grid brutal</p>
          <h1 className="font-cinema-title text-6xl uppercase leading-none tracking-normal md:text-8xl">Buy / Book / License</h1>
        </div>
        <FindThingsCta className="self-end text-3xl md:text-5xl" />
      </header>

      <div className="grid min-h-0 grid-cols-1 md:grid-cols-4">
        {gridItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              className={
                index === 0
                  ? "group flex min-h-0 flex-col justify-between border-b border-border bg-foreground p-5 text-background md:border-b-0 md:border-r md:p-7"
                  : "group flex min-h-0 flex-col justify-between border-b border-border p-5 transition hover:bg-foreground hover:text-background md:border-b-0 md:border-r md:p-7"
              }
            >
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5" />
                <ArrowUpRight className="h-5 w-5 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">0{index + 1}</p>
                <h2 className="mt-2 font-cinema-title text-6xl uppercase leading-none tracking-normal md:text-8xl">{item.title}</h2>
                <p className="mt-4 max-w-[230px] text-xs uppercase leading-snug tracking-[0.1em] opacity-80">{item.copy}</p>
              </div>
            </Link>
          );
        })}
      </div>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
