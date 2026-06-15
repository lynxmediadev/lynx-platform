import Link from "next/link";
import { ArrowRight } from "lucide-react";

import HomeOptionIndicator from "./HomeOptionIndicator";
import { type HomeVariantProps } from "./data";

const boardRows = [
  { code: "CAT", label: "Catalog", status: "Open", href: "/catalog" },
  { code: "LIC", label: "Track licenses", status: "Clear", href: "/track/seed-001" },
  { code: "MIX", label: "Mix / Master", status: "Book", href: "/servicios/mix" },
  { code: "SND", label: "Sound design", status: "Book", href: "/servicios/sound-design" },
  { code: "MRH", label: "Merch drops", status: "Soon", href: "/catalog" },
  { code: "ABT", label: "About ODR", status: "Read", href: "/about-us" },
];

export default function HomeVariantSignalBoard({
  optionIndex = 9,
  optionTotal = 10,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden bg-background text-foreground">
      <header className="grid border-b border-border p-4 md:grid-cols-[1fr_auto] md:p-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/70">Signal board</p>
          <h1 className="font-cinema-title text-6xl uppercase leading-none tracking-normal md:text-8xl">Departures</h1>
        </div>
        <Link
          href="/catalog"
          className="self-end border border-foreground px-4 py-2 text-xs uppercase tracking-[0.14em] hover:bg-foreground hover:text-background"
        >
          Enter catalog
        </Link>
      </header>

      <div className="grid min-h-0">
        {boardRows.map((row, index) => (
          <Link
            key={row.code}
            href={row.href}
            className="group grid grid-cols-[52px_1fr_72px_auto] items-center border-b border-border px-4 py-3 font-mono uppercase tracking-[0.12em] transition hover:bg-foreground hover:text-background md:grid-cols-[90px_1fr_140px_auto] md:px-6"
          >
            <span className="text-[10px] text-foreground/70 group-hover:text-background/70">{row.code}</span>
            <span className="font-cinema-title text-4xl leading-none tracking-normal md:text-6xl">{row.label}</span>
            <span className="text-right text-[10px]">{row.status}</span>
            <ArrowRight className="ml-4 h-5 w-5 transition group-hover:translate-x-1" />
          </Link>
        ))}
      </div>

      <footer className="border-t border-border p-3 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/70 md:p-4">
        A navigation board for assets, licensing, services and brand context.
      </footer>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
