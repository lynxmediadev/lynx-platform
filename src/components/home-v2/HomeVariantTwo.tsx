import FindThingsCta from "./FindThingsCta";
import HomeAssetTile from "./HomeAssetTile";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { categories, homeAssets, type HomeVariantProps } from "./data";

export default function HomeVariantTwo({
  optionIndex = 2,
  optionTotal = 10,
  indicatorLabel,
}: HomeVariantProps) {
  return (
    <section className="relative grid h-full grid-rows-[auto_1fr_auto] overflow-hidden bg-background">
      <div className="flex items-start justify-between border-b border-border p-3 md:p-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Store / catalog</p>
          <h1 className="mt-2 font-cinema-title text-6xl uppercase leading-none tracking-normal md:text-8xl">All</h1>
        </div>
        <FindThingsCta className="text-3xl md:text-5xl" />
      </div>

      <div className="grid min-h-0 grid-cols-1 gap-3 p-3 md:grid-cols-[190px_1fr] md:p-5">
        <aside className="hidden border border-border p-3 md:block">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Filter</p>
          <div className="flex flex-col gap-2">
            {categories.slice(0, 7).map((item, index) => (
              <span
                key={item}
                className={index === 0 ? "bg-foreground px-2 py-1 text-xs uppercase text-background" : "border border-border px-2 py-1 text-xs uppercase"}
              >
                {item}
              </span>
            ))}
          </div>
        </aside>
        <div className="grid min-h-0 grid-cols-2 gap-2 md:grid-cols-3">
          {homeAssets.slice(0, 6).map((asset) => (
            <HomeAssetTile key={asset.title} asset={asset} compact />
          ))}
        </div>
      </div>

      <div className="border-t border-border bg-foreground p-3 text-background md:p-5">
        <p className="font-cinema-title text-5xl uppercase leading-none tracking-normal md:text-8xl">
          Digital shelves for sound, goods and services.
        </p>
      </div>
      <HomeOptionIndicator index={optionIndex} total={optionTotal} label={indicatorLabel} />
    </section>
  );
}
