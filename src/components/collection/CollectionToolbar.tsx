"use client";

import { ChevronDown, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CollectionViewMode } from "./types";

type Props = {
  visibleCount: number;
  totalCount: number;
  viewMode: CollectionViewMode;
  onViewModeChange: (next: CollectionViewMode) => void;
  hasActiveFilters: boolean;
  onClear: () => void;
  showViewModeToggle?: boolean;
  filterToggle?: {
    open: boolean;
    onToggle: () => void;
    openLabel?: string;
    closedLabel?: string;
  };
  className?: string;
};

export default function CollectionToolbar({
  visibleCount,
  totalCount,
  viewMode,
  onViewModeChange,
  hasActiveFilters,
  onClear,
  showViewModeToggle = true,
  filterToggle,
  className,
}: Props) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="inline-flex h-7 items-center rounded border border-border px-2 text-xs text-muted-foreground">
        {visibleCount}/{totalCount}
      </span>

      {showViewModeToggle && (
        <div className="inline-flex h-7 overflow-hidden rounded border border-border">
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            aria-label="Vista grid"
            aria-pressed={viewMode === "grid"}
            title="Vista grid"
            className={cn(
              "inline-flex w-8 items-center justify-center transition",
              viewMode === "grid"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            aria-label="Vista lista"
            aria-pressed={viewMode === "list"}
            title="Vista lista"
            className={cn(
              "inline-flex w-8 items-center justify-center border-l border-border transition",
              viewMode === "list"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onClear}
        disabled={!hasActiveFilters}
        className={cn(
          "h-7 rounded border px-2 text-xs font-semibold transition",
          hasActiveFilters
            ? "border-foreground/70 text-foreground hover:border-foreground"
            : "cursor-not-allowed border-border text-muted-foreground/70",
        )}
      >
        Limpiar
      </button>

      {filterToggle && (
        <button
          type="button"
          onClick={filterToggle.onToggle}
          aria-expanded={filterToggle.open}
          aria-label={filterToggle.open ? "Ocultar filtros" : "Abrir filtros"}
          className="inline-flex h-7 items-center gap-1 rounded border border-border px-2 text-xs font-semibold text-foreground/90 transition hover:border-foreground/70"
        >
          {filterToggle.open
            ? (filterToggle.openLabel ?? "Ocultar filtros")
            : (filterToggle.closedLabel ?? "Abrir filtros")}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              filterToggle.open ? "rotate-180" : "",
            )}
          />
        </button>
      )}
    </div>
  );
}
