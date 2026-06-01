import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import FindThingsCta from "./FindThingsCta";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { homeAssets, type HomeVariantProps } from "./data";

const museumLabels = ["Track object", "Sample object", "Merch object", "Service object"];

export default function HomeVariantSoundMuseum({
  optionIndex = 6,
  optionTotal = 10,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden bg-background">
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border p-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground md:p-6">
        <span>Sound museum</span>
        <span className="border border-border px-3 py-1 text-foreground">ODR Collection</span>
        <span className="text-right">Assets as objects</span>
      </header>

      <div className="grid min-h-0 grid-cols-2 gap-3 p-4 md:grid-cols-4 md:p-6">
        {homeAssets.slice(0, 4).map((asset, index) => (
          <Link
            key={asset.title}
            href={asset.href}
            className="group grid min-h-0 grid-rows-[1fr_auto] border border-border bg-card transition hover:border-foreground"
          >
            <div className="relative min-h-0 overflow-hidden">
              <Image
                src={asset.image}
                alt=""
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover grayscale contrast-125 transition duration-300 group-hover:scale-105 group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-background/20" />
            </div>
            <div className="border-t border-border p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{museumLabels[index]}</p>
              <p className="mt-2 font-cinema-title text-4xl uppercase leading-none tracking-normal md:text-5xl">{asset.title}</p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{asset.type} / {asset.price}</p>
            </div>
          </Link>
        ))}
      </div>

      <footer className="grid border-t border-border md:grid-cols-[1fr_280px]">
        <div className="p-4 md:p-6">
          <h1 className="font-cinema-title text-5xl uppercase leading-none tracking-normal md:text-8xl">Curated goods</h1>
        </div>
        <div className="grid border-t border-border md:border-l md:border-t-0">
          <FindThingsCta className="m-4 self-center text-3xl md:m-6 md:text-5xl" />
          <Link
            href="/about-us"
            className="flex items-center justify-between border-t border-border px-4 py-3 text-xs uppercase tracking-[0.12em] hover:bg-foreground hover:text-background md:px-6"
          >
            <span>Read the context</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </footer>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
