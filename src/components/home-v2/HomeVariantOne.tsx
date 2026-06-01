import Image from "next/image";

import FindThingsCta from "./FindThingsCta";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { homeAssets } from "./data";

export default function HomeVariantOne() {
  return (
    <section className="relative flex h-full overflow-hidden border-y border-border bg-background">
      <Image
        src="/images/hero/hero1.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover grayscale contrast-125"
      />
      <div className="absolute inset-0 bg-background/35 mix-blend-multiply" />
      <div className="relative z-10 flex h-full w-full flex-col justify-between p-4 md:p-8">
        <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3 text-[10px] uppercase tracking-[0.18em]">
          <span>ODR</span>
          <span className="border-t border-foreground/60 pt-2">Digital assets / professional audio</span>
          <span>2026</span>
        </div>

        <div>
          <h1 className="font-cinema-title text-[27vw] uppercase leading-[0.72] tracking-normal text-foreground md:text-[19vw]">
            ODR
          </h1>
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <p className="max-w-md text-sm font-medium uppercase tracking-[0.08em] md:text-base">
              Catalogo de musica, samples, loops, merchandising y servicios de audio para proyectos con criterio.
            </p>
            <FindThingsCta />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 md:w-[520px]">
          {homeAssets.slice(0, 3).map((asset) => (
            <div key={asset.title} className="border border-foreground/40 bg-background/80 p-2 text-[10px] uppercase">
              <p className="truncate font-semibold">{asset.title}</p>
              <p className="text-muted-foreground">{asset.type}</p>
            </div>
          ))}
        </div>
      </div>
      <HomeOptionIndicator index={1} total={10} />
    </section>
  );
}
