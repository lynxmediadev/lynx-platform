import type { ReactNode } from "react";

export type CollectionViewMode = "grid" | "list";

export type CollectionItemBase = {
  id: string;
};

export type CollectionItemRenderContext<TItem extends CollectionItemBase> = {
  item: TItem;
  index: number;
  isSelected: boolean;
  select: () => void;
};

export type CollectionDetailRenderContext<TItem extends CollectionItemBase> = {
  selectedItem: TItem | null;
  selectedId: string | null;
};

export type CollectionFilterRenderContext = {
  viewMode: CollectionViewMode;
  setViewMode: (next: CollectionViewMode) => void;
  visibleCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  clearFilters: () => void;
};

export type CollectionBrowserProps<TItem extends CollectionItemBase> = {
  items: TItem[];
  totalItems?: number;
  selectedId?: string | null;
  defaultSelectedId?: string | null;
  onSelectedIdChange?: (next: string | null) => void;
  viewMode?: CollectionViewMode;
  defaultViewMode?: CollectionViewMode;
  onViewModeChange?: (next: CollectionViewMode) => void;
  persistViewModeKey?: string | null;
  showDetailPanel?: boolean;
  filterShell?: ReactNode;
  renderGridItem: (ctx: CollectionItemRenderContext<TItem>) => ReactNode;
  renderListItem: (ctx: CollectionItemRenderContext<TItem>) => ReactNode;
  renderDetailPanel?: (ctx: CollectionDetailRenderContext<TItem>) => ReactNode;
  renderNoItemsState?: ReactNode;
  renderNoResultsState?: ReactNode;
  listDetailLayoutClassName?: string;
  gridClassName?: string;
  listClassName?: string;
  detailAsideClassName?: string;
};
