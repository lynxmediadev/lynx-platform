import type { TrackEditModuleNavItem } from "./TrackEditShell";

export type TrackEditModuleId = "creative" | "assets" | "rights" | "metadata" | "full";

export function getTrackEditModuleNavItems(
  trackId: string,
  options?: { includeFull?: boolean; disableAllExcept?: TrackEditModuleId[] },
): TrackEditModuleNavItem[] {
  const allow = options?.disableAllExcept ?? [];
  const disableAllExceptSet = new Set<TrackEditModuleId>(allow);
  const shouldDisable = (id: TrackEditModuleId) =>
    allow.length > 0 && !disableAllExceptSet.has(id);

  const items: TrackEditModuleNavItem[] = [
    {
      id: "creative",
      label: "Ficha",
      href: `/admin/tracks/${trackId}/edit/creative`,
      disabled: shouldDisable("creative"),
    },
    { id: "assets", label: "Archivos", href: `/admin/tracks/${trackId}/edit/assets`, disabled: shouldDisable("assets") },
    {
      id: "metadata",
      label: "Licencias",
      href: `/admin/tracks/${trackId}/edit/metadata`,
      disabled: shouldDisable("metadata"),
    },
    {
      id: "rights",
      label: "Derechos",
      href: `/admin/tracks/${trackId}/edit/rights`,
      disabled: shouldDisable("rights"),
    },
  ];

  if (options?.includeFull) {
    items.push({
      id: "full",
      label: "Vista completa",
      href: `/admin/tracks/${trackId}/edit/full`,
      disabled: shouldDisable("full"),
    });
  }

  return items;
}
