import type { TrackEditModuleNavItem } from "./TrackEditShell";

export type TrackEditModuleId =
  | "overview"
  | "creative"
  | "rights"
  | "metadata"
  | "deliverables"
  | "review"
  | "full";

export function getTrackEditModuleNavItems(
  trackId: string,
  options?: { includeFull?: boolean; disableAllExcept?: TrackEditModuleId[] },
): TrackEditModuleNavItem[] {
  const allow = options?.disableAllExcept ?? [];
  const disableAllExceptSet = new Set<TrackEditModuleId>(allow);
  const shouldDisable = (id: TrackEditModuleId) =>
    allow.length > 0 && !disableAllExceptSet.has(id);

  const items: TrackEditModuleNavItem[] = [
    { id: "overview", label: "Resumen", href: `/admin/tracks/${trackId}/edit` },
    {
      id: "creative",
      label: "Creativo",
      href: `/admin/tracks/${trackId}/edit/creative`,
      disabled: shouldDisable("creative"),
    },
    {
      id: "rights",
      label: "Derechos",
      href: `/admin/tracks/${trackId}/edit/rights`,
      disabled: shouldDisable("rights"),
    },
    {
      id: "metadata",
      label: "Metadata",
      href: `/admin/tracks/${trackId}/edit/metadata`,
      disabled: shouldDisable("metadata"),
    },
    {
      id: "deliverables",
      label: "Entregables",
      href: `/admin/tracks/${trackId}/edit/deliverables`,
      disabled: shouldDisable("deliverables"),
    },
    {
      id: "review",
      label: "Revisión",
      href: `/admin/tracks/${trackId}/edit/review`,
      disabled: shouldDisable("review"),
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
