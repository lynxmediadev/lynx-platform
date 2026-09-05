"use client";

import * as React from "react";
import { TagChips, type TagChip } from "@/components/ui/TagChips";
import useTagCatalog from "@/hooks/useTagCatalog";
import { slugify } from "@/lib/slugify";

type Props = {
  name?: string;
  initialMoods: string[];
  initialCatalog?: { id: string; slug: string; name: string }[];
  error?: string | null;
  trackId: string;
  onSaved?: () => void;
  onSaveState?: (state: "saving" | "saved" | "error") => void;
};

export function MoodChips({
  name = "moods",
  initialMoods,
  initialCatalog = [],
  error,
  trackId,
  onSaved,
  onSaveState,
}: Props) {
  const [selected, setSelected] = React.useState<TagChip[]>(() =>
    initialMoods.map((m) => {
      const label = m.toUpperCase();
      return { label, value: label, meta: { slug: slugify(label) } };
    }),
  );
  const [saving, setSaving] = React.useState(false);

  const catalog = useTagCatalog({
    listUrl: "/api/moods",
    searchUrl: "/api/moods",
    createUrl: "/api/moods",
    saveUrl: "/api/tracks/:id/moods",
    normalizeLabel: (raw) => raw.trim().toUpperCase(),
    normalizeSlug: (raw) => slugify(raw),
    mapItem: (m: any) => {
      const name = (m?.name ?? "").toString().trim();
      const upper = name.toUpperCase();
      if (!upper) return null as unknown as TagChip;
      return {
        id: m?.id,
        label: upper,
        value: upper,
        meta: { slug: slugify(upper) },
      };
    },
    buildCreateBody: (label) => ({ name: label.toUpperCase().trim() }),
    buildSaveBody: (values, normalizeLabel) => ({
      moods: values.map((v) => normalizeLabel(v)).filter(Boolean),
    }),
  });

  const normalize = React.useCallback((raw: string): TagChip | null => {
    const clean = raw.trim();
    if (!clean) return null;
    const upper = clean.toUpperCase();
    return { label: upper, value: upper, meta: { slug: slugify(upper) } };
  }, []);

  const persist = React.useCallback(
    async (chips: TagChip[]) => {
      const moods = chips.map((c) => (c.value ?? c.label).toUpperCase());
      setSaving(true);
      onSaveState?.("saving");
      try {
        const res = await catalog.saveSelection?.(trackId, moods);
        const data = res?.data;
        if (res?.ok) {
          if (Array.isArray(data?.items)) {
            setSelected(
              data.items.map((item: any) => {
                const label = (item.name ?? item.slug ?? "")
                  .toString()
                  .toUpperCase();
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

  // Rehidrata al montar SOLO si no vino SSR (para evitar parpadeo/doble lista)
  React.useEffect(() => {
    if (!trackId) return;
    if ((initialMoods?.length ?? 0) > 0) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/tracks/${trackId}/moods`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (Array.isArray(data?.items)) {
          const next: TagChip[] = data.items
            .map((item: any): TagChip => {
              const label = (item.name ?? item.slug ?? "")
                .toString()
                .toUpperCase();
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
  }, [trackId, initialMoods]);

  const handleChange = React.useCallback((chips: TagChip[]) => {
    setSelected(chips);
  }, []);

  return (
    <div className="space-y-2">
      <TagChips
        selected={selected}
        onChange={handleChange}
        placeholder="Buscar mood"
        toggleLabel="Moods"
        defaultOpen
        showToggleButton={false}
        maxItems={10}
        headingAssigned="Moods asignados"
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
          const res = await fetch("/api/moods", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          return res.ok;
        }}
        initialCatalogItems={initialCatalog.map((item) => {
          const label = item.name.toUpperCase();
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
              {saving ? "Guardando…" : "Guardar Moods"}
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
