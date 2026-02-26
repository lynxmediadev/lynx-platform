"use client";

import * as React from "react";
import { Check, FileText, Table2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TrackLicenseDialogTab, TrackLicenseViewModel } from "@/lib/licenses/types";

type Props = {
  trackTitle: string;
  trackArtist: string;
  licenses: TrackLicenseViewModel[];
};

function formatCurrency(amount: number | null, currency: "CLP" | "USD" | "EUR") {
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

export default function TrackLicensesDialog({ trackTitle, trackArtist, licenses }: Props) {
  const [selectedLicenseId, setSelectedLicenseId] = React.useState<string | null>(
    licenses[0]?.id ?? null,
  );
  const [tab, setTab] = React.useState<TrackLicenseDialogTab>("summary");

  React.useEffect(() => {
    if (!licenses.length) {
      setSelectedLicenseId(null);
      return;
    }
    if (!selectedLicenseId || !licenses.some((license) => license.id === selectedLicenseId)) {
      setSelectedLicenseId(licenses[0]?.id ?? null);
    }
  }, [licenses, selectedLicenseId]);

  const selectedLicense =
    licenses.find((license) => license.id === selectedLicenseId) ?? licenses[0] ?? null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded border border-foreground bg-foreground px-4 text-sm font-semibold text-background hover:opacity-90"
        >
          Ver licencias
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-background text-foreground sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Licencias disponibles</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {trackTitle} · {trackArtist}
          </DialogDescription>
        </DialogHeader>

        {licenses.length === 0 ? (
          <div className="rounded border border-border bg-card/60 p-4 text-sm text-muted-foreground">
            Este track aún no tiene licencias configuradas.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {licenses.map((license) => {
                const isActive = selectedLicense?.id === license.id;
                return (
                  <button
                    key={license.id}
                    type="button"
                    onClick={() => setSelectedLicenseId(license.id)}
                    className={`rounded border p-3 text-left transition ${
                      isActive
                        ? "border-foreground bg-foreground/10"
                        : "border-border bg-card/50 hover:border-foreground/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{license.name}</p>
                      {license.isPopular ? (
                        <span className="rounded border border-foreground/60 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-foreground">
                          Popular
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {formatCurrency(license.priceAmount, license.currency)}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      {license.formats.join(", ") || "Sin formatos"}
                    </p>
                  </button>
                );
              })}
            </div>

            <Tabs
              value={tab}
              onValueChange={(next) => setTab(next as TrackLicenseDialogTab)}
              className="rounded border border-border bg-card/40 p-3"
            >
              <TabsList className="h-9 bg-muted/80">
                <TabsTrigger value="summary" className="text-xs">
                  <Check className="h-4 w-4" />
                  Resumen
                </TabsTrigger>
                <TabsTrigger value="map" className="text-xs">
                  <Table2 className="h-4 w-4" />
                  Mapa completo
                </TabsTrigger>
                <TabsTrigger value="agreement" className="text-xs">
                  <FileText className="h-4 w-4" />
                  Contrato
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-3 space-y-2">
                {selectedLicense ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {selectedLicense.summaryItems.length > 0 ? (
                      selectedLicense.summaryItems.map((row) => (
                        <article key={`${selectedLicense.id}-${row.label}`} className="rounded border border-border bg-background/80 p-2.5">
                          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                            {row.label}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-foreground">{row.value}</p>
                        </article>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Sin resumen disponible para esta licencia.</p>
                    )}
                  </div>
                ) : null}
              </TabsContent>

              <TabsContent value="map" className="mt-3">
                {selectedLicense ? (
                  selectedLicense.termRows.length > 0 ? (
                    <div className="overflow-hidden rounded border border-border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/60 text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2">Variable</th>
                            <th className="px-3 py-2">Condición</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedLicense.termRows.map((row, index) => (
                            <tr
                              key={`${selectedLicense.id}-${row.label}-${index}`}
                              className={index % 2 ? "bg-card/30" : "bg-background/80"}
                            >
                              <td className="px-3 py-2 font-medium text-foreground">{row.label}</td>
                              <td className="px-3 py-2 text-foreground">{row.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin mapa de términos para esta licencia.</p>
                  )
                ) : null}
              </TabsContent>

              <TabsContent value="agreement" className="mt-3">
                {selectedLicense ? (
                  <div className="max-h-[45vh] overflow-y-auto rounded border border-border bg-background/80 p-3">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {selectedLicense.agreementText || "Sin texto de contrato para esta licencia."}
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
