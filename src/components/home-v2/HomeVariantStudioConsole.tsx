import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import FindThingsCta from "./FindThingsCta";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { type HomeVariantProps } from "./data";

const channels = [
  { label: "Tracks", level: "h-[72%]", href: "/catalog" },
  { label: "Samples", level: "h-[48%]", href: "/catalog" },
  { label: "Vocals", level: "h-[58%]", href: "/catalog" },
  { label: "Rights", level: "h-[86%]", href: "/track/seed-001" },
  { label: "Mix", level: "h-[64%]", href: "/servicios/mix" },
  { label: "Drops", level: "h-[38%]", href: "/catalog" },
];

export default function HomeVariantStudioConsole({
  optionIndex = 14,
  optionTotal = 20,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden bg-background">
      <header className="grid border-b border-border p-4 md:grid-cols-[1fr_auto] md:p-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Studio console</p>
          <h1 className="font-cinema-title text-6xl uppercase leading-none tracking-normal md:text-8xl">Mix the entry</h1>
        </div>
        <FindThingsCta className="self-end text-3xl md:text-5xl" />
      </header>

      <div className="grid min-h-0 grid-cols-3 gap-2 p-4 md:grid-cols-6 md:gap-3 md:p-6">
        {channels.map((channel, index) => (
          <Link
            key={channel.label}
            href={channel.href}
            className="group grid min-h-0 grid-rows-[auto_1fr_auto] border border-border bg-card p-3 hover:bg-foreground hover:text-background md:p-4"
          >
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground group-hover:text-background/70">
              <span>CH {String(index + 1).padStart(2, "0")}</span>
              <ArrowUpRight className="h-4 w-4" />
            </div>
            <div className="relative my-4 min-h-0 border-x border-border">
              <div className={`absolute bottom-0 left-1/2 w-2 -translate-x-1/2 bg-foreground group-hover:bg-background ${channel.level}`} />
              <div className="absolute left-1/2 top-1/3 h-8 w-10 -translate-x-1/2 border border-foreground bg-background group-hover:border-background group-hover:bg-foreground" />
            </div>
            <p className="font-cinema-title text-4xl uppercase leading-none tracking-normal md:text-5xl">{channel.label}</p>
          </Link>
        ))}
      </div>

      <footer className="border-t border-border p-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground md:p-4">
        Controls for commerce, licensing and service discovery.
      </footer>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
