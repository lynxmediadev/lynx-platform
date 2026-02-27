"use client";

import * as React from "react";
import type { TrackLicenseViewModel } from "@/lib/licenses/types";
import {
  formatLicenseAmount,
  getLicenseSnapshotConditions,
} from "@/lib/licenses/license-view";
import { cn } from "@/lib/utils";

type Props = {
  licenses: TrackLicenseViewModel[];
};

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
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
              <p className="truncate text-sm font-semibold text-foreground">{selected?.name || "Licencia"}</p>
              <span className="rounded border border-border bg-card/80 px-2 py-0.5 text-sm font-semibold text-foreground">
                {selectedPrice}
              </span>
            </div>
            <div className="px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {selectedFormats}
            </div>

            <table className="w-full border-t border-border text-xs sm:text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="w-[42%] px-3 py-1.5 text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Condición
                  </th>
                  <th className="w-[58%] px-3 py-1.5 text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody>
                {snapshotRows.map((row, index) => (
                  <tr
                    key={`${row.label}-${index}`}
                    className={index % 2 === 0 ? "bg-background/70" : "bg-card/25"}
                  >
                    <td className="px-3 py-1.5 font-medium text-foreground">
                      {row.label}
                    </td>
                    <td className="px-3 py-1.5 text-foreground">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
