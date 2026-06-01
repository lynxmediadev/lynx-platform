import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import FindThingsCta from "./FindThingsCta";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { homeAssets, type HomeVariantProps } from "./data";

const ledgerRows = [
  { code: "TRK-001", label: "License-ready beat", href: "/track/seed-001", price: "Clear terms" },
  { code: "KIT-014", label: "Drums and sample packs", href: "/catalog", price: "Browse" },
  { code: "SRV-048", label: "48h mix/master pass", href: "/servicios/mix", price: "Book" },
  { code: "MRG-007", label: "Physical drops and merch", href: "/catalog", price: "Soon" },
];

export default function HomeVariantDropLedger({
  optionIndex = 5,
  optionTotal = 10,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden bg-background">
      <header className="grid border-b border-border md:grid-cols-[1fr_0.55fr]">
        <div className="p-4 md:p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Drop ledger / commerce proof</p>
          <h1 className="mt-2 font-cinema-title text-7xl uppercase leading-[0.75] tracking-normal md:text-[11vw]">
            Ledger
          </h1>
        </div>
        <div className="grid border-t border-border md:border-l md:border-t-0">
          {homeAssets.slice(0, 3).map((asset) => (
            <Link
              key={asset.title}
              href={asset.href}
              className="grid grid-cols-[1fr_auto] items-center border-b border-border px-4 py-3 text-xs uppercase tracking-[0.12em] last:border-b-0 hover:bg-foreground hover:text-background"
            >
              <span>{asset.title}</span>
              <span className="font-mono text-[10px] opacity-70">{asset.price}</span>
            </Link>
          ))}
        </div>
      </header>

      <div className="grid min-h-0">
        {ledgerRows.map((row, index) => (
          <Link
            key={row.code}
            href={row.href}
            className="group grid grid-cols-[72px_1fr_auto] items-center border-b border-border px-4 py-4 transition hover:bg-foreground hover:text-background md:grid-cols-[120px_1fr_220px_auto] md:px-6"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground group-hover:text-background/70">
              {row.code}
            </span>
            <span className="font-cinema-title text-4xl uppercase leading-none tracking-normal md:text-6xl">
              {row.label}
            </span>
            <span className="hidden font-mono text-xs uppercase tracking-[0.14em] md:block">{row.price}</span>
            <ArrowUpRight className="h-5 w-5 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
          </Link>
        ))}
      </div>

      <footer className="grid border-t border-border md:grid-cols-[1fr_auto]">
        <p className="p-4 text-sm font-semibold uppercase leading-tight md:p-6 md:text-2xl">
          Sounds, rights, services and drops presented as a purchase-ready index.
        </p>
        <div className="border-t border-border p-4 md:border-l md:border-t-0 md:p-6">
          <FindThingsCta className="text-3xl md:text-5xl" />
        </div>
      </footer>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
