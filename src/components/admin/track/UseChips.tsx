"use client";

import * as React from "react";
import { TagChips, type TagChip } from "@/components/ui/TagChips";
import useTagCatalog from "@/hooks/useTagCatalog";
import { slugify } from "@/lib/slugify";

/**
 * Wrapper para gestionar "Usos" con el mismo flujo de TagChips.
 * Normaliza en Title Case mínima (primera letra mayúscula, resto minúscula).
 */
export type UseChipsProps = {
  name?: string;
  initialUses: string[];
  initialCatalog?: { id: string; slug: string; name: string }[];
  error?: string | null;
  maxItems?: number;
  trackId: string;
  onSaved?: () => void;
  onSaveState?: (state: "saving" | "saved" | "error") => void;
};

const toTitleCase = (txt: string) => {
  const clean = txt.trim();
  if (!clean) return "";
  return clean.toUpperCase(); // Paridad con Moods (todo MAYÚSCULAS)
};

export function UseChips({
  name = "uses",
  initialUses,
  initialCatalog = [],
  error,
  maxItems = 15,
  trackId,
  onSaved,
  onSaveState,
}: UseChipsProps) {
  const [selected, setSelected] = React.useState<TagChip[]>(() =>
    initialUses.map((u) => {
      const label = toTitleCase(u);
      return { label, value: label, meta: { slug: slugify(label) } };
    }),
  );
  const [saving, setSaving] = React.useState(false);

  const catalog = useTagCatalog({
    listUrl: "/api/uses",
    searchUrl: "/api/uses",
    createUrl: "/api/uses",
    saveUrl: "/api/tracks/:id/uses",
    normalizeLabel: (raw) => toTitleCase(raw),
    normalizeSlug: (raw) => slugify(raw),
    mapItem: (i: any) => {
      const name = toTitleCase((i?.name ?? i?.label ?? "").toString());
      if (!name) return null as unknown as TagChip;
      return {
        id: i?.id,
        label: name,
        value: name,
        meta: { slug: slugify(name) },
      };
    },
    buildCreateBody: (label) => ({ name: toTitleCase(label) }),
    buildSaveBody: (values, normalizeLabel) => ({
      uses: values.map((v) => normalizeLabel(v)).filter(Boolean),
    }),
  });

  const normalize = React.useCallback((raw: string): TagChip | null => {
    const upper = toTitleCase(raw);
    if (!upper) return null;
    return { label: upper, value: upper, meta: { slug: slugify(upper) } };
  }, []);

  const persist = React.useCallback(
    async (chips: TagChip[]) => {
      const uses = chips.map((c) => toTitleCase(c.value ?? c.label));
      setSaving(true);
      onSaveState?.("saving");
      try {
        const res = await catalog.saveSelection?.(trackId, uses);
        const data = res?.data;
        if (res?.ok) {
          if (Array.isArray(data?.items)) {
            setSelected(
              data.items.map((item: any) => {
                const label = toTitleCase(item.name ?? item.slug ?? "");
                const slug = slugify(label);
                return { id: item.id, label, value: label, meta: { slug } };
              }),
            );
          }
          onSaveState?.("saved");
          onSaved?.();
        } else {
          onSaveState?.("error");
        }
      } catch {
        onSaveState?.("error");
      } finally {
        setSaving(false);
      }
    },
    [catalog, onSaved, onSaveState, trackId],
  );

  // Rehidrata al montar SOLO si no vino SSR (evita doble lista/parpadeo)
  React.useEffect(() => {
    if (!trackId) return;
    if ((initialUses?.length ?? 0) > 0) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/tracks/${trackId}/uses`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (Array.isArray(data?.items)) {
          const next: TagChip[] = data.items
            .map((item: any): TagChip => {
              const label = toTitleCase(item.name ?? item.slug ?? "");
              const slug = slugify(label);
              return { id: item.id, label, value: label, meta: { slug } };
            })
            .filter((c: TagChip) => Boolean(c.label));
          setSelected(next);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trackId, initialUses]);

  const handleChange = React.useCallback((chips: TagChip[]) => {
    setSelected(chips);
  }, []);

  return (
    <div className="space-y-2">
      <TagChips
        selected={selected}
        onChange={handleChange}
        placeholder="Buscar uso"
        toggleLabel="Usos"
        defaultOpen
        showToggleButton={false}
        maxItems={maxItems}
        headingAssigned="Usos asignados"
        headingSuggestions="Sugerencias del catálogo"
        fetchSuggestions={catalog.fetchSuggestions}
        fetchAll={catalog.fetchAll}
        normalize={normalize}
        allowCreate
        onCreate={catalog.create}
        allowDeleteCatalog
        onDeleteCatalog={async (chip) => {
          const payload: Record<string, string> = {};
          if (chip.id) payload.id = chip.id;
          else if (chip.value || chip.label)
            payload.name = (chip.value ?? chip.label) as string;
          else return false;
          const res = await fetch("/api/uses", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          return res.ok;
        }}
        initialCatalogItems={initialCatalog.map((item) => {
          const label = toTitleCase(item.name);
          return {
            id: item.id,
            label,
            value: label,
            meta: { slug: item.slug },
          };
        })}
        renderAboveToggle={
          <div className="mb-1 flex w-full gap-2">
            <button
              type="button"
              onClick={() => persist(selected)}
              disabled={saving}
              className="text-foreground hover:bg-foreground/10 dark:hover:bg-foreground/15 inline-flex h-7 w-full items-center justify-center rounded-md border border-current bg-transparent px-3 text-xs font-semibold transition-colors"
            >
              {saving ? "Guardando…" : "Guardar Usos"}
            </button>
          </div>
        }
      />
      <input
        type="hidden"
        name={name}
        value={selected.map((c) => c.label).join("\n")}
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

export default UseChips;
