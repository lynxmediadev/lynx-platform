import Link from "next/link";
import { ArrowRight } from "lucide-react";

import HomeOptionIndicator from "./HomeOptionIndicator";
import { type HomeVariantProps } from "./data";

const vaultLinks = [
  { label: "Assets", href: "/catalog" },
  { label: "Rights", href: "/track/seed-001" },
  { label: "Services", href: "/servicios/mix" },
  { label: "Archive", href: "/about-us" },
];

export default function HomeVariantVaultAccess({
  optionIndex = 16,
  optionTotal = 20,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden bg-foreground text-background">
      <header className="grid border-b border-background/30 p-4 md:grid-cols-[1fr_auto] md:p-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-background/70">Vault access</p>
          <h1 className="font-cinema-title text-6xl uppercase leading-none tracking-normal md:text-8xl">Open stock</h1>
        </div>
        <Link
          href="/catalog"
          className="self-end border border-background px-4 py-2 text-xs uppercase tracking-[0.14em] hover:bg-background hover:text-foreground"
        >
          Unlock catalog
        </Link>
      </header>

      <div className="grid min-h-0 place-items-center p-4 md:p-8">
        <div className="relative grid h-[58vw] max-h-[520px] min-h-[300px] w-[58vw] min-w-[300px] max-w-[520px] place-items-center rounded-full border-2 border-background">
          <div className="absolute inset-8 rounded-full border border-background/40" />
          <div className="absolute inset-20 rounded-full border border-background/25" />
          <div className="grid h-40 w-40 place-items-center rounded-full border-2 border-background md:h-56 md:w-56">
            <span className="font-cinema-title text-6xl uppercase leading-none md:text-8xl">ODR</span>
          </div>
          {["01", "20", "88", "04"].map((number, index) => (
            <span
              key={number}
              className="absolute font-mono text-xs uppercase tracking-[0.18em] text-background/70"
              style={{
                left: `${50 + Math.cos((index / 4) * Math.PI * 2 - Math.PI / 2) * 38}%`,
                top: `${50 + Math.sin((index / 4) * Math.PI * 2 - Math.PI / 2) * 38}%`,
              }}
            >
              {number}
            </span>
          ))}
        </div>
      </div>

      <footer className="grid grid-cols-2 border-t border-background/30 md:grid-cols-4">
        {vaultLinks.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center justify-between border-r border-background/30 p-3 text-xs uppercase tracking-[0.14em] hover:bg-background hover:text-foreground md:p-4"
          >
            <span>{item.label}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        ))}
      </footer>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
