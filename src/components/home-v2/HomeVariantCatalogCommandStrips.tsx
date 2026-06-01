import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import FindThingsCta from "./FindThingsCta";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { homeAssets, type HomeVariantProps } from "./data";

const strips = [
  { label: "Tracks", copy: "License-ready instrumentals", href: "/catalog", assetIndex: 0 },
  { label: "Samples", copy: "Loops, drums and sound kits", href: "/catalog", assetIndex: 1 },
  { label: "Services", copy: "Mix, master, design and production", href: "/servicios/mix", assetIndex: 6 },
  { label: "Merch", copy: "Physical drops and archive goods", href: "/catalog", assetIndex: 7 },
];

export default function HomeVariantCatalogCommandStrips({
  optionIndex = 7,
  optionTotal = 10,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden bg-background">
      <header className="grid border-b border-border p-4 md:grid-cols-[1fr_auto] md:p-6">
        <h1 className="font-cinema-title text-6xl uppercase leading-none tracking-normal md:text-8xl">
          Command strips
        </h1>
        <FindThingsCta className="self-end text-3xl md:text-5xl" />
      </header>

      <div className="grid min-h-0">
        {strips.map((strip, index) => {
          const asset = homeAssets[strip.assetIndex] ?? homeAssets[0];
          if (!asset) return null;

          return (
            <Link
              key={strip.label}
              href={strip.href}
              className="group grid min-h-0 grid-cols-[72px_1fr_auto] items-center border-b border-border transition hover:bg-foreground hover:text-background md:grid-cols-[140px_1fr_220px_auto]"
            >
              <div className="relative h-full min-h-[74px] overflow-hidden border-r border-border md:min-h-0">
                <Image
                  src={asset.image}
                  alt=""
                  fill
                  sizes="140px"
                  className="object-cover grayscale opacity-70 contrast-125 transition group-hover:grayscale-0 group-hover:opacity-90"
                />
              </div>
              <div className="px-3 md:px-6">
                <p className="font-cinema-title text-4xl uppercase leading-none tracking-normal md:text-7xl">{strip.label}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground group-hover:text-background/70">
                  {strip.copy}
                </p>
              </div>
              <span className="hidden px-4 font-mono text-[10px] uppercase tracking-[0.18em] md:block">{asset.title}</span>
              <ArrowUpRight className="mr-4 h-5 w-5 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          );
        })}
      </div>

      <footer className="border-t border-border p-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground md:p-4">
        Catalog / licensing / services / goods
      </footer>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
