import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

import FindThingsCta from "./FindThingsCta";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { categories, homeAssets, type HomeVariantProps } from "./data";

export default function HomeVariantSearchMonolith({
  optionIndex = 8,
  optionTotal = 10,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden bg-foreground text-background">
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-background/30 p-4 font-mono text-[10px] uppercase tracking-[0.18em] text-background/70 md:p-6">
        <span>Search monolith</span>
        <span className="border border-background px-3 py-1">ODR</span>
        <span className="text-right">Catalog engine</span>
      </header>

      <div className="grid min-h-0 place-items-center p-4 md:p-8">
        <div className="w-full max-w-6xl">
          <Link
            href="/catalog"
            className="group grid grid-cols-[auto_1fr_auto] items-center border-2 border-background px-4 py-5 transition hover:bg-background hover:text-foreground md:px-8 md:py-8"
          >
            <Search className="h-6 w-6 md:h-10 md:w-10" />
            <span className="px-4 font-cinema-title text-6xl uppercase leading-none tracking-normal md:px-8 md:text-[10vw]">
              Find things
            </span>
            <ArrowRight className="h-6 w-6 transition group-hover:translate-x-1 md:h-10 md:w-10" />
          </Link>

          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-6">
            {categories.slice(0, 6).map((category) => (
              <Link
                key={category}
                href="/catalog"
                className="border border-background/40 px-3 py-2 text-center text-[10px] uppercase tracking-[0.14em] hover:bg-background hover:text-foreground"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <footer className="grid border-t border-background/30 md:grid-cols-[1fr_auto]">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {homeAssets.slice(0, 4).map((asset) => (
            <Link
              key={asset.title}
              href={asset.href}
              className="border-r border-background/30 p-3 text-[10px] uppercase tracking-[0.12em] hover:bg-background hover:text-foreground"
            >
              <p className="font-semibold">{asset.title}</p>
              <p className="opacity-70">{asset.type}</p>
            </Link>
          ))}
        </div>
        <div className="border-t border-background/30 p-4 md:border-l md:border-t-0 md:p-6">
          <FindThingsCta dark className="text-3xl md:text-5xl" />
        </div>
      </footer>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
