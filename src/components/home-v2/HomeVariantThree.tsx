import Image from "next/image";

import FindThingsCta from "./FindThingsCta";
import HomeOptionIndicator from "./HomeOptionIndicator";
import type { HomeVariantProps } from "./data";

export default function HomeVariantThree({
  optionIndex = 3,
  optionTotal = 10,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative grid h-full grid-rows-[1fr_auto] overflow-hidden bg-foreground text-background">
      <div className="relative min-h-0">
        <div className="absolute inset-x-0 top-4 z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 text-[10px] uppercase tracking-[0.16em] md:px-8">
          <span>Assets</span>
          <span className="border border-background px-3 py-1">ODR Records</span>
          <span className="text-right">Services</span>
        </div>
        <Image
          src="/images/hero/hero2.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover grayscale opacity-60 contrast-150"
        />
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <h1 className="font-cinema-title text-[22vw] uppercase leading-none tracking-normal">
            Find
          </h1>
        </div>
      </div>
      <div className="grid grid-cols-1 border-t border-background/40 md:grid-cols-[1.4fr_0.8fr_1fr]">
        <div className="border-b border-background/40 p-4 md:border-b-0 md:border-r md:p-6">
          <p className="max-w-lg text-lg font-semibold uppercase leading-tight md:text-2xl">
            Drums, loops, samples, instrumentales, voices, merch and professional audio work.
          </p>
        </div>
        <div className="hidden border-r border-background/40 p-6 text-sm uppercase md:block">
          <p>Search less.</p>
          <p>Use better assets.</p>
          <p>License clearly.</p>
        </div>
        <div className="p-4 md:p-6">
          <FindThingsCta dark />
        </div>
      </div>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
