"use client";

import * as React from "react";
import { TagChips, type TagChip } from "@/components/ui/TagChips";
import useTagCatalog from "@/hooks/useTagCatalog";

/**
 * Wrapper para Categorías. Normaliza en Title Case y expone slug vía meta.
 */
export type CategoryChipsProps = {
  name?: string;
  initialCategories: { id?: string; name: string; slug?: string }[];
  error?: string | null;
  maxItems?: number;
  trackId?: string;
  initialCatalog?: { id?: string; name: string; slug: string }[];
  onSaved?: () => void;
  onSaveState?: (state: "saving" | "saved" | "error") => void;
};

const toUpper = (txt: string) => {
  const clean = txt.trim();
  if (!clean) return "";
  return clean.toUpperCase();
};

const slugify = (input: string) =>
  input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export function CategoryChips({
  name = "categories",
  initialCategories,
  error,
  maxItems = 15,
  trackId,
  initialCatalog = [],
  onSaved,
  onSaveState,
}: CategoryChipsProps) {
  const [saving, setSaving] = React.useState(false);
  const [selected, setSelected] = React.useState<TagChip[]>(
    initialCategories.map((c) => {
      const label = toUpper(c.name ?? "");
      return { id: c.id, label, value: label, meta: { slug: c.slug ?? label } };
    }),
  );

  const catalog = useTagCatalog({
    listUrl: "/api/categories",
    searchUrl: "/api/categories",
    createUrl: "/api/categories",
    deleteUrl: "/api/categories",
    saveUrl: "/api/tracks/:id/categories",
    normalizeLabel: (raw) => toUpper(raw),
    normalizeSlug: (raw) => slugify(raw),
    mapItem: (i: any) => {
      const name = toUpper((i?.name ?? i?.label ?? "").toString());
      const slug = (i?.slug ?? i?.value ?? name).toString();
      if (!name) return null as unknown as TagChip;
      return { id: i?.id, label: name, value: name, meta: { slug } };
    },
    buildCreateBody: (label) => ({ name: toUpper(label) }),
  });

  const normalize = React.useCallback((raw: string): TagChip | null => {
    const name = toUpper(raw);
    if (!name) return null;
    const slug = slugify(name);
    return { label: name, value: name, meta: { slug } };
  }, []);

  // Rehidrata desde la API al montar sólo si venimos sin datos SSR (evita parpadeo cuando ya hay asignados)
  const hasInitialCategories = initialCategories.length > 0;

  React.useEffect(() => {
    if (!trackId || hasInitialCategories) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/tracks/${trackId}/categories`);
        const data = await res.json().catch(() => null);
        const items = Array.isArray(data?.items) ? data.items : [];
        if (cancelled) return;
        const normalized = items.map((c: any) => {
          const label = toUpper(c.name ?? c.slug ?? "");
          const slug = c.slug ?? label;
          return { id: c.id, label, value: label, meta: { slug } };
        });
        setSelected(normalized);
      } catch (e) {
        console.error("[CategoryChips] initial fetch failed", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasInitialCategories, trackId]);

  return (
    <div className="space-y-2">
      <TagChips
        selected={selected}
        onChange={(chips) => setSelected(chips)}
        placeholder="Buscar categoría"
        toggleLabel="Categorías"
        defaultOpen
        showToggleButton={false}
        headingAssigned="Categorías asignadas"
        headingSuggestions="Sugerencias del catálogo"
        maxItems={maxItems}
        fetchSuggestions={catalog.fetchSuggestions}
        fetchAll={catalog.fetchAll}
        normalize={normalize}
        allowCreate
        onCreate={catalog.create}
        allowDeleteCatalog
        onDeleteCatalog={async (chip) => {
          const slug = (chip.meta as any)?.slug ?? chip.value ?? chip.label;
          const isAssigned = selected.some(
            (c) =>
              (
                (c.meta as { slug?: string } | undefined)?.slug ??
                c.value ??
                c.label
              ).toLowerCase() === slug.toLowerCase(),
          );
          if (isAssigned) return false;
          const res = await catalog.remove?.(chip.id ?? slug);
          return res?.ok ?? false;
        }}
        initialCatalogItems={initialCatalog.map((c) => {
          const label = toUpper(c.name);
          return { id: c.id, label, value: label, meta: { slug: c.slug } };
        })}
        renderAboveToggle={
          <div className="mb-1 flex w-full gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                if (!trackId) return;
                const slugs = selected
                  .map(
                    (c) =>
                      (c.meta as { slug?: string } | undefined)?.slug ??
                      c.label,
                  )
                  .map(slugify)
                  .filter(Boolean)
                  .sort();
                setSaving(true);
                onSaveState?.("saving");
                try {
                  const res = await catalog.saveSelection?.(trackId, slugs);
                  if (res?.ok) {
                    const payload = Array.isArray(res.data?.items)
                      ? res.data.items
                      : [];
                    const nextSelected =
                      payload.length > 0
                        ? payload.map((c: any) => {
                            const label = toUpper(c.name ?? c.slug ?? "");
                            const slug = c.slug ?? label;
                            return {
                              id: c.id,
                              label,
                              value: label,
                              meta: { slug },
                            };
                          })
                        : selected; // fallback optimista si API no devuelve items
                    setSelected(nextSelected);
                    onSaveState?.("saved");
                    onSaved?.();
                  } else {
                    onSaveState?.("error");
                    console.error("[CategoryChips] save failed", res);
                  }
                } catch {
                  onSaveState?.("error");
                } finally {
                  setSaving(false);
                }
              }}
              className="text-foreground hover:bg-foreground/10 dark:hover:bg-foreground/15 inline-flex h-7 w-full items-center justify-center rounded-md border border-current bg-transparent px-3 text-xs font-semibold transition-colors"
            >
              {saving ? "Guardando…" : "Guardar Categorías"}
            </button>
          </div>
        }
      />
      <input
        type="hidden"
        name={name}
        value={selected
          .map(
            (c) => (c.meta as { slug?: string } | undefined)?.slug ?? c.label,
          )
          .join("\n")}
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

export default CategoryChips;
