import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import FindThingsCta from "./FindThingsCta";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { homeAssets, type HomeVariantProps } from "./data";

const slabLinks = [
  { label: "Catalog", href: "/catalog" },
  { label: "Licenses", href: "/track/seed-001" },
  { label: "Services", href: "/servicios/mix" },
];

export default function HomeVariantBlackCatalogSlab({
  optionIndex = 3,
  optionTotal = 10,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative grid h-full grid-rows-[1fr_auto] overflow-hidden bg-foreground text-background">
      <div className="relative grid min-h-0 md:grid-cols-[1fr_340px]">
        <div className="relative min-h-0 border-b border-background/30 md:border-b-0 md:border-r">
          <Image
            src="/images/hero/hero3.jpg"
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 70vw"
            className="object-cover grayscale opacity-45 contrast-150"
          />
          <div className="absolute inset-0 bg-foreground/35" />
          <div className="relative z-10 flex h-full flex-col justify-between p-4 md:p-8">
            <div className="grid grid-cols-[1fr_auto] gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-background/70">
              <span>Black catalog slab</span>
              <span>Assets / Services</span>
            </div>
            <h1 className="font-cinema-title text-[24vw] uppercase leading-[0.72] tracking-normal md:text-[16vw]">
              Stock
            </h1>
          </div>
        </div>

        <aside className="grid min-h-0 grid-rows-[auto_1fr_auto] border-background/30">
          <div className="border-b border-background/30 p-4 md:p-6">
            <p className="text-xl font-semibold uppercase leading-tight md:text-3xl">
              Find the sound, license it clearly, buy the asset.
            </p>
          </div>
          <div className="grid min-h-0">
            {slabLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center justify-between border-b border-background/30 p-4 text-xs uppercase tracking-[0.14em] transition hover:bg-background hover:text-foreground md:p-6"
              >
                <span>{item.label}</span>
                <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Link>
            ))}
          </div>
          <div className="p-4 md:p-6">
            <FindThingsCta dark className="text-4xl md:text-6xl" />
          </div>
        </aside>
      </div>

      <div className="grid grid-cols-2 border-t border-background/30 md:grid-cols-4">
        {homeAssets.slice(0, 4).map((asset) => (
          <Link
            key={asset.title}
            href={asset.href}
            className="flex items-center justify-between border-r border-background/30 p-3 text-[10px] uppercase tracking-[0.12em] last:border-r-0 hover:bg-background hover:text-foreground"
          >
            <span className="truncate">{asset.title}</span>
            <span className="font-mono opacity-70">{asset.type}</span>
          </Link>
        ))}
      </div>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
