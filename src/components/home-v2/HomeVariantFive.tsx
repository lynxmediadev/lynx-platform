import Image from "next/image";

import FindThingsCta from "./FindThingsCta";
import HomeAssetTile from "./HomeAssetTile";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { homeAssets } from "./data";

export default function HomeVariantFive() {
  return (
    <section className="relative grid h-full grid-cols-1 overflow-hidden bg-background md:grid-cols-[0.9fr_1.2fr_0.9fr]">
      <div className="hidden min-h-0 grid-rows-2 gap-3 p-4 md:grid">
        <HomeAssetTile asset={homeAssets[0]!} imageClassName="h-full" />
        <HomeAssetTile asset={homeAssets[1]!} imageClassName="h-full" />
      </div>

      <div className="relative min-h-0 border-x border-border">
        <Image
          src="/images/hero/hero6.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, 42vw"
          className="object-cover grayscale contrast-125"
        />
        <div className="absolute inset-0 bg-background/30" />
        <div className="relative z-10 flex h-full flex-col justify-between p-5 md:p-8">
          <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.18em]">
            <span>ODR Archive</span>
            <span>Assets / Goods / Sound</span>
          </div>
          <div>
            <h1 className="font-cinema-title text-[24vw] uppercase leading-[0.76] tracking-normal md:text-[12vw]">
              Things
            </h1>
            <p className="max-w-sm text-sm font-semibold uppercase tracking-[0.08em]">
              Un catalogo vivo para sonidos, piezas fisicas y trabajo profesional.
            </p>
          </div>
          <FindThingsCta />
        </div>
      </div>

      <div className="grid min-h-0 grid-cols-2 gap-2 p-4 md:grid-cols-1 md:grid-rows-3">
        {homeAssets.slice(2, 5).map((asset) => (
          <HomeAssetTile key={asset.title} asset={asset} compact />
        ))}
      </div>
      <HomeOptionIndicator index={5} total={10} />
    </section>
  );
}
