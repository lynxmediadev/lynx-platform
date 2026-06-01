import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import FindThingsCta from "./FindThingsCta";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { type HomeVariantProps } from "./data";

const coordinatePins = [
  { label: "Tracks", coord: "N 33.44 / W 70.66", href: "/catalog", className: "left-[16%] top-[28%]" },
  { label: "Licenses", coord: "N 40.71 / W 74.00", href: "/track/seed-001", className: "left-[58%] top-[18%]" },
  { label: "Services", coord: "S 23.55 / W 46.63", href: "/servicios/mix", className: "left-[42%] top-[62%]" },
  { label: "Merch", coord: "N 35.68 / E 139.69", href: "/catalog", className: "left-[74%] top-[52%]" },
];

export default function HomeVariantMapCoordinates({
  optionIndex = 17,
  optionTotal = 20,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative h-full overflow-hidden bg-background">
      <div className="absolute inset-0 [background-image:linear-gradient(30deg,hsl(var(--border))_1px,transparent_1px),linear-gradient(150deg,hsl(var(--border))_1px,transparent_1px)] [background-size:88px_88px]" />
      <div className="relative z-10 grid h-full grid-rows-[auto_1fr_auto]">
        <header className="grid border-b border-border p-4 md:grid-cols-[1fr_auto] md:p-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Map coordinates</p>
            <h1 className="font-cinema-title text-6xl uppercase leading-none tracking-normal md:text-8xl">Asset territory</h1>
          </div>
          <FindThingsCta className="self-end text-3xl md:text-5xl" />
        </header>

        <div className="relative min-h-0">
          <div className="absolute left-[8%] top-[52%] h-[1px] w-[82%] -rotate-6 bg-foreground/60" />
          <div className="absolute left-[18%] top-[22%] h-[1px] w-[62%] rotate-[18deg] bg-foreground/40" />
          <div className="absolute left-[48%] top-[16%] h-[72%] w-[1px] bg-foreground/40" />
          {coordinatePins.map((pin) => (
            <Link
              key={pin.label}
              href={pin.href}
              className={`absolute ${pin.className} group min-w-[160px] border border-foreground bg-background px-3 py-3 uppercase tracking-[0.12em] hover:bg-foreground hover:text-background`}
            >
              <span className="block font-mono text-[10px] text-muted-foreground group-hover:text-background/70">{pin.coord}</span>
              <span className="mt-1 flex items-center justify-between text-sm font-semibold">
                {pin.label}
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>

        <footer className="border-t border-border p-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground md:p-4">
          A geography for digital products, rights, services and physical drops.
        </footer>
      </div>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
