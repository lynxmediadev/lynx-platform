import Image from "next/image";
import Link from "next/link";

import FindThingsCta from "./FindThingsCta";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { homeAssets } from "./data";

export default function HomeVariantNine() {
  return (
    <section className="relative grid h-full grid-rows-[0.9fr_1fr] overflow-hidden bg-background">
      <div className="relative border-b border-border">
        <Image
          src="/images/hero/hero7.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover contrast-125 saturate-75"
        />
        <div className="absolute inset-0 bg-background/45" />
        <div className="relative z-10 flex h-full flex-col justify-between p-4 md:p-7">
          <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <span>Editorial merch + sound</span>
            <span>ODR / 2026</span>
          </div>
          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-[1fr_auto]">
            <h1 className="font-cinema-title text-7xl uppercase leading-[0.78] tracking-normal md:text-[10vw]">
              Wear the sound
            </h1>
            <FindThingsCta className="text-3xl md:text-5xl" />
          </div>
        </div>
      </div>

      <div className="grid min-h-0 grid-cols-2 md:grid-cols-4">
        {homeAssets.slice(2, 6).map((asset) => (
          <Link
            key={asset.title}
            href={asset.href}
            className="group relative overflow-hidden border-r border-border p-3 last:border-r-0"
          >
            <Image
              src={asset.image}
              alt=""
              fill
              sizes="25vw"
              className="object-cover opacity-45 contrast-125 saturate-75 transition group-hover:scale-105 group-hover:opacity-70"
            />
            <div className="absolute inset-0 bg-background/35" />
            <div className="relative z-10 flex h-full flex-col justify-end">
              <p className="font-cinema-title text-4xl uppercase leading-none tracking-normal md:text-6xl">{asset.type}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.12em]">{asset.title}</p>
            </div>
          </Link>
        ))}
      </div>
      <HomeOptionIndicator index={9} total={10} />
    </section>
  );
}
