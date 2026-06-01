import Link from "next/link";
import { ArrowRight } from "lucide-react";

import FindThingsCta from "./FindThingsCta";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { type HomeVariantProps } from "./data";

const indexItems = [
  { label: "Tracks", detail: "Beats and instrumentals", href: "/catalog" },
  { label: "Samples", detail: "Loops, drums and kits", href: "/catalog" },
  { label: "Vocals", detail: "Voices and ad locutions", href: "/catalog" },
  { label: "Licenses", detail: "Contracts and clear terms", href: "/track/seed-001" },
  { label: "Services", detail: "Mix, master and sound design", href: "/servicios/mix" },
  { label: "Merch", detail: "Drops, records and objects", href: "/catalog" },
];

export default function HomeVariantOdrIndex({
  optionIndex = 10,
  optionTotal = 10,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden bg-foreground text-background">
      <header className="grid border-b border-background/30 p-4 md:grid-cols-[1fr_auto] md:p-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-background/70">ODR index</p>
          <h1 className="font-cinema-title text-6xl uppercase leading-none tracking-normal md:text-8xl">Find things</h1>
        </div>
        <FindThingsCta dark className="self-end text-3xl md:text-5xl" />
      </header>

      <div className="grid min-h-0 md:grid-cols-[0.8fr_1.2fr]">
        <div className="hidden items-center justify-center border-r border-background/30 md:flex">
          <p className="font-cinema-title text-[16vw] uppercase leading-[0.72] tracking-normal [writing-mode:vertical-rl]">
            ODR
          </p>
        </div>

        <div className="grid min-h-0">
          {indexItems.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              className="group grid grid-cols-[52px_1fr_auto] items-center border-b border-background/30 px-4 py-3 transition hover:bg-background hover:text-foreground md:grid-cols-[72px_1fr_auto] md:px-6"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>
                <span className="block font-cinema-title text-4xl uppercase leading-none tracking-normal md:text-6xl">{item.label}</span>
                <span className="block text-[10px] uppercase tracking-[0.12em] opacity-70">{item.detail}</span>
              </span>
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </div>

      <footer className="border-t border-background/30 p-3 font-mono text-[10px] uppercase tracking-[0.18em] text-background/70 md:p-4">
        One index for catalog, licensing, services and products.
      </footer>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
