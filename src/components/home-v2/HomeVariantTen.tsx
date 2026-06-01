import { ArrowUpRight, Disc3, FileText, Package, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

import FindThingsCta from "./FindThingsCta";
import HomeOptionIndicator from "./HomeOptionIndicator";
import type { HomeVariantProps } from "./data";

const modules = [
  {
    title: "Catalog",
    copy: "Tracks, loops, samples, beats and voices.",
    href: "/catalog",
    icon: Disc3,
  },
  {
    title: "Licensing",
    copy: "Clear terms, contracts and usage conditions.",
    href: "/track/seed-001",
    icon: FileText,
  },
  {
    title: "Services",
    copy: "Mix, master, sound design and production.",
    href: "/servicios/mix",
    icon: SlidersHorizontal,
  },
  {
    title: "Merch",
    copy: "Physical drops, records and ODR goods.",
    href: "/catalog",
    icon: Package,
  },
];

export default function HomeVariantTen({
  optionIndex = 10,
  optionTotal = 10,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden bg-background">
      <div className="grid grid-cols-1 border-b border-border p-4 md:grid-cols-[1fr_auto] md:p-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Command center</p>
          <h1 className="font-cinema-title text-6xl uppercase leading-none tracking-normal md:text-8xl">ODR Platform</h1>
        </div>
        <FindThingsCta className="self-end text-3xl md:text-5xl" />
      </div>

      <div className="grid min-h-0 grid-cols-1 md:grid-cols-4">
        {modules.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              className="group flex min-h-0 flex-col justify-between border-b border-border p-4 transition hover:bg-foreground hover:text-background md:border-b-0 md:border-r md:p-6"
            >
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5" />
                <ArrowUpRight className="h-5 w-5 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
              </div>
              <div>
                <h2 className="font-cinema-title text-5xl uppercase leading-none tracking-normal md:text-7xl">{item.title}</h2>
                <p className="mt-3 max-w-[220px] text-xs uppercase leading-snug tracking-[0.1em] opacity-80">{item.copy}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="border-t border-border p-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground md:p-4">
        Catalog first. Services preserved. Commerce next.
      </div>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
