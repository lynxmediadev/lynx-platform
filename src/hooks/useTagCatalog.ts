import * as React from "react";
import type { TagChip } from "@/components/ui/TagChips";

type UseTagCatalogOptions = {
  listUrl: string;
  searchUrl?: string;
  createUrl?: string;
  deleteUrl?: string;
  saveUrl?: string; // opcional para guardar selección por track
  buildSaveBody?: (
    values: string[],
    normalizeLabel: (raw: string) => string,
  ) => any;
  headers?: Record<string, string>;
  mapItem?: (item: any) => TagChip;
  buildCreateBody?: (label: string) => any;
  normalizeLabel?: (raw: string) => string;
  normalizeSlug?: (raw: string) => string;
  onSaved?: (payload: any) => void;
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

const defaultNormalizeLabel = (raw: string) => raw.trim();
const defaultNormalizeSlug = (raw: string) => slugify(raw);

const defaultMapItem = (
  item: any,
  normalizeLabel: (raw: string) => string,
  normalizeSlug: (raw: string) => string,
): TagChip => {
  const name = normalizeLabel((item?.name ?? item?.label ?? "").toString());
  const slug = normalizeSlug(item?.slug ?? name);
  return {
    id: item?.id,
    label: name,
    value: name,
    meta: { slug },
  };
};

const defaultCreateBody = (
  label: string,
  normalizeLabel: (raw: string) => string,
) => ({
  name: normalizeLabel(label),
});

/**
 * Hook genérico para catálogos de chips (moods, usos, categorías).
 * Devuelve funciones de fetch y create listas para pasar a TagChips.
 * No mantiene estado de selección; solo encapsula acceso a API y mapeo.
 */
export function useTagCatalog(options: UseTagCatalogOptions) {
  const {
    listUrl,
    searchUrl,
    createUrl,
    deleteUrl,
    saveUrl,
    headers,
    mapItem,
    buildCreateBody,
    buildSaveBody,
    normalizeLabel = defaultNormalizeLabel,
    normalizeSlug = defaultNormalizeSlug,
    onSaved,
  } = options;

  const [loading, setLoading] = React.useState(false);

  const fetchAll = React.useCallback(async (): Promise<TagChip[]> => {
    const res = await fetch(listUrl, { headers });
    const data = await res.json().catch(() => ({}));
    const rawItems = Array.isArray(data)
      ? data
      : (data.items ?? data.moods ?? []);
    return (rawItems as any[])
      .map((it) =>
        mapItem
          ? mapItem(it)
          : defaultMapItem(it, normalizeLabel, normalizeSlug),
      )
      .filter(Boolean);
  }, [headers, listUrl, mapItem, normalizeLabel, normalizeSlug]);

  const fetchSuggestions = React.useCallback(
    async (query: string): Promise<TagChip[]> => {
      const q = query.trim();
      if (!q) return [];
      const url = searchUrl ?? listUrl;
      const sep = url.includes("?") ? "&" : "?";
      const res = await fetch(`${url}${sep}query=${encodeURIComponent(q)}`, {
        headers,
      });
      const data = await res.json().catch(() => ({}));
      const rawItems = Array.isArray(data)
        ? data
        : (data.items ?? data.moods ?? []);
      return (rawItems as any[])
        .map((it) =>
          mapItem
            ? mapItem(it)
            : defaultMapItem(it, normalizeLabel, normalizeSlug),
        )
        .filter(Boolean);
    },
    [headers, listUrl, mapItem, normalizeLabel, normalizeSlug, searchUrl],
  );

  const create = React.useCallback(
    async (label: string): Promise<TagChip | null> => {
      const clean = label.trim();
      if (!clean || !createUrl) return null;
      setLoading(true);
      try {
        const res = await fetch(createUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(headers ?? {}) },
          body: JSON.stringify(
            (buildCreateBody ?? defaultCreateBody)(clean, normalizeLabel),
          ),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return null;
        const payload = data.mood ?? data.item ?? data;
        return mapItem
          ? mapItem(payload)
          : defaultMapItem(payload, normalizeLabel, normalizeSlug);
      } catch {
        return null;
      } finally {
        setLoading(false);
      }
    },
    [
      buildCreateBody,
      createUrl,
      headers,
      mapItem,
      normalizeLabel,
      normalizeSlug,
    ],
  );

  return {
    loading,
    fetchAll,
    fetchSuggestions,
    create,
    remove: deleteUrl
      ? async (idOrSlug: string | undefined) => {
          if (!idOrSlug) return { ok: false };
          try {
            const res = await fetch(deleteUrl, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                ...(headers ?? {}),
              },
              body: JSON.stringify({ id: idOrSlug, slug: idOrSlug }),
            });
            return { ok: res.ok };
          } catch {
            return { ok: false };
          }
        }
      : undefined,
    saveSelection: saveUrl
      ? async (trackId: string | undefined, values: string[]) => {
          if (!trackId) return { ok: false };
          const cleaned = Array.from(
            new Set(values.map((v) => v.toString().trim()).filter(Boolean)),
          );
          const body = buildSaveBody
            ? buildSaveBody(cleaned, normalizeLabel)
            : {
                slugs: Array.from(
                  new Set(cleaned.map((s) => normalizeSlug(s)).filter(Boolean)),
                ),
              };
          const res = await fetch(saveUrl.replace(":id", trackId), {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(headers ?? {}) },
            body: JSON.stringify(body),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && onSaved) onSaved(data);
          return { ok: res.ok, data };
        }
      : undefined,
  };
}

export default useTagCatalog;
