import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import FindThingsCta from "./FindThingsCta";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { homeAssets, type HomeVariantProps } from "./data";

const ledgerRows = [
  {
    code: "TRK-001",
    label: "License-ready beat",
    href: "/track/seed-001",
    price: "Clear terms",
  },
  {
    code: "KIT-014",
    label: "Drums and sample packs",
    href: "/catalog",
    price: "Browse",
  },
  {
    code: "SRV-048",
    label: "48h mix/master pass",
    href: "/servicios/mix",
    price: "Book",
  },
  {
    code: "MRG-007",
    label: "Physical drops and merch",
    href: "/catalog",
    price: "Soon",
  },
];

export default function HomeVariantDropLedger({
  optionIndex = 5,
  optionTotal = 10,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="bg-background relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden">
      <header className="border-border grid border-b md:grid-cols-[1fr_0.55fr]">
        <div className="p-4 md:p-6">
          <p className="text-muted-foreground font-mono text-[10px] tracking-[0.18em] uppercase">
            Drop ledger / commerce proof
          </p>
          <h1 className="font-cinema-title mt-2 text-7xl leading-[0.75] tracking-normal uppercase md:text-[11vw]">
            Ledger
          </h1>
        </div>
        <div className="border-border grid border-t md:border-t-0 md:border-l">
          {homeAssets.slice(0, 3).map((asset) => (
            <Link
              key={asset.title}
              href={asset.href}
              className="border-border hover:bg-foreground hover:text-background grid grid-cols-[1fr_auto] items-center border-b px-4 py-3 text-xs tracking-[0.12em] uppercase last:border-b-0"
            >
              <span>{asset.title}</span>
              <span className="font-mono text-[10px] opacity-70">
                {asset.price}
              </span>
            </Link>
          ))}
        </div>
      </header>

      <div className="grid min-h-0">
        {ledgerRows.map((row) => (
          <Link
            key={row.code}
            href={row.href}
            className="group border-border hover:bg-foreground hover:text-background grid grid-cols-[72px_1fr_auto] items-center border-b px-4 py-4 transition md:grid-cols-[120px_1fr_220px_auto] md:px-6"
          >
            <span className="text-muted-foreground group-hover:text-background/70 font-mono text-[10px] tracking-[0.18em] uppercase">
              {row.code}
            </span>
            <span className="font-cinema-title text-4xl leading-none tracking-normal uppercase md:text-6xl">
              {row.label}
            </span>
            <span className="hidden font-mono text-xs tracking-[0.14em] uppercase md:block">
              {row.price}
            </span>
            <ArrowUpRight className="h-5 w-5 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
          </Link>
        ))}
      </div>

      <footer className="border-border grid border-t md:grid-cols-[1fr_auto]">
        <p className="p-4 text-sm leading-tight font-semibold uppercase md:p-6 md:text-2xl">
          Sounds, rights, services and drops presented as a purchase-ready
          index.
        </p>
        <div className="border-border border-t p-4 md:border-t-0 md:border-l md:p-6">
          <FindThingsCta className="text-3xl md:text-5xl" />
        </div>
      </footer>
      <HomeOptionIndicator
        index={optionIndex}
        total={optionTotal}
        label={indicatorLabel}
      />
    </section>
  );
}
