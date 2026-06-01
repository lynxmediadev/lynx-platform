import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import HomeOptionIndicator from "./HomeOptionIndicator";
import { type HomeVariantProps } from "./data";

const decisions = [
  { title: "Buy assets", copy: "Drums, loops, samples, beats and voices.", href: "/catalog" },
  { title: "License tracks", copy: "Clear rights before purchase.", href: "/track/seed-001" },
  { title: "Book services", copy: "Mix, master, sound design and production.", href: "/servicios/mix" },
  { title: "Explore drops", copy: "Merch, records, physical goods and archive pieces.", href: "/catalog" },
];

export default function HomeVariantSplitDecision({
  optionIndex = 7,
  optionTotal = 10,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative grid h-full grid-cols-1 overflow-hidden bg-background md:grid-cols-4">
      {decisions.map((decision, index) => (
        <Link
          key={decision.title}
          href={decision.href}
          className={
            index === 1
              ? "group flex min-h-0 flex-col justify-between border-b border-border bg-foreground p-5 text-background transition md:border-b-0 md:border-r md:p-7"
              : "group flex min-h-0 flex-col justify-between border-b border-border p-5 transition hover:bg-foreground hover:text-background md:border-b-0 md:border-r md:p-7"
          }
        >
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <ArrowUpRight className="h-5 w-5 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
          </div>
          <div>
            <h1 className="font-cinema-title text-6xl uppercase leading-[0.78] tracking-normal md:text-[7.4vw]">
              {decision.title}
            </h1>
            <p className="mt-4 max-w-[250px] text-xs uppercase leading-snug tracking-[0.1em] opacity-80">
              {decision.copy}
            </p>
          </div>
        </Link>
      ))}
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
