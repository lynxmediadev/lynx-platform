// src/lib/validation/trackSchemas.ts
/**
 * Esquemas Zod para formularios de Track (admin).
 *
 * Contiene:
 *  - creativeFormSchema  → /admin/tracks/[id]/edit (CreativeForm)
 *  - idsFormSchema       → /admin/tracks/[id]/edit (IdsForm)
 *  - rightsFormSchema    → /admin/tracks/[id]/edit (RightsFormClient)
 *
 * Peras y manzanas:
 * - Recibimos valores crudos desde FormData (strings, null, undefined).
 * - Normalizamos y validamos tipos (string, boolean, number, string[]).
 * - Devolvemos objetos listos para Prisma (o casi listos).
 */

import { z } from "zod";

// ───────────────────────────────────────────────────────────────────────────────
// Helpers de normalización (reutilizables en los esquemas)
// ───────────────────────────────────────────────────────────────────────────────

/** Normaliza string opcional → string | null (vacío o no-string → null) */
function normalizeText(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length ? trimmed : null;
}

/** Normaliza lista sin forzar mayúsculas (trim + únicos). */
function normalizeListRaw(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  return Array.from(
    new Set(
      raw
        .split(/[\n,]/g)
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    ),
  );
}

/** Normaliza ISRC a MAYÚSCULAS sin espacios ni guiones */
function normalizeIsrc(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.replace(/[-\s]/g, "").toUpperCase();
  return cleaned.length ? cleaned : null;
}

/**
 * Convierte textarea (o input con comas/saltos de línea) a string[]:
 * - Separa por saltos de línea y comas.
 * - trim().
 * - Filtra vacíos.
 * - Pasa a MAYÚSCULAS.
 * - Elimina duplicados.
 */
function normalizeList(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  return Array.from(
    new Set(
      raw
        .split(/[\n,]/g)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((s) => s.toUpperCase()),
    ),
  );
}

/** Normaliza moods manteniendo casing original (solo trim, separadores y únicos). */
function normalizeMoods(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  const parts = raw
    .split(/[\n,]/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => s.toUpperCase());
  const seen = new Set<string>();
  const result: string[] = [];
  for (const p of parts) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(p);
  }
  return result;
}

/** Normaliza checkbox HTML ("on"/true → true, cualquier otra cosa → false) */
function normalizeCheckbox(raw: unknown): boolean {
  if (raw === true) return true;
  if (typeof raw === "string") {
    const v = raw.toLowerCase();
    if (v === "on" || v === "true" || v === "1") return true;
  }
  return false;
}

/**
 * Normaliza número entero opcional:
 * - "", null, undefined → null
 * - "10" → 10
 * - valores no numéricos → null
 * (el rango 0–100 se valida en el esquema, no aquí)
 */
function normalizeNullableInt(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? Math.trunc(raw) : null;
  }
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

/** Normaliza número float opcional */
function normalizeNullableFloat(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? raw : null;
  }
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return n;
}

function normalizeEnum<T extends string>(
  raw: unknown,
  allowed: readonly T[],
): T | null {
  if (typeof raw !== "string") return null;
  const normalized = raw.trim().toUpperCase().replace(/\s+/g, "_");
  return (allowed as readonly string[]).includes(normalized)
    ? (normalized as T)
    : null;
}

function parseDurationToSec(raw: string | null): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(":").map((p) => Number(p));
  if (parts.some((p) => Number.isNaN(p))) return null;
  if (parts.length === 1) return Math.round(parts[0] ?? 0);
  if (parts.length === 2) {
    const [m, s] = parts as [number, number];
    return m * 60 + s;
  }
  if (parts.length === 3) {
    const [h, m, s] = parts as [number, number, number];
    return h * 3600 + m * 60 + s;
  }
  return null;
}

/**
 * Convierte textarea de restricciones en string[]:
 * - Una restricción por línea.
 * - trim().
 * - Filtra vacíos.
 */
function normalizeRestrictions(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// ───────────────────────────────────────────────────────────────────────────────
// 1) CreativeForm (título, artista, moods, uses)
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Schema base: coincide con los nombres crudos del FormData.
 * Luego .transform() devuelve el shape listo para Prisma.
 */
const creativeFormBaseSchema = z.object({
  // SI QUISIERA EL TÍTULO [NO OBLIGATORIO]
  //  title: z.union([z.string(), z.null(), z.undefined()]),

  title: z
    .string({
      required_error: "El Título es obligatorio.",
      invalid_type_error: "El Título debe ser texto.",
    })
    .min(1, "El Título es obligatorio."),
  artist: z
    .string({
      required_error: "El Artista / proyecto es obligatorio.",
      invalid_type_error: "El Artista / proyecto debe ser texto.",
    })
    .min(1, "El Artista / proyecto es obligatorio."),
  moods: z.union([z.string(), z.null(), z.undefined()]),
  uses: z.union([z.string(), z.null(), z.undefined()]),
});

export const creativeFormSchema = creativeFormBaseSchema.transform((values) => {
  return {
    title: values.title.trim(),
    artist: values.artist.trim(),
    moods: normalizeMoods(values.moods),
    uses: normalizeList(values.uses),
  };
});
// Aquí SOLO haces validaciones extra de moods/uses
// El superRefine puede quedar vacío, sólo basta con comentar los campos que no quiero como obligatorios.
// .superRefine((values, ctx) => {

// if (!values.moods || values.moods.length === 0) {
//   ctx.addIssue({
//     code: z.ZodIssueCode.custom,
//     message: "Debes ingresar al menos un mood.",
//     path: ["moods"],
//   });
// }

// if (!values.uses || values.uses.length === 0) {
//   ctx.addIssue({
//     code: z.ZodIssueCode.custom,
//     message: "Debes ingresar al menos un uso recomendado.",
//     path: ["uses"],
//   });
// }
// });

export type CreativeFormValues = z.infer<typeof creativeFormSchema>;

// ───────────────────────────────────────────────────────────────────────────────
// 2) IdsForm (ISRC, ISWC, UPC)
// ───────────────────────────────────────────────────────────────────────────────

const idsFormBaseSchema = z.object({
  // TÍTULO YA NO OBLIGATORIO
  // title: z.union([z.string(), z.null(), z.undefined()]),

  isrc: z.union([z.string(), z.null(), z.undefined()]),
  iswc: z.union([z.string(), z.null(), z.undefined()]),
  upc: z.union([z.string(), z.null(), z.undefined()]),
});

export const idsFormSchema = idsFormBaseSchema.transform((values) => {
  return {
    isrc: normalizeIsrc(values.isrc),
    iswc: normalizeText(values.iswc),
    upc: normalizeText(values.upc),
  };
});

export type IdsFormValues = z.infer<typeof idsFormSchema>;

// ───────────────────────────────────────────────────────────────────────────────
// 3) RightsFormClient (licencias, Content ID, restricciones, publishing)
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Schema base para RightsFormClient: coincide 1:1 con los nombres de los
 * <input>/<textarea> del formulario.
 *
 * Importante:
 * - `id` viene de un `<input type="hidden" name="id" />`.
 * - Los checkboxes vienen como "on" o no vienen.
 * - Las shares vienen como strings ("50", "25", etc.).
 */
const rightsFormBaseSchema = z.object({
  id: z.union([z.string(), z.number()]),

  mfn: z.union([z.string(), z.boolean(), z.null(), z.undefined()]),
  master: z.union([z.string(), z.null(), z.undefined()]),
  oneStop: z.union([z.string(), z.boolean(), z.null(), z.undefined()]),
  clearedForSync: z.union([z.string(), z.boolean(), z.null(), z.undefined()]),

  // Track: Content ID & administración
  contentIdEnrolled: z.union([
    z.string(),
    z.boolean(),
    z.null(),
    z.undefined(),
  ]),
  contentIdAdmin: z.union([z.string(), z.null(), z.undefined()]),
  contentIdWhitelist: z.union([z.string(), z.null(), z.undefined()]),
  // Publishing: lista serializada en JSON desde el UI
  publishingShares: z.union([z.string(), z.null(), z.undefined()]),
  // Master shares: lista serializada en JSON
  masterShares: z.union([z.string(), z.null(), z.undefined()]),
});

/**
 * Schema transformado:
 * - Normaliza strings (trim, vacío → null/"" según corresponda).
 * - Convierte checkboxes a boolean.
 * - Convierte restricciones a string[].
 * - Convierte shares a number | null y valida rango 0–100.
 *
 * NOTA: No obligamos a que los shares sumen 100, solo que estén en rango.
 */
export const rightsFormSchema = rightsFormBaseSchema.transform((values) => {
  let parsedShares: {
    role: string;
    name: string;
    sharePct: number | null;
    ipiNumber?: string | null;
    pro?: string | null;
    caeNumber?: string | null;
    sortOrder?: number | null;
  }[] = [];

  let parsedMasterShares: {
    name: string;
    sharePct: number | null;
    contact?: string | null;
    notes?: string | null;
    sortOrder?: number | null;
  }[] = [];

  if (
    typeof values.publishingShares === "string" &&
    values.publishingShares.trim() !== ""
  ) {
    try {
      const arr = JSON.parse(values.publishingShares);
      if (Array.isArray(arr)) {
        parsedShares = arr
          .map((s) => ({
            role: typeof s.role === "string" ? s.role : "",
            name: normalizeText(s.name) ?? "",
            sharePct: normalizeNullableInt(s.sharePct),
            ipiNumber: normalizeText(s.ipiNumber),
            pro: normalizeText(s.pro),
            caeNumber: normalizeText(s.caeNumber),
            sortOrder:
              typeof s.sortOrder === "number" && Number.isFinite(s.sortOrder)
                ? s.sortOrder
                : null,
          }))
          .filter((s) => s.name);
      }
    } catch {
      // si falla, dejamos lista vacía
    }
  }

  if (
    typeof values.masterShares === "string" &&
    values.masterShares.trim() !== ""
  ) {
    try {
      const arr = JSON.parse(values.masterShares);
      if (Array.isArray(arr)) {
        parsedMasterShares = arr
          .map((s) => ({
            name: normalizeText(s.name) ?? "",
            sharePct: normalizeNullableInt(s.sharePct),
            contact: normalizeText(s.contact),
            notes: normalizeText(s.notes),
            sortOrder:
              typeof s.sortOrder === "number" && Number.isFinite(s.sortOrder)
                ? s.sortOrder
                : null,
          }))
          .filter((s) => s.name);
      }
    } catch {
      // ignorar parse fail
    }
  }

  return {
    id: String(values.id),

    mfn: normalizeCheckbox(values.mfn),
    master: normalizeText(values.master),
    oneStop: normalizeCheckbox(values.oneStop),
    clearedForSync: normalizeCheckbox(values.clearedForSync),

    contentIdEnrolled: normalizeCheckbox(values.contentIdEnrolled),
    contentIdAdmin: normalizeText(values.contentIdAdmin),
    contentIdWhitelist: normalizeText(values.contentIdWhitelist),
    publishingShares: parsedShares,
    masterShares: parsedMasterShares,
  };
});

export type RightsFormValues = z.infer<typeof rightsFormSchema>;

// ───────────────────────────────────────────────────────────────────────────────
// 4) Sync metadata (BPM, key, géneros, exclusividad, pricing)
// ───────────────────────────────────────────────────────────────────────────────

const TRACK_TYPE_VALUES = [
  "INSTRUMENTAL",
  "VOCAL",
  "VOCAL_INSTRUMENTAL",
  "OTHER",
] as const;
const PRICING_TIER_VALUES = ["LOW", "MID", "HIGH", "BESPOKE"] as const;
const LICENSE_TYPE_VALUES = [
  "NON_EXCLUSIVE",
  "EXCLUSIVE",
  "LIMITED_EXCLUSIVE",
  "BUYOUT",
] as const;
const CURRENCY_VALUES = ["CLP", "USD", "EUR"] as const;

const syncMetaFormBaseSchema = z.object({
  id: z.union([z.string(), z.number()]),
  licenseType: z.union([z.string(), z.null(), z.undefined()]),
  mediaBuy: z.union([z.string(), z.null(), z.undefined()]),
  bpm: z.union([z.string(), z.number(), z.null(), z.undefined()]),
  key: z.union([z.string(), z.null(), z.undefined()]),
  trackType: z.union([z.string(), z.null(), z.undefined()]),
  genres: z.union([z.string(), z.null(), z.undefined()]),
  subgenres: z.union([z.string(), z.null(), z.undefined()]),
  exclusiveTerritories: z.union([z.string(), z.null(), z.undefined()]),
  exclusiveTermMonths: z.union([
    z.string(),
    z.number(),
    z.null(),
    z.undefined(),
  ]),
  restrictedTerritories: z.union([z.string(), z.null(), z.undefined()]),
  restrictedIndustries: z.union([z.string(), z.null(), z.undefined()]),
  restrictedPlatforms: z.union([z.string(), z.null(), z.undefined()]),
  restrictedBrands: z.union([z.string(), z.null(), z.undefined()]),
  restrictions: z.union([z.string(), z.null(), z.undefined()]),
  pricingTier: z.union([z.string(), z.null(), z.undefined()]),
  budgetMin: z.union([z.string(), z.number(), z.null(), z.undefined()]),
  budgetMax: z.union([z.string(), z.number(), z.null(), z.undefined()]),
  budgetCurrency: z.union([z.string(), z.null(), z.undefined()]),
});

export const syncMetaFormSchema = syncMetaFormBaseSchema.transform((values) => {
  return {
    id: String(values.id),
    licenseType: normalizeEnum(values.licenseType, LICENSE_TYPE_VALUES),
    mediaBuy: normalizeText(values.mediaBuy),
    bpm: normalizeNullableFloat(values.bpm),
    key: normalizeText(values.key),
    trackType: normalizeEnum(values.trackType, TRACK_TYPE_VALUES),
    genres: normalizeListRaw(values.genres),
    subgenres: normalizeListRaw(values.subgenres),
    exclusiveTerritories: normalizeList(values.exclusiveTerritories),
    exclusiveTermMonths: normalizeNullableInt(values.exclusiveTermMonths),
    restrictedTerritories: normalizeList(values.restrictedTerritories),
    restrictedIndustries: normalizeListRaw(values.restrictedIndustries),
    restrictedPlatforms: normalizeListRaw(values.restrictedPlatforms),
    restrictedBrands: normalizeListRaw(values.restrictedBrands),
    restrictions: normalizeRestrictions(values.restrictions),
    pricingTier: normalizeEnum(values.pricingTier, PRICING_TIER_VALUES),
    budgetMin: normalizeNullableInt(values.budgetMin),
    budgetMax: normalizeNullableInt(values.budgetMax),
    budgetCurrency: normalizeEnum(values.budgetCurrency, CURRENCY_VALUES),
  };
});

export type SyncMetaFormValues = z.infer<typeof syncMetaFormSchema>;

// ───────────────────────────────────────────────────────────────────────────────
// 5) Entregables (versiones y stems)
// ───────────────────────────────────────────────────────────────────────────────

const VERSION_KIND_VALUES = [
  "FULL",
  "CUTDOWN",
  "ALT_MIX",
  "INSTRUMENTAL",
  "VOCAL",
  "OTHER",
] as const;
const STEM_GROUP_VALUES = [
  "INSTRUMENT",
  "VOCAL",
  "FX",
  "PERCUSSION",
  "OTHER",
] as const;

function parseVersionLines(raw: string | null | undefined) {
  if (typeof raw !== "string") return [];
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.map((line, index) => {
    const [labelPart, durationPart, kindPart] = line
      .split("|")
      .map((part) => part.trim());
    return {
      label: labelPart || "(Sin título)",
      durationSec: parseDurationToSec(durationPart ?? null) ?? null,
      kind: normalizeEnum(kindPart ?? null, VERSION_KIND_VALUES),
      sortOrder: index,
    };
  });
}

function parseStemLines(raw: string | null | undefined) {
  if (typeof raw !== "string") return [];
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.map((line, index) => {
    const [namePart, groupPart] = line.split("|").map((part) => part.trim());
    return {
      name: namePart || "(Sin nombre)",
      group: normalizeEnum(groupPart ?? null, STEM_GROUP_VALUES),
      sortOrder: index,
    };
  });
}

const deliverablesFormBaseSchema = z.object({
  id: z.union([z.string(), z.number()]),
  versions: z.union([z.string(), z.null(), z.undefined()]),
  stems: z.union([z.string(), z.null(), z.undefined()]),
});

export const deliverablesFormSchema = deliverablesFormBaseSchema.transform(
  (values) => {
    return {
      id: String(values.id),
      versions: parseVersionLines(values.versions),
      stems: parseStemLines(values.stems),
    };
  },
);

export type DeliverablesFormValues = z.infer<typeof deliverablesFormSchema>;
