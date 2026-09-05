"use client";

import * as React from "react";
import { Check, ChevronDown, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildDummyBeatLeaseContract } from "@/lib/licenses/dummy-beat-lease-contract";
import { getLicenseMapRows } from "@/lib/licenses/license-view";
import { CompactSelectableCard } from "@/components/ui/compact-selectable-card";
import type {
  TrackLicenseDialogTab,
  TrackLicenseViewModel,
} from "@/lib/licenses/types";

type Props = {
  trackTitle: string;
  trackArtist: string;
  licenses: TrackLicenseViewModel[];
};

function formatCurrency(
  amount: number | null,
  currency: "CLP" | "USD" | "EUR",
) {
  if (amount === null || !Number.isFinite(amount)) return "A cotizar";
  try {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount)}`;
  }
}

export default function TrackLicensesDialog({
  trackTitle,
  trackArtist,
  licenses,
}: Props) {
  const [selectedLicenseId, setSelectedLicenseId] = React.useState<
    string | null
  >(licenses[0]?.id ?? null);
  const [tab, setTab] = React.useState<TrackLicenseDialogTab>("summary");
  const mapScrollRef = React.useRef<HTMLDivElement | null>(null);
  const [showMapScrollToBottom, setShowMapScrollToBottom] =
    React.useState(false);

  React.useEffect(() => {
    if (!licenses.length) {
      setSelectedLicenseId(null);
      return;
    }
    if (
      !selectedLicenseId ||
      !licenses.some((license) => license.id === selectedLicenseId)
    ) {
      setSelectedLicenseId(licenses[0]?.id ?? null);
    }
  }, [licenses, selectedLicenseId]);

  const selectedLicense =
    licenses.find((license) => license.id === selectedLicenseId) ??
    licenses[0] ??
    null;
  const mapRows = React.useMemo(
    () => (selectedLicense ? getLicenseMapRows(selectedLicense) : []),
    [selectedLicense],
  );
  const mapRowsSplit = React.useMemo(() => {
    if (mapRows.length === 0) return [[], []] as Array<typeof mapRows>;
    const midpoint = Math.ceil(mapRows.length / 2);
    return [mapRows.slice(0, midpoint), mapRows.slice(midpoint)];
  }, [mapRows]);
  const agreementText = selectedLicense
    ? selectedLicense.agreementText?.trim() ||
      buildDummyBeatLeaseContract({
        licenseName: selectedLicense.name,
        beatTitle: trackTitle,
        producerName: "ODR Records",
        artistName: trackArtist || "Artista",
        priceLabel: formatCurrency(
          selectedLicense.priceAmount,
          selectedLicense.currency,
        ),
        currencyLabel: selectedLicense.currency,
      })
    : "";

  const updateMapScrollButtonVisibility = React.useCallback(() => {
    const container = mapScrollRef.current;
    if (!container) {
      setShowMapScrollToBottom(false);
      return;
    }
    const canScroll = container.scrollHeight - container.clientHeight > 6;
    const atBottom =
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - 6;
    setShowMapScrollToBottom(canScroll && !atBottom);
  }, []);

  React.useEffect(() => {
    if (tab !== "summary") {
      setShowMapScrollToBottom(false);
      return;
    }
    const rafId = requestAnimationFrame(updateMapScrollButtonVisibility);
    return () => cancelAnimationFrame(rafId);
  }, [tab, selectedLicenseId, mapRows.length, updateMapScrollButtonVisibility]);

  const handleScrollMapToBottom = React.useCallback(() => {
    const container = mapScrollRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="border-foreground bg-foreground text-background flex h-10 w-full items-center justify-center rounded border px-4 text-sm font-semibold hover:opacity-90"
        >
          Ver Licencias
        </button>
      </DialogTrigger>

      <DialogContent className="odr-scrollbar border-border bg-background text-foreground max-h-[95vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Licencias disponibles</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {trackTitle} · {trackArtist}
          </DialogDescription>
        </DialogHeader>

        {licenses.length === 0 ? (
          <div className="border-border bg-card/60 text-muted-foreground rounded border p-4 text-sm">
            Este track aún no tiene licencias configuradas.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
              {licenses.map((license) => {
                const isActive = selectedLicense?.id === license.id;
                return (
                  <CompactSelectableCard
                    key={license.id}
                    title={license.name}
                    value={formatCurrency(
                      license.priceAmount,
                      license.currency,
                    )}
                    meta={license.formats.join(", ") || "Sin formatos"}
                    highlightLabel={license.isPopular ? "Popular" : null}
                    isActive={isActive}
                    onClick={() => setSelectedLicenseId(license.id)}
                  />
                );
              })}
            </div>

            <Tabs
              value={tab}
              onValueChange={(next) => setTab(next as TrackLicenseDialogTab)}
              className="border-border bg-card/40 h-[clamp(420px,64vh,640px)] rounded border p-3"
            >
              <TabsList className="bg-muted/80 h-9">
                <TabsTrigger value="summary" className="text-xs">
                  <Check className="h-4 w-4" />
                  Resumen
                </TabsTrigger>
                <TabsTrigger value="agreement" className="text-xs">
                  <FileText className="h-4 w-4" />
                  Contrato
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="summary"
                className="mt-3 min-h-0 overflow-hidden"
              >
                {selectedLicense ? (
                  mapRows.length > 0 ? (
                    <div className="relative h-full">
                      <div
                        ref={mapScrollRef}
                        onScroll={updateMapScrollButtonVisibility}
                        className="odr-scrollbar border-border bg-background/65 h-full overflow-x-hidden overflow-y-auto rounded border"
                      >
                        <div className="grid gap-3 p-2 md:grid-cols-2">
                          {mapRowsSplit.map((columnRows, columnIndex) =>
                            columnRows.length > 0 ? (
                              <div
                                key={`${selectedLicense.id}-map-column-${columnIndex}`}
                                className="border-border/80 bg-background/80 overflow-hidden rounded border"
                              >
                                <table className="w-full text-sm">
                                  <thead className="bg-muted/60 text-muted-foreground text-left text-[10px] tracking-[0.12em] uppercase">
                                    <tr>
                                      <th className="px-2.5 py-2">Variable</th>
                                      <th className="px-2.5 py-2">Condición</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {columnRows.map((row, rowIndex) => (
                                      <tr
                                        key={`${selectedLicense.id}-col-${columnIndex}-${row.label}-${rowIndex}`}
                                        className={`${
                                          rowIndex % 2 ? "bg-card/25" : ""
                                        } hover:bg-foreground/[0.04]`}
                                      >
                                        <td className="text-muted-foreground w-[42%] px-2.5 py-2 align-top text-[10px] font-medium tracking-[0.12em] [overflow-wrap:anywhere] break-words whitespace-normal uppercase">
                                          {row.label}
                                        </td>
                                        <td className="text-foreground px-2.5 py-2 align-top text-sm leading-snug font-semibold [overflow-wrap:anywhere] break-words whitespace-normal">
                                          {row.value}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : null,
                          )}
                        </div>
                      </div>

                      {showMapScrollToBottom ? (
                        <button
                          type="button"
                          onClick={handleScrollMapToBottom}
                          className="border-border bg-background/90 text-foreground hover:bg-accent absolute right-6 bottom-2 flex h-7 w-7 items-center justify-center rounded-full border"
                          aria-label="Ir al final del resumen"
                          title="Ir al final"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Sin mapa de términos para esta licencia.
                    </p>
                  )
                ) : null}
              </TabsContent>

              <TabsContent
                value="agreement"
                className="mt-3 min-h-0 overflow-hidden"
              >
                {selectedLicense ? (
                  <div className="odr-scrollbar border-border bg-background/80 h-full overflow-y-auto rounded border p-3">
                    <pre className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                      {agreementText ||
                        "Sin texto de contrato para esta licencia."}
                    </pre>
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
