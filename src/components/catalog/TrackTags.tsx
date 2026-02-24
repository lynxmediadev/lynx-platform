import type { FC } from "react";

interface TagListProps {
  items: string[];
  variant?: "mood" | "use";
}

/**
 * Chips de tags usando la paleta del catálogo:
 * - Moods → acento principal (--lm-accent).
 * - Uses → neutro claro.
 *
 * Para cambiar colores globalmente, edita los tokens
 * en globals.css (bloque ODR Records – catálogo público).
 */
export const TagList: FC<TagListProps> = ({ items, variant = "mood" }) => {
  if (!items || items.length === 0) return null;

  const baseClasses =
    "inline-flex items-center justify-center text-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium leading-tight border";

  const moodClasses =
    "border-[color:var(--lm-accent)] bg-[var(--lm-accent-soft)] text-[var(--lm-text-main)]";
  const useClasses =
    "border-[color:var(--lm-surface-border)] bg-slate-50 text-[var(--lm-text-muted)]";

  const toneClasses = variant === "mood" ? moodClasses : useClasses;

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className={`${baseClasses} ${toneClasses}`}>
          {item}
        </span>
      ))}
    </div>
  );
};
