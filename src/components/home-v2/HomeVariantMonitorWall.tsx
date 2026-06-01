import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import HomeOptionIndicator from "./HomeOptionIndicator";
import { homeAssets, type HomeVariantProps } from "./data";

const monitorLabels = ["Catalog", "Licenses", "Samples", "Services", "Merch", "Archive"];

export default function HomeVariantMonitorWall({
  optionIndex = 20,
  optionTotal = 20,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden bg-foreground text-background">
      <header className="grid border-b border-background/30 p-4 md:grid-cols-[1fr_auto] md:p-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-background/70">Monitor wall</p>
          <h1 className="font-cinema-title text-6xl uppercase leading-none tracking-normal md:text-8xl">Watch the stock</h1>
        </div>
        <Link
          href="/catalog"
          className="self-end border border-background px-4 py-2 text-xs uppercase tracking-[0.14em] hover:bg-background hover:text-foreground"
        >
          Enter control room
        </Link>
      </header>

      <div className="grid min-h-0 grid-cols-2 gap-2 p-4 md:grid-cols-3 md:p-6">
        {monitorLabels.map((label, index) => {
          const asset = homeAssets[index % homeAssets.length];
          if (!asset) return null;

          const href = label === "Licenses" ? "/track/seed-001" : label === "Services" ? "/servicios/mix" : "/catalog";

          return (
            <Link
              key={label}
              href={href}
              className="group relative overflow-hidden border border-background/40 bg-foreground"
            >
              <Image
                src={asset.image}
                alt=""
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover grayscale opacity-45 contrast-150 transition group-hover:scale-105 group-hover:opacity-70"
              />
              <div className="absolute inset-0 bg-foreground/30" />
              <div className="relative z-10 flex h-full min-h-[130px] flex-col justify-between p-3 md:min-h-[180px] md:p-4">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-background/70">
                  <span>CAM {String(index + 1).padStart(2, "0")}</span>
                  <ArrowUpRight className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-cinema-title text-4xl uppercase leading-none tracking-normal md:text-6xl">{label}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-background/70">{asset.title}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <footer className="border-t border-background/30 p-3 font-mono text-[10px] uppercase tracking-[0.18em] text-background/70 md:p-4">
        A control wall for everything ODR can sell, license, book or release.
      </footer>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
