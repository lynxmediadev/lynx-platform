"use client";

import { useState } from "react";
import CollectionToolbar from "./CollectionToolbar";
import type { CollectionViewMode } from "./types";

type Props = {
  enabled: boolean;
  compact?: boolean;
  visibleCount: number;
  totalCount: number;
  viewMode: CollectionViewMode;
  onViewModeChange: (next: CollectionViewMode) => void;
  hasActiveFilters: boolean;
  onClear: () => void;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  renderMobileControls: () => React.ReactNode;
  renderDesktopControls: (ctx: { toolbar: React.ReactNode }) => React.ReactNode;
};

export default function CollectionFilterShell({
  enabled,
  compact = false,
  visibleCount,
  totalCount,
  viewMode,
  onViewModeChange,
  hasActiveFilters,
  onClear,
  mobileOpen,
  onMobileOpenChange,
  renderMobileControls,
  renderDesktopControls,
}: Props) {
  const [uncontrolledMobileOpen, setUncontrolledMobileOpen] = useState(false);
  const isMobileOpen = mobileOpen ?? uncontrolledMobileOpen;
  const setMobileOpen = onMobileOpenChange ?? setUncontrolledMobileOpen;

  if (!enabled || totalCount === 0) return null;

  const desktopToolbar = (
    <CollectionToolbar
      visibleCount={visibleCount}
      totalCount={totalCount}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      hasActiveFilters={hasActiveFilters}
      onClear={onClear}
      showViewModeToggle={!compact}
    />
  );

  return (
    <section className="mb-2 min-w-0 rounded border border-border bg-card/40 p-2">
      <div className="sm:hidden">
        <CollectionToolbar
          className="justify-between"
          visibleCount={visibleCount}
          totalCount={totalCount}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          hasActiveFilters={hasActiveFilters}
          onClear={onClear}
          showViewModeToggle={!compact}
          filterToggle={{
            open: isMobileOpen,
            onToggle: () => setMobileOpen(!isMobileOpen),
          }}
        />
        <div className={isMobileOpen ? "mt-2.5 block" : "mt-2.5 hidden"}>
          {renderMobileControls()}
        </div>
      </div>

      {renderDesktopControls({ toolbar: desktopToolbar })}
    </section>
  );
}
