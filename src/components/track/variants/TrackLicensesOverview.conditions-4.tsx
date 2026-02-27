// Variant snapshot: "conditions 4"
"use client";

import * as React from "react";
import {
  AudioLines,
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
  const snapshotRows = selected ? getLicenseSnapshotConditions(selected).slice(0, 8) : [];
  const conditionRows = Array.from({ length: Math.ceil(snapshotRows.length / 2) }, (_, rowIndex) => ({
    left: snapshotRows[rowIndex * 2],
    right: snapshotRows[rowIndex * 2 + 1],
  }));
  const visibleLicenses = licenses.slice(0, 6);
  const selectedFormats = selected?.formats.join(", ") || "Sin formatos";
  const selectedPrice = selected
    ? formatLicenseAmount(selected.priceAmount, selected.currency)
    : "A cotizar";

  return (
    <section className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/95">
          Licencias
        </h2>
        <span className="rounded border border-border bg-background/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {licenses.length} opción{licenses.length === 1 ? "" : "es"}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Resumen comercial rápido por licencia.</p>

      {licenses.length === 0 ? (
        <div className="mt-3 rounded border border-border bg-background/70 px-3 py-2 text-xs text-muted-foreground">
          No hay licencias configuradas para este track.
        </div>
      ) : (
        <div className="mt-2.5 grid gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="grid grid-cols-2 gap-1.5">
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
                      ? "border-foreground bg-background"
                      : "border-border bg-background/60 hover:border-foreground/70",
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
            <div className="flex items-start justify-between gap-3 border-b border-border px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {selected?.name || "Licencia"}
                </p>
                <p className="truncate text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {selectedFormats}
                </p>
              </div>
              <span className="shrink-0 rounded border border-border bg-card/80 px-2 py-0.5 text-sm font-semibold text-foreground">
                {selectedPrice}
              </span>
            </div>
            <div className="grid">
              {conditionRows.map((row, rowIndex) => {
                const LeftIcon = row.left ? iconForCondition(row.left.label) : null;
                const RightIcon = row.right ? iconForCondition(row.right.label) : null;
                return (
                  <article
                    key={`condition-row-${rowIndex}`}
                    className={cn(
                      "grid grid-cols-2",
                      rowIndex > 0 ? "border-t border-border/65" : "",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 px-3 py-2">
                      {row.left ? (
                        <>
                          <div className="min-w-0 flex items-center gap-2">
                            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border/80 bg-card/55 text-muted-foreground">
                              {LeftIcon ? <LeftIcon className="h-3 w-3" /> : null}
                            </span>
                            <p className="truncate text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                              {row.left.label}
                            </p>
                          </div>
                          <p className="truncate text-xs font-semibold text-foreground">{row.left.value}</p>
                        </>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between gap-2 border-l border-border/65 px-3 py-2">
                      {row.right ? (
                        <>
                          <div className="min-w-0 flex items-center gap-2">
                            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border/80 bg-card/55 text-muted-foreground">
                              {RightIcon ? <RightIcon className="h-3 w-3" /> : null}
                            </span>
                            <p className="truncate text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                              {row.right.label}
                            </p>
                          </div>
                          <p className="truncate text-xs font-semibold text-foreground">{row.right.value}</p>
                        </>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
