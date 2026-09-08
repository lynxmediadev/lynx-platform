"use client";

import * as React from "react";
import FormField from "../ui/FormField";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import NumericSelectInput from "@/components/admin/ui/NumericSelectInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE_VALUE = "__NONE__";

type FieldErrors = Record<string, string[]>;

type SyncMetaFormProps = {
  track: {
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
  fieldErrors?: FieldErrors;
};

const LICENSE_TYPES = [
  { value: NONE_VALUE, label: "—" },
  { value: "NON_EXCLUSIVE", label: "No exclusiva" },
  { value: "EXCLUSIVE", label: "Exclusiva" },
  { value: "LIMITED_EXCLUSIVE", label: "Exclusiva limitada" },
  { value: "BUYOUT", label: "Buyout" },
];

const PRICING_TIERS = [
  { value: NONE_VALUE, label: "—" },
  { value: "LOW", label: "Low" },
  { value: "MID", label: "Mid" },
  { value: "HIGH", label: "High" },
  { value: "BESPOKE", label: "Bespoke" },
];

const CURRENCIES = [
  { value: NONE_VALUE, label: "—" },
  { value: "CLP", label: "CLP" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
];

function firstError(fieldErrors: FieldErrors | undefined, key: string) {
  if (!fieldErrors) return null;
  const arr = fieldErrors[key];
  return arr && arr.length > 0 ? arr[0] : null;
}

export default function SyncMetaForm({
  track,
  fieldErrors,
}: SyncMetaFormProps) {
  const serverErrors: FieldErrors = fieldErrors ?? {};
  const [exclusiveTermMonthsValue, setExclusiveTermMonthsValue] =
    React.useState(
      track.exclusiveTermMonths === null ||
        track.exclusiveTermMonths === undefined
        ? ""
        : String(track.exclusiveTermMonths),
    );
  const [budgetMinValue, setBudgetMinValue] = React.useState(
    track.budgetMin === null || track.budgetMin === undefined
      ? ""
      : String(track.budgetMin),
  );
  const [budgetMaxValue, setBudgetMaxValue] = React.useState(
    track.budgetMax === null || track.budgetMax === undefined
      ? ""
      : String(track.budgetMax),
  );
  const [licenseTypeValue, setLicenseTypeValue] = React.useState(
    track.licenseType ? track.licenseType : NONE_VALUE,
  );
  const [pricingTierValue, setPricingTierValue] = React.useState(
    track.pricingTier ? track.pricingTier : NONE_VALUE,
  );
  const [budgetCurrencyValue, setBudgetCurrencyValue] = React.useState(
    track.budgetCurrency ? track.budgetCurrency : NONE_VALUE,
  );

  const licenseTypeInputValue =
    licenseTypeValue === NONE_VALUE ? "" : licenseTypeValue;
  const pricingTierInputValue =
    pricingTierValue === NONE_VALUE ? "" : pricingTierValue;
  const budgetCurrencyInputValue =
    budgetCurrencyValue === NONE_VALUE ? "" : budgetCurrencyValue;

  const exclusiveTerritoriesDefault = (track.exclusiveTerritories ?? []).join(
    "\n",
  );
  const restrictedTerritoriesDefault = (track.restrictedTerritories ?? []).join(
    "\n",
  );
  const restrictedIndustriesDefault = (track.restrictedIndustries ?? []).join(
    "\n",
  );
  const restrictedPlatformsDefault = (track.restrictedPlatforms ?? []).join(
    "\n",
  );
  const restrictedBrandsDefault = (track.restrictedBrands ?? []).join("\n");
  const restrictionsDefault = (track.restrictions ?? []).join("\n");

  return (
    <div className="space-y-4">
      <div className="border-border border-b pb-3">
        <h2 className="text-foreground text-base font-semibold">
          Reglas para Sync
        </h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Alcance, exclusividad, restricciones y referencia de presupuesto para
          audiovisual.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border-border bg-card/80 space-y-3 rounded-lg border p-3">
          <h3 className="text-foreground text-sm font-semibold">
            Exclusividad y restricciones
          </h3>

          <div className="grid gap-3 md:grid-cols-2">
            <FormField
              htmlFor="licenseType"
              error={firstError(serverErrors, "licenseType")}
              label="Tipo de licencia"
              descriptionPosition="above"
              description="Define el tipo de licencia para este track."
            >
              <input
                type="hidden"
                name="licenseType"
                value={licenseTypeInputValue}
              />
              <Select
                value={licenseTypeValue}
                onValueChange={setLicenseTypeValue}
              >
                <SelectTrigger id="licenseType" className="w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              htmlFor="exclusiveTermMonths"
              error={firstError(serverErrors, "exclusiveTermMonths")}
              label="Plazo (meses)"
              descriptionPosition="above"
              description="Dejar vacío si no aplica."
            >
              <NumericSelectInput
                id="exclusiveTermMonths"
                name="exclusiveTermMonths"
                min={0}
                step={1}
                value={exclusiveTermMonthsValue}
                onChange={setExclusiveTermMonthsValue}
                className="w-full text-xs"
                placeholder="Ej: 12"
              />
            </FormField>

            <FormField
              htmlFor="mediaBuy"
              error={firstError(serverErrors, "mediaBuy")}
              label="Media buy / Paid media"
              descriptionPosition="above"
              description="Ej: Digital only, TV + Digital."
            >
              <Input
                id="mediaBuy"
                name="mediaBuy"
                type="text"
                defaultValue={track.mediaBuy ?? ""}
                className="w-full text-xs"
                placeholder="Ej: Digital only"
              />
            </FormField>

            <FormField
              htmlFor="exclusiveTerritories"
              error={firstError(serverErrors, "exclusiveTerritories")}
              label="Territorios permitidos"
              descriptionPosition="above"
              description="Uno por línea (códigos país o región)."
            >
              <Textarea
                id="exclusiveTerritories"
                name="exclusiveTerritories"
                defaultValue={exclusiveTerritoriesDefault}
                rows={3}
                className="w-full resize-y text-xs"
                placeholder="Ej: CL, US, LATAM"
              />
            </FormField>

            <FormField
              htmlFor="restrictedTerritories"
              error={firstError(serverErrors, "restrictedTerritories")}
              label="Territorios restringidos"
              descriptionPosition="above"
              description="Uno por línea."
            >
              <Textarea
                id="restrictedTerritories"
                name="restrictedTerritories"
                defaultValue={restrictedTerritoriesDefault}
                rows={3}
                className="w-full resize-y text-xs"
                placeholder="Ej: RU, CN"
              />
            </FormField>

            <FormField
              htmlFor="restrictedIndustries"
              error={firstError(serverErrors, "restrictedIndustries")}
              label="Industrias restringidas"
              descriptionPosition="above"
              description="Una por línea."
            >
              <Textarea
                id="restrictedIndustries"
                name="restrictedIndustries"
                defaultValue={restrictedIndustriesDefault}
                rows={3}
                className="w-full resize-y text-xs"
                placeholder="Ej: Gambling, Tobacco"
              />
            </FormField>

            <FormField
              htmlFor="restrictedPlatforms"
              error={firstError(serverErrors, "restrictedPlatforms")}
              label="Plataformas restringidas"
              descriptionPosition="above"
              description="Una por línea."
            >
              <Textarea
                id="restrictedPlatforms"
                name="restrictedPlatforms"
                defaultValue={restrictedPlatformsDefault}
                rows={3}
                className="w-full resize-y text-xs"
                placeholder="Ej: TV abierta, TikTok"
              />
            </FormField>

            <FormField
              htmlFor="restrictedBrands"
              error={firstError(serverErrors, "restrictedBrands")}
              label="Marcas restringidas"
              descriptionPosition="above"
              description="Una por línea."
            >
              <Textarea
                id="restrictedBrands"
                name="restrictedBrands"
                defaultValue={restrictedBrandsDefault}
                rows={3}
                className="w-full resize-y text-xs"
                placeholder="Ej: Marca A, Marca B"
              />
            </FormField>

            <FormField
              htmlFor="restrictions"
              error={firstError(serverErrors, "restrictions")}
              label="Restricciones adicionales"
              descriptionPosition="above"
              description="Texto libre, una restriccion por linea."
              className="md:col-span-2"
            >
              <Textarea
                id="restrictions"
                name="restrictions"
                defaultValue={restrictionsDefault}
                rows={4}
                className="w-full resize-y text-xs"
                placeholder="Ej: No usos politicos partidistas."
              />
            </FormField>
          </div>
        </div>
      </div>

      <div className="border-border bg-card/80 rounded-lg border p-3">
        <h3 className="text-foreground text-sm font-semibold">
          Referencia comercial Sync
        </h3>
        <div className="mt-2 grid gap-3 md:grid-cols-4">
          <FormField
            htmlFor="pricingTier"
            error={firstError(serverErrors, "pricingTier")}
            label="Pricing tier"
          >
            <input
              type="hidden"
              name="pricingTier"
              value={pricingTierInputValue}
            />
            <Select
              value={pricingTierValue}
              onValueChange={setPricingTierValue}
            >
              <SelectTrigger id="pricingTier" className="w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRICING_TIERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            htmlFor="budgetMin"
            error={firstError(serverErrors, "budgetMin")}
            label="Presupuesto mínimo"
          >
            <NumericSelectInput
              id="budgetMin"
              name="budgetMin"
              min={0}
              step={1}
              value={budgetMinValue}
              onChange={setBudgetMinValue}
              className="w-full text-xs"
              placeholder="Ej: 300"
            />
          </FormField>

          <FormField
            htmlFor="budgetMax"
            error={firstError(serverErrors, "budgetMax")}
            label="Presupuesto máximo"
          >
            <NumericSelectInput
              id="budgetMax"
              name="budgetMax"
              min={0}
              step={1}
              value={budgetMaxValue}
              onChange={setBudgetMaxValue}
              className="w-full text-xs"
              placeholder="Ej: 2000"
            />
          </FormField>

          <FormField
            htmlFor="budgetCurrency"
            error={firstError(serverErrors, "budgetCurrency")}
            label="Moneda"
          >
            <input
              type="hidden"
              name="budgetCurrency"
              value={budgetCurrencyInputValue}
            />
            <Select
              value={budgetCurrencyValue}
              onValueChange={setBudgetCurrencyValue}
            >
              <SelectTrigger id="budgetCurrency" className="w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </div>
    </div>
  );
}
