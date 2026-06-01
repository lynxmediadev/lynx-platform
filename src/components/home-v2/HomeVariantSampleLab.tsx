import Link from "next/link";
import { ArrowRight } from "lucide-react";

import FindThingsCta from "./FindThingsCta";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { homeAssets, type HomeVariantProps } from "./data";

export default function HomeVariantSampleLab({
  optionIndex = 18,
  optionTotal = 20,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden bg-background">
      <header className="grid border-b border-border p-4 md:grid-cols-[1fr_auto] md:p-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Sample lab</p>
          <h1 className="font-cinema-title text-6xl uppercase leading-none tracking-normal md:text-8xl">Specimens</h1>
        </div>
        <FindThingsCta className="self-end text-3xl md:text-5xl" />
      </header>

      <div className="grid min-h-0 grid-cols-2 gap-3 p-4 md:grid-cols-4 md:p-6">
        {homeAssets.slice(0, 8).map((asset, index) => (
          <Link
            key={asset.title}
            href={asset.href}
            className="group grid min-h-0 grid-rows-[auto_1fr_auto] border border-border bg-card transition hover:bg-foreground hover:text-background"
          >
            <div className="border-b border-border p-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground group-hover:text-background/70">
              SPEC-{String(index + 1).padStart(3, "0")}
            </div>
            <div className="grid place-items-center p-4">
              <div className="grid h-20 w-20 place-items-center rounded-full border border-foreground group-hover:border-background md:h-28 md:w-28">
                <span className="font-cinema-title text-4xl uppercase leading-none md:text-5xl">{asset.type.slice(0, 2)}</span>
              </div>
            </div>
            <div className="border-t border-border p-3">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.1em]">{asset.title}</p>
              <p className="mt-1 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-muted-foreground group-hover:text-background/70">
                {asset.price}
                <ArrowRight className="h-4 w-4" />
              </p>
            </div>
          </Link>
        ))}
      </div>

      <footer className="border-t border-border p-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground md:p-4">
        Catalog as a laboratory of usable material.
      </footer>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
