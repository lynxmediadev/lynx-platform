import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import FindThingsCta from "./FindThingsCta";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { homeAssets, type HomeVariantProps } from "./data";

export default function HomeVariantCassetteArchive({
  optionIndex = 12,
  optionTotal = 20,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden bg-background">
      <header className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-border p-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground md:p-6">
        <span>Side A</span>
        <span className="text-center">Cassette archive</span>
        <span>Side B</span>
      </header>

      <div className="grid min-h-0 place-items-center p-4 md:p-8">
        <div className="grid w-full max-w-6xl border-2 border-foreground bg-card md:grid-cols-[0.26fr_1fr]">
          <aside className="hidden border-r-2 border-foreground p-5 md:block">
            <p className="font-cinema-title text-7xl uppercase leading-[0.75] tracking-normal [writing-mode:vertical-rl]">
              ODR Tape
            </p>
          </aside>
          <div className="grid min-h-[420px] grid-rows-[auto_1fr_auto]">
            <div className="grid border-b-2 border-foreground md:grid-cols-[1fr_1fr]">
              <div className="p-4 md:p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Catalog tape no. 20</p>
                <h1 className="mt-2 font-cinema-title text-6xl uppercase leading-none tracking-normal md:text-8xl">Play assets</h1>
              </div>
              <div className="grid grid-cols-2 border-t-2 border-foreground md:border-l-2 md:border-t-0">
                {homeAssets.slice(0, 2).map((asset) => (
                  <Link key={asset.title} href={asset.href} className="relative min-h-[130px] overflow-hidden border-r border-border last:border-r-0">
                    <Image src={asset.image} alt="" fill sizes="240px" className="object-cover grayscale contrast-125 hover:grayscale-0" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid place-items-center p-5">
              <div className="grid w-full max-w-3xl grid-cols-[1fr_auto_1fr] items-center gap-5">
                <div className="h-24 rounded-full border-2 border-foreground bg-background md:h-32" />
                <div className="h-10 w-28 rounded-full border-2 border-foreground bg-background md:w-40" />
                <div className="h-24 rounded-full border-2 border-foreground bg-background md:h-32" />
              </div>
            </div>

            <div className="grid border-t-2 border-foreground md:grid-cols-[1fr_auto]">
              <p className="p-4 text-sm font-semibold uppercase leading-tight md:p-6 md:text-2xl">
                Beats, samples, voices and services as a physical archive you can open.
              </p>
              <div className="border-t-2 border-foreground p-4 md:border-l-2 md:border-t-0 md:p-6">
                <FindThingsCta className="text-3xl md:text-5xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="grid grid-cols-3 border-t border-border text-[10px] uppercase tracking-[0.14em]">
        <Link href="/catalog" className="flex items-center justify-between border-r border-border p-3 hover:bg-foreground hover:text-background">
          Catalog <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/track/seed-001" className="flex items-center justify-between border-r border-border p-3 hover:bg-foreground hover:text-background">
          Licenses <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/servicios/mix" className="flex items-center justify-between p-3 hover:bg-foreground hover:text-background">
          Services <ArrowRight className="h-4 w-4" />
        </Link>
      </footer>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
