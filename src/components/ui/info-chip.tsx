"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type IconLike = React.ComponentType<{ className?: string }> | React.ReactNode;

export type InfoChipProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: IconLike;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  iconContainerClassName?: string;
  iconClassName?: string;
};

function renderIcon(icon: IconLike, className?: string) {
  if (React.isValidElement(icon)) return icon;
  if (icon && (typeof icon === "function" || typeof icon === "object")) {
    const IconComponent = icon as React.ElementType;
    try {
      return React.createElement(IconComponent, { className });
    } catch {
      return null;
    }
  }
  return null;
}

export function InfoChip({
  label,
  value,
  icon,
  className,
  labelClassName,
  valueClassName,
  iconContainerClassName,
  iconClassName,
}: InfoChipProps) {
  return (
    <article className={cn("flex items-center gap-2", className)}>
      <div className="min-w-0 flex items-center gap-2">
        {icon ? (
          <span
            className={cn(
              "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border bg-card/60 text-muted-foreground",
              iconContainerClassName,
            )}
          >
            {renderIcon(icon, cn("h-3.5 w-3.5", iconClassName))}
          </span>
        ) : null}
        <p
          className={cn(
            "min-w-0 truncate text-[10px] uppercase tracking-[0.12em] text-muted-foreground",
            labelClassName,
          )}
        >
          {label}
        </p>
      </div>
      <p className={cn("ml-auto min-w-0 truncate text-right text-xs font-semibold text-foreground", valueClassName)}>
        {value}
      </p>
    </article>
  );
}
