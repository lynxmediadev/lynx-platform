import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import HomeOptionIndicator from "./HomeOptionIndicator";
import { categories, type HomeVariantProps } from "./data";

const blueprintNodes = [
  { label: "Catalog", href: "/catalog", className: "left-[8%] top-[18%]" },
  { label: "Licenses", href: "/track/seed-001", className: "right-[12%] top-[18%]" },
  { label: "Samples", href: "/catalog", className: "left-[22%] bottom-[24%]" },
  { label: "Services", href: "/servicios/mix", className: "right-[24%] bottom-[20%]" },
];

export default function HomeVariantAudioBlueprint({
  optionIndex = 11,
  optionTotal = 20,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative h-full overflow-hidden bg-background">
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="relative z-10 grid h-full grid-rows-[auto_1fr_auto]">
        <header className="grid border-b border-border p-4 md:grid-cols-[1fr_auto] md:p-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Audio blueprint</p>
            <h1 className="font-cinema-title text-6xl uppercase leading-none tracking-normal md:text-8xl">System plan</h1>
          </div>
          <Link
            href="/catalog"
            className="self-end border border-foreground px-4 py-2 text-xs uppercase tracking-[0.14em] hover:bg-foreground hover:text-background"
          >
            Open catalog
          </Link>
        </header>

        <div className="relative min-h-0 p-4 md:p-8">
          <div className="absolute left-1/2 top-1/2 h-[1px] w-[80%] -translate-x-1/2 bg-border" />
          <div className="absolute left-1/2 top-[16%] h-[68%] w-[1px] bg-border" />
          <div className="absolute left-[20%] top-[34%] h-[1px] w-[58%] rotate-12 bg-border" />
          <div className="absolute left-[24%] top-[68%] h-[1px] w-[52%] -rotate-12 bg-border" />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="grid h-44 w-44 place-items-center rounded-full border border-foreground bg-background md:h-64 md:w-64">
              <span className="font-cinema-title text-6xl uppercase leading-none md:text-8xl">ODR</span>
            </div>
          </div>

          {blueprintNodes.map((node, index) => (
            <Link
              key={node.label}
              href={node.href}
              className={`absolute ${node.className} group min-w-[132px] border border-border bg-background px-3 py-3 uppercase tracking-[0.12em] hover:bg-foreground hover:text-background`}
            >
              <span className="block font-mono text-[10px] text-muted-foreground group-hover:text-background/70">
                NODE {String(index + 1).padStart(2, "0")}
              </span>
              <span className="mt-1 flex items-center justify-between text-sm font-semibold">
                {node.label}
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>

        <footer className="grid grid-cols-3 border-t border-border md:grid-cols-6">
          {categories.slice(0, 6).map((category) => (
            <Link
              key={category}
              href="/catalog"
              className="border-r border-border p-3 text-center text-[10px] uppercase tracking-[0.14em] hover:bg-foreground hover:text-background"
            >
              {category}
            </Link>
          ))}
        </footer>
      </div>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
