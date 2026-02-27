// Variant snapshot: "conditions 2"
"use client";

import * as React from "react";
import {
  AudioLines,
  ArrowDown,
  Disc3,
  Film,
  Radio,
  Video,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { TrackLicenseViewModel } from "@/lib/licenses/types";
import {
  formatLicenseAmount,
  getLicenseSnapshotConditions,
} from "@/lib/licenses/license-view";
import { InfoChip } from "@/components/ui/info-chip";
import { cn } from "@/lib/utils";

type Props = {
  licenses: TrackLicenseViewModel[];
};

function iconForCondition(label: string): LucideIcon {
  const key = label.toLowerCase();
  if (key.includes("copias")) return Disc3;
  if (key.includes("audio")) return AudioLines;
  if (key.includes("video streams")) return Video;
  if (key.includes("videos monetizados")) return Film;
  if (key.includes("presentaciones")) return Waves;
  if (key.includes("broadcast")) return Radio;
  return Disc3;
}

export default function TrackLicensesOverview({ licenses }: Props) {
  const [selectedId, setSelectedId] = React.useState<string | null>(licenses[0]?.id ?? null);

  React.useEffect(() => {
    if (!licenses.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !licenses.some((license) => license.id === selectedId)) {
      setSelectedId(licenses[0]?.id ?? null);
    }
  }, [licenses, selectedId]);

  const selected = licenses.find((license) => license.id === selectedId) ?? licenses[0] ?? null;
  const snapshotRows = selected ? getLicenseSnapshotConditions(selected) : [];
  const visibleLicenses = licenses.slice(0, 6);
  const selectedFormats = selected?.formats.join(", ") || "Sin formatos";
  const selectedPrice = selected
    ? formatLicenseAmount(selected.priceAmount, selected.currency)
    : "A cotizar";

  return (
    <section className="mt-2 w-full">
      <div className="flex flex-wrap items-center gap-2 border-b border-border/70 pb-2">
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-foreground">
          Licencias
        </h2>
        <span aria-hidden className="text-xs text-muted-foreground">
          ·
        </span>
        <span className="rounded border border-border bg-background/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {licenses.length} {licenses.length === 1 ? "opción" : "opciones"}
        </span>
      </div>
      {licenses.length === 0 ? (
        <div className="mt-3 rounded border border-border bg-background/70 px-3 py-2 text-xs text-muted-foreground">
          No hay licencias configuradas para este track.
        </div>
      ) : (
        <>
          <div className="mt-2 grid gap-3 lg:grid-cols-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <p>Selecciona un tipo de licencia para revisar su alcance y términos base.</p>
              <ArrowDown className="h-3 w-3 shrink-0 text-muted-foreground/80" aria-hidden />
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <p>Condiciones principales de la licencia seleccionada.</p>
              <ArrowDown className="h-3 w-3 shrink-0 text-muted-foreground/80" aria-hidden />
            </div>
          </div>

          <div className="mt-2.5 grid gap-3 lg:grid-cols-2 lg:items-stretch">
            <div className="grid grid-cols-2 content-start gap-1.5 self-start">
              {visibleLicenses.map((license) => {
                const isActive = selected?.id === license.id;
                return (
                  <button
                    key={license.id}
                    type="button"
                    onClick={() => setSelectedId(license.id)}
                  className={cn(
                    "rounded border px-2.5 py-2 text-left transition",
                    isActive
                      ? "border-foreground bg-card/85"
                      : "border-border bg-card/35 hover:border-foreground/70 hover:bg-card/70",
                  )}
                >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-semibold text-foreground sm:text-sm">
                        {license.name}
                      </p>
                      {license.isPopular ? (
                        <span className="rounded border border-foreground/50 px-1 py-0.5 text-[9px] uppercase tracking-[0.12em] text-foreground">
                          Top
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {formatLicenseAmount(license.priceAmount, license.currency)}
                    </p>
                    <p className="mt-1 truncate text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      {license.formats.join(", ") || "Sin formatos"}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="rounded border border-border bg-background/70">
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
              <p className="truncate text-sm font-semibold text-foreground">{selected?.name || "Licencia"}</p>
              <span aria-hidden className="text-xs text-muted-foreground">
                ·
              </span>
              <span className="rounded border border-border bg-card/80 px-2 py-0.5 text-xs font-semibold text-foreground">
                {selectedPrice}
              </span>
            </div>
              <div className="px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {selectedFormats}
              </div>

              <div className="grid auto-rows-fr gap-1.5 border-t border-border p-1.5 sm:grid-cols-2">
                {snapshotRows.map((row, index) => {
                  const Icon = iconForCondition(row.label);
                  return (
                    <InfoChip
                      key={`${row.label}-${index}`}
                      icon={Icon}
                      label={row.label}
                      value={row.value}
                      className="h-full justify-between rounded border border-border/70 bg-background/80 px-3 py-2.5"
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
