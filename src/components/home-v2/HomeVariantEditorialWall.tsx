import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import FindThingsCta from "./FindThingsCta";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { homeAssets, type HomeVariantProps } from "./data";

export default function HomeVariantEditorialWall({
  optionIndex = 6,
  optionTotal = 10,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative h-full overflow-hidden bg-foreground text-background">
      <Image
        src="/images/hero/hero5.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover grayscale opacity-45 contrast-150"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/45 to-foreground/10" />

      <div className="relative z-10 grid h-full grid-rows-[auto_1fr_auto]">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-background/30 p-4 font-mono text-[10px] uppercase tracking-[0.18em] md:p-6">
          <span>Editorial wall</span>
          <span className="border border-background px-3 py-1">ODR</span>
          <span className="text-right">Sound goods</span>
        </header>

        <div className="flex min-h-0 items-center overflow-hidden px-4 md:px-8">
          <h1 className="font-cinema-title text-[22vw] uppercase leading-[0.72] tracking-normal">
            Goods
          </h1>
        </div>

        <footer className="grid border-t border-background/30 md:grid-cols-[1fr_0.7fr_0.8fr]">
          <div className="p-4 md:p-6">
            <p className="max-w-xl text-xl font-semibold uppercase leading-tight md:text-3xl">
              A storefront for music assets, licensing clarity and professional audio work.
            </p>
          </div>
          <div className="hidden border-l border-background/30 md:grid">
            {homeAssets.slice(0, 3).map((asset) => (
              <Link
                key={asset.title}
                href={asset.href}
                className="flex items-center justify-between border-b border-background/30 px-4 py-3 text-xs uppercase tracking-[0.12em] last:border-b-0 hover:bg-background hover:text-foreground"
              >
                <span>{asset.title}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
          <div className="border-l border-background/30 p-4 md:p-6">
            <FindThingsCta dark className="text-4xl md:text-6xl" />
          </div>
        </footer>
      </div>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
