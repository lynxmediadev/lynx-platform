import Link from "next/link";
import { ArrowRight } from "lucide-react";

import FindThingsCta from "./FindThingsCta";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { type HomeVariantProps } from "./data";

const stamps = [
  { label: "Streaming", href: "/track/seed-001" },
  { label: "Distribution", href: "/track/seed-001" },
  { label: "Broadcast", href: "/track/seed-001" },
  { label: "Performance", href: "/track/seed-001" },
  { label: "Stems", href: "/catalog" },
  { label: "Services", href: "/servicios/mix" },
];

export default function HomeVariantRightsPassport({
  optionIndex = 19,
  optionTotal = 20,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden bg-background">
      <header className="grid border-b border-border p-4 md:grid-cols-[1fr_auto] md:p-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Rights passport</p>
          <h1 className="font-cinema-title text-6xl uppercase leading-none tracking-normal md:text-8xl">Stamped access</h1>
        </div>
        <FindThingsCta className="self-end text-3xl md:text-5xl" />
      </header>

      <div className="grid min-h-0 place-items-center p-4 md:p-8">
        <div className="grid w-full max-w-5xl border-2 border-foreground md:grid-cols-[0.8fr_1.2fr]">
          <aside className="border-b-2 border-foreground p-5 md:border-b-0 md:border-r-2 md:p-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">ODR Passport / license terms</p>
            <h2 className="mt-4 font-cinema-title text-6xl uppercase leading-[0.78] tracking-normal md:text-8xl">Travel with rights</h2>
            <p className="mt-4 text-xs uppercase leading-snug tracking-[0.1em] text-muted-foreground">
              A visual metaphor for transparent usage: every beat should declare where it can go.
            </p>
          </aside>
          <div className="grid grid-cols-2 gap-3 p-5 md:grid-cols-3 md:p-7">
            {stamps.map((stamp, index) => (
              <Link
                key={stamp.label}
                href={stamp.href}
                className="group grid min-h-[108px] place-items-center rounded-[50%] border border-foreground px-3 text-center text-xs font-semibold uppercase tracking-[0.12em] transition hover:bg-foreground hover:text-background"
              >
                <span>
                  <span className="block font-mono text-[10px] opacity-70">VISA {String(index + 1).padStart(2, "0")}</span>
                  {stamp.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <footer className="grid grid-cols-1 border-t border-border md:grid-cols-[1fr_auto]">
        <p className="p-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground md:p-4">
          Contracts, summaries and usage maps should be accessible before purchase.
        </p>
        <Link href="/track/seed-001" className="flex items-center gap-3 border-t border-border p-3 text-xs uppercase tracking-[0.14em] hover:bg-foreground hover:text-background md:border-l md:border-t-0 md:p-4">
          View license example <ArrowRight className="h-4 w-4" />
        </Link>
      </footer>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
