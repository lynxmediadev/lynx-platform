"use client";

import * as React from "react";

import { updateMetadataModule } from "@/app/admin/track/actions/metadata";
import IdsForm from "@/components/admin/track/IdsForm";
import SyncMetaForm from "@/components/admin/track/SyncMetaForm";
import { ModuleSaveBar } from "@/components/admin/track/edit/ModuleSaveBar";

type UpdateMetadataResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export function MetadataModuleForm({
  track,
}: {
  track: {
    id: string;
    isrc: string | null;
    iswc: string | null;
    upc: string | null;
    licenseType: string | null;
    mediaBuy: string | null;
    exclusiveTerritories: string[];
    exclusiveTermMonths: number | null;
    restrictedTerritories: string[];
    restrictedIndustries: string[];
    restrictedPlatforms: string[];
    restrictedBrands: string[];
    restrictions: string[];
    pricingTier: string | null;
    budgetMin: number | null;
    budgetMax: number | null;
    budgetCurrency: string | null;
  };
}) {
  const [pending, setPending] = React.useState(false);
  const [status, setStatus] = React.useState<UpdateMetadataResult | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<
    Record<string, string[]>
  >({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    setFieldErrors({});

    try {
      const formData = new FormData(event.currentTarget);
      const result = await updateMetadataModule(formData);
      setStatus(result);
      setFieldErrors(result.fieldErrors ?? {});
    } catch (error) {
      console.error("[MetadataModuleForm] handleSubmit error:", error);
      setStatus({
        ok: false,
        message: "Error al guardar modulo Metadata.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-0 flex-1 flex-col gap-4"
    >
      <input type="hidden" name="id" value={track.id} />

      <div className="space-y-4">
        <IdsForm
          track={{
            isrc: track.isrc,
            iswc: track.iswc,
            upc: track.upc,
          }}
          fieldErrors={fieldErrors}
        />

        <div className="border-border/60 mt-2 border-t pt-2">
          <SyncMetaForm
            track={{
              licenseType: track.licenseType,
              mediaBuy: track.mediaBuy,
              exclusiveTerritories: track.exclusiveTerritories,
              exclusiveTermMonths: track.exclusiveTermMonths,
              restrictedTerritories: track.restrictedTerritories,
              restrictedIndustries: track.restrictedIndustries,
              restrictedPlatforms: track.restrictedPlatforms,
              restrictedBrands: track.restrictedBrands,
              restrictions: track.restrictions ?? [],
              pricingTier: track.pricingTier,
              budgetMin: track.budgetMin,
              budgetMax: track.budgetMax,
              budgetCurrency: track.budgetCurrency,
            }}
            fieldErrors={fieldErrors}
          />
        </div>
      </div>

      <ModuleSaveBar
        status={status}
        hint="Guarda identificadores y reglas comerciales del track."
        pending={pending}
        submitLabel="Guardar licencias"
      />
    </form>
  );
}
