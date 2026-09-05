// Variant snapshot: "conditions 2"
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
  const [selectedId, setSelectedId] = React.useState<string | null>(
    licenses[0]?.id ?? null,
  );

  React.useEffect(() => {
    if (!licenses.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !licenses.some((license) => license.id === selectedId)) {
      setSelectedId(licenses[0]?.id ?? null);
    }
  }, [licenses, selectedId]);

  const selected =
    licenses.find((license) => license.id === selectedId) ??
    licenses[0] ??
    null;
  const snapshotRows = selected ? getLicenseSnapshotConditions(selected) : [];
  const visibleLicenses = licenses.slice(0, 6);
  const selectedFormats = selected?.formats.join(", ") || "Sin formatos";
  const selectedPrice = selected
    ? formatLicenseAmount(selected.priceAmount, selected.currency)
    : "A cotizar";

  return (
    <section className="mt-2 w-full">
      <div className="border-border/70 flex flex-wrap items-center gap-2 border-b pb-2">
        <h2 className="text-foreground text-lg font-bold tracking-[0.16em] uppercase">
          Licencias
        </h2>
        <span aria-hidden className="text-muted-foreground text-xs">
          ·
        </span>
        <span className="border-border bg-background/70 text-muted-foreground rounded border px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase">
          {licenses.length} {licenses.length === 1 ? "opción" : "opciones"}
        </span>
      </div>
      {licenses.length === 0 ? (
        <div className="border-border bg-background/70 text-muted-foreground mt-3 rounded border px-3 py-2 text-xs">
          No hay licencias configuradas para este track.
        </div>
      ) : (
        <>
          <p className="text-muted-foreground mt-2 text-xs">
            Selecciona una opción para comparar precio, formatos y condiciones
            principales.
          </p>

          <div className="mt-2.5 grid gap-3 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)] lg:items-stretch">
            <div className="grid content-start gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
              {visibleLicenses.map((license) => {
                const isActive = selected?.id === license.id;
                return (
                  <button
                    key={`license-slot-${license.id}`}
                    type="button"
                    onClick={() => setSelectedId(license.id)}
                    className={cn(
                      "min-h-[74px] rounded border px-3 py-2.5 text-left transition duration-300",
                      isActive
                        ? "border-foreground bg-card/85"
                        : "border-border bg-card/15 hover:border-foreground/70 hover:bg-card/70",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-foreground truncate text-xs font-semibold sm:text-sm">
                        {license.name}
                      </p>
                      {license.isPopular ? (
                        <span className="border-foreground/50 text-foreground rounded border px-1 py-0.5 text-[9px] tracking-[0.12em] uppercase">
                          Top
                        </span>
                      ) : null}
                    </div>
                    <p className="text-foreground mt-1 text-sm font-semibold">
                      {formatLicenseAmount(
                        license.priceAmount,
                        license.currency,
                      )}
                    </p>
                    <p className="text-muted-foreground mt-1 truncate text-[10px] tracking-[0.12em] uppercase">
                      {license.formats.join(", ") || "Sin formatos"}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="border-border bg-background/70 rounded border">
              <div className="border-border flex flex-wrap items-center gap-2 border-b px-3 py-2">
                <p className="text-foreground truncate text-sm font-semibold">
                  {selected?.name || "Licencia"}
                </p>
                <span aria-hidden className="text-muted-foreground text-xs">
                  ·
                </span>
                <span className="border-border bg-card/80 text-foreground rounded border px-2 py-0.5 text-xs font-semibold">
                  {selectedPrice}
                </span>
              </div>
              <div className="text-muted-foreground px-3 py-1.5 text-[11px] tracking-[0.12em] uppercase">
                <span className="font-bold">Formatos · </span>
                {selectedFormats}
              </div>

              <div className="border-border grid auto-rows-fr gap-1.5 border-t p-1.5 sm:grid-cols-2">
                {snapshotRows.slice(0, 4).map((row, index) => {
                  const Icon = iconForCondition(row.label);
                  return (
                    <InfoChip
                      key={`${row.label}-${index}`}
                      icon={Icon}
                      label={row.label}
                      value={row.value}
                      className="border-border/70 bg-background/80 h-full justify-between rounded border px-3 py-2.5"
                    />
                  );
                })}
                {snapshotRows.length > 4 ? (
                  <p className="text-muted-foreground col-span-full px-2 py-1 text-center text-xs">
                    +{snapshotRows.length - 4} condiciones disponibles en “Ver
                    licencias”.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
