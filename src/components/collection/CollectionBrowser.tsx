"use client";

import { cn } from "@/lib/utils";
import { useCollectionState } from "./useCollectionState";
import type { CollectionBrowserProps, CollectionItemBase } from "./types";

export default function CollectionBrowser<TItem extends CollectionItemBase>({
  items,
  totalItems,
  selectedId,
  defaultSelectedId,
  onSelectedIdChange,
  viewMode,
  defaultViewMode = "grid",
  onViewModeChange,
  persistViewModeKey = null,
  showDetailPanel = true,
  filterShell,
  renderGridItem,
  renderListItem,
  renderDetailPanel,
  renderNoItemsState,
  renderNoResultsState,
  listDetailLayoutClassName,
  gridClassName,
  listClassName,
  detailAsideClassName,
}: CollectionBrowserProps<TItem>) {
  const total = totalItems ?? items.length;
  const {
    selectedId: activeSelectedId,
    selectedItem,
    setSelected,
    viewMode: activeViewMode,
  } = useCollectionState({
    items,
    selectedId,
    defaultSelectedId,
    onSelectedIdChange,
    viewMode,
    defaultViewMode,
    onViewModeChange,
    persistViewModeKey,
  });

  return (
    <>
      {filterShell}

      <div
        className={cn(
          "grid min-w-0 gap-2 xl:gap-3",
          showDetailPanel
            ? "lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_480px]"
            : "grid-cols-1",
          listDetailLayoutClassName,
        )}
      >
        <section className="min-w-0">
          {total === 0 ? (
            renderNoItemsState ?? (
              <div className="rounded-2xl border border-border bg-background/70 px-5 py-8 text-sm text-muted-foreground">
                No hay elementos disponibles.
              </div>
            )
          ) : items.length === 0 ? (
            renderNoResultsState ?? (
              <div className="rounded-2xl border border-border bg-background/70 px-5 py-8 text-sm text-muted-foreground">
                No encontramos elementos con esos filtros.
              </div>
            )
          ) : activeViewMode === "grid" ? (
            <ul className={cn("grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5", gridClassName)}>
              {items.map((item, index) => (
                <li key={item.id}>
                  {renderGridItem({
                    item,
                    index,
                    isSelected: item.id === activeSelectedId,
                    select: () => setSelected(item.id),
                  })}
                </li>
              ))}
            </ul>
          ) : (
            <ul className={cn("space-y-2", listClassName)}>
              {items.map((item, index) => (
                <li key={item.id}>
                  {renderListItem({
                    item,
                    index,
                    isSelected: item.id === activeSelectedId,
                    select: () => setSelected(item.id),
                  })}
                </li>
              ))}
            </ul>
          )}
        </section>

        {showDetailPanel && renderDetailPanel ? (
          <aside className={cn("min-w-0 self-start lg:sticky lg:top-[calc(var(--header-h)+1rem)]", detailAsideClassName)}>
            {renderDetailPanel({
              selectedItem,
              selectedId: activeSelectedId,
            })}
          </aside>
        ) : null}
      </div>
    </>
  );
}
