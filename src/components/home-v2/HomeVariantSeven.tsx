import FindThingsCta from "./FindThingsCta";
import HomeAssetTile from "./HomeAssetTile";
import HomeOptionIndicator from "./HomeOptionIndicator";
import { categories, homeAssets } from "./data";

export default function HomeVariantSeven() {
  return (
    <section className="relative grid h-full grid-cols-1 overflow-hidden bg-background md:grid-cols-[180px_1fr_260px]">
      <aside className="hidden border-r border-border p-4 md:flex md:flex-col md:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Marketplace wall</p>
          <h1 className="mt-2 font-cinema-title text-5xl uppercase leading-none tracking-normal">ODR Stock</h1>
        </div>
        <div className="flex flex-col gap-1">
          {categories.slice(0, 7).map((category) => (
            <span key={category} className="border border-border px-2 py-1 text-[10px] uppercase tracking-[0.1em]">
              {category}
            </span>
          ))}
        </div>
      </aside>

      <div className="grid min-h-0 grid-cols-2 gap-2 p-3 md:grid-cols-4 md:p-4">
        {homeAssets.slice(0, 8).map((asset) => (
          <HomeAssetTile key={asset.title} asset={asset} compact />
        ))}
      </div>

      <aside className="grid border-t border-border p-4 md:border-l md:border-t-0">
        <div className="self-start">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Assets / goods / work</p>
          <p className="mt-3 text-sm uppercase leading-tight">
            Una pared de entrada para navegar sonidos, productos y servicios sin explicar demasiado.
          </p>
        </div>
        <FindThingsCta className="self-end text-3xl md:text-5xl" />
      </aside>
      <HomeOptionIndicator index={7} total={10} />
    </section>
  );
}
