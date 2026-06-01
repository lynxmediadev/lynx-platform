import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import FindThingsCta from "./FindThingsCta";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { type HomeVariantProps } from "./data";

const headlines = [
  { label: "20 assets to start from", href: "/catalog" },
  { label: "Licenses without hidden terms", href: "/track/seed-001" },
  { label: "Professional audio work", href: "/servicios/mix" },
];

export default function HomeVariantMagazineCover({
  optionIndex = 15,
  optionTotal = 20,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative h-full overflow-hidden bg-background">
      <Image
        src="/images/hero/hero4.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover grayscale opacity-45 contrast-125"
      />
      <div className="absolute inset-0 bg-background/45" />
      <div className="relative z-10 grid h-full grid-rows-[auto_1fr_auto]">
        <header className="grid grid-cols-[1fr_auto] items-start border-b border-foreground p-4 md:p-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Issue 001 / marketplace culture</p>
            <h1 className="font-cinema-title text-[18vw] uppercase leading-[0.72] tracking-normal md:text-[14vw]">ODR Mag</h1>
          </div>
          <span className="border border-foreground px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em]">May 2026</span>
        </header>

        <div className="grid min-h-0 md:grid-cols-[1fr_360px]">
          <div className="flex items-end p-4 md:p-8">
            <p className="max-w-3xl text-2xl font-semibold uppercase leading-tight md:text-5xl">
              A catalog for sounds, products, rights and professional audio decisions.
            </p>
          </div>
          <aside className="hidden border-l border-foreground md:grid">
            {headlines.map((headline) => (
              <Link
                key={headline.label}
                href={headline.href}
                className="flex items-center justify-between border-b border-foreground p-5 text-xs uppercase tracking-[0.14em] hover:bg-foreground hover:text-background"
              >
                <span>{headline.label}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
          </aside>
        </div>

        <footer className="grid border-t border-foreground md:grid-cols-[1fr_auto]">
          <p className="p-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground md:p-6">
            Catalog / Licensing / Merch / Services
          </p>
          <div className="border-t border-foreground p-4 md:border-l md:border-t-0 md:p-6">
            <FindThingsCta className="text-3xl md:text-5xl" />
          </div>
        </footer>
      </div>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
