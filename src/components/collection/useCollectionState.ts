"use client";

import { useCallback, useEffect, useState } from "react";
import type { CollectionItemBase, CollectionViewMode } from "./types";

type Params<TItem extends CollectionItemBase> = {
  items: TItem[];
  selectedId?: string | null;
  defaultSelectedId?: string | null;
  onSelectedIdChange?: (next: string | null) => void;
  viewMode?: CollectionViewMode;
  defaultViewMode?: CollectionViewMode;
  onViewModeChange?: (next: CollectionViewMode) => void;
  persistViewModeKey?: string | null;
};

function isCollectionViewMode(value: string | null): value is CollectionViewMode {
  return value === "grid" || value === "list";
}

export function useCollectionState<TItem extends CollectionItemBase>({
  items,
  selectedId,
  defaultSelectedId,
  onSelectedIdChange,
  viewMode,
  defaultViewMode = "grid",
  onViewModeChange,
  persistViewModeKey,
}: Params<TItem>) {
  const isSelectedControlled = selectedId !== undefined;
  const [uncontrolledSelectedId, setUncontrolledSelectedId] = useState<string | null>(
    defaultSelectedId ?? items[0]?.id ?? null,
  );

  const rawSelectedId = isSelectedControlled ? selectedId ?? null : uncontrolledSelectedId;
  const selectedItem = items.find((item) => item.id === rawSelectedId) ?? items[0] ?? null;
  const activeSelectedId = selectedItem?.id ?? null;

  const setSelected = useCallback(
    (next: string | null) => {
      if (!isSelectedControlled) {
        setUncontrolledSelectedId(next);
      }
      onSelectedIdChange?.(next);
    },
    [isSelectedControlled, onSelectedIdChange],
  );

  useEffect(() => {
    if (isSelectedControlled) return;
    if (items.length === 0) {
      if (uncontrolledSelectedId !== null) setUncontrolledSelectedId(null);
      return;
    }
    if (!uncontrolledSelectedId) {
      setUncontrolledSelectedId(items[0]?.id ?? null);
      return;
    }
    if (!items.some((item) => item.id === uncontrolledSelectedId)) {
      setUncontrolledSelectedId(items[0]?.id ?? null);
    }
  }, [items, uncontrolledSelectedId, isSelectedControlled]);

  const isViewModeControlled = viewMode !== undefined;
  const [uncontrolledViewMode, setUncontrolledViewMode] = useState<CollectionViewMode>(
    defaultViewMode,
  );

  useEffect(() => {
    if (!persistViewModeKey || isViewModeControlled || typeof window === "undefined") return;
    try {
      const value = window.localStorage.getItem(persistViewModeKey);
      if (isCollectionViewMode(value)) {
        setUncontrolledViewMode(value);
      }
    } catch {
      // ignore storage access issues
    }
  }, [persistViewModeKey, isViewModeControlled]);

  const activeViewMode = isViewModeControlled ? viewMode : uncontrolledViewMode;

  const setView = useCallback(
    (next: CollectionViewMode) => {
      if (!isViewModeControlled) {
        setUncontrolledViewMode(next);
      }
      onViewModeChange?.(next);
      if (!persistViewModeKey || typeof window === "undefined") return;
      try {
        window.localStorage.setItem(persistViewModeKey, next);
      } catch {
        // ignore storage access issues
      }
    },
    [isViewModeControlled, onViewModeChange, persistViewModeKey],
  );

  return {
    selectedId: activeSelectedId,
    selectedItem,
    setSelected,
    viewMode: activeViewMode,
    setView,
  };
}
