import * as React from "react";
import { cn } from "@/lib/utils";

type CompactSelectableCardProps = {
  title: string;
  value: string;
  meta: string;
  highlightLabel?: string | null;
  isActive?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
};

export function CompactSelectableCard({
  title,
  value,
  meta,
  highlightLabel,
  isActive = false,
  disabled = false,
  className,
  onClick,
}: CompactSelectableCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded border px-2.5 py-2 text-left",
        "transition disabled:cursor-not-allowed disabled:opacity-55",
        isActive
          ? "border-foreground bg-foreground/10"
          : "border-border bg-card/50 hover:border-foreground/60",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-[13px] font-semibold leading-tight text-foreground">{title}</p>
        {highlightLabel ? (
          <span className="rounded border border-foreground/60 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-foreground">
            {highlightLabel}
          </span>
        ) : null}
      </div>
      <div className="mt-1 flex items-end gap-2">
        <p className="shrink-0 text-base font-semibold leading-none text-foreground">{value}</p>
        <p className="min-w-0 truncate text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
          {meta}
        </p>
      </div>
    </button>
  );
}

