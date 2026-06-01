import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import HomeOptionIndicator from "./HomeOptionIndicator";
import { type HomeVariantProps } from "./data";

const stations = [
  { freq: "88.1", label: "Drums", href: "/catalog" },
  { freq: "91.7", label: "Loops", href: "/catalog" },
  { freq: "96.4", label: "Beats", href: "/catalog" },
  { freq: "101.3", label: "Licenses", href: "/track/seed-001" },
  { freq: "107.9", label: "Services", href: "/servicios/mix" },
];

export default function HomeVariantRadioDial({
  optionIndex = 13,
  optionTotal = 20,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden bg-foreground text-background">
      <header className="grid border-b border-background/30 p-4 md:grid-cols-[1fr_auto] md:p-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-background/70">Radio dial</p>
          <h1 className="font-cinema-title text-6xl uppercase leading-none tracking-normal md:text-8xl">Tune in</h1>
        </div>
        <Link
          href="/catalog"
          className="self-end border border-background px-4 py-2 text-xs uppercase tracking-[0.14em] hover:bg-background hover:text-foreground"
        >
          Browse signal
        </Link>
      </header>

      <div className="grid min-h-0 place-items-center p-4 md:p-8">
        <div className="relative grid h-[58vw] max-h-[520px] min-h-[300px] w-[58vw] min-w-[300px] max-w-[520px] place-items-center rounded-full border-2 border-background">
          <div className="absolute inset-8 rounded-full border border-background/40" />
          <div className="absolute inset-20 rounded-full border border-background/25" />
          <div className="h-28 w-28 rounded-full border-2 border-background bg-foreground md:h-40 md:w-40" />
          <div className="absolute left-1/2 top-1/2 h-[2px] w-[42%] origin-left -rotate-12 bg-background" />
          {stations.map((station, index) => (
            <Link
              key={station.freq}
              href={station.href}
              className="absolute border border-background bg-foreground px-3 py-2 text-center uppercase tracking-[0.12em] hover:bg-background hover:text-foreground"
              style={{
                left: `${50 + Math.cos((index / stations.length) * Math.PI * 2 - Math.PI / 2) * 42}%`,
                top: `${50 + Math.sin((index / stations.length) * Math.PI * 2 - Math.PI / 2) * 42}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <span className="block font-mono text-[10px] opacity-70">{station.freq}</span>
              <span className="block text-xs font-semibold">{station.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <footer className="grid grid-cols-1 border-t border-background/30 md:grid-cols-[1fr_auto]">
        <p className="p-4 text-sm font-semibold uppercase tracking-[0.08em] md:p-6 md:text-2xl">
          A frequency map for assets, tracks, licenses and professional work.
        </p>
        <Link
          href="/catalog"
          className="flex items-center gap-3 border-t border-background/30 p-4 text-xs uppercase tracking-[0.14em] hover:bg-background hover:text-foreground md:border-l md:border-t-0 md:p-6"
        >
          Find the channel <ArrowUpRight className="h-4 w-4" />
        </Link>
      </footer>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
