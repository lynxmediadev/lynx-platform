import { z } from "zod";

export const CURRENCY_VALUES = ["CLP", "USD", "EUR"] as const;
export const LICENSE_TEMPLATE_STATUS_VALUES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

export const licenseSummaryItemSchema = z.object({
  label: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(220),
});

export const licenseTermRowSchema = z.object({
  label: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(220),
});

export const licenseSummaryArraySchema = z.array(licenseSummaryItemSchema).max(80);
export const licenseTermsArraySchema = z.array(licenseTermRowSchema).max(160);

export const licenseTemplateFormSchema = z.object({
  id: z.string().trim().optional(),
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido.")
    .max(120)
    .optional()
    .or(z.literal("")),
  status: z.enum(LICENSE_TEMPLATE_STATUS_VALUES),
  sortOrder: z.coerce.number().int().min(0).max(5000).default(0),
  isPopular: z.coerce.boolean().default(false),
  priceAmount: z.coerce.number().int().min(0).max(999999999).nullable().optional(),
  currency: z.enum(CURRENCY_VALUES).default("USD"),
  formats: z.array(z.string().trim().min(1).max(24)).max(8),
  summaryItems: licenseSummaryArraySchema,
  termRows: licenseTermsArraySchema,
  agreementText: z.string().trim().min(24),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
});

export const trackLicenseAssignmentRowSchema = z.object({
  templateId: z.string().trim().min(1),
  isEnabled: z.coerce.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(5000).default(0),
  priceOverride: z.coerce.number().int().min(0).max(999999999).nullable().optional(),
  summaryItems: licenseSummaryArraySchema.nullable().optional(),
  termRows: licenseTermsArraySchema.nullable().optional(),
  agreementText: z.string().trim().max(50000).nullable().optional(),
});

export const trackLicenseAssignmentFormSchema = z.object({
  trackId: z.string().trim().min(1),
  assignments: z.array(trackLicenseAssignmentRowSchema).max(24),
});

export function slugifyLicenseName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function parseJsonText(raw: string | null | undefined) {
  if (!raw) return null;
  const normalized = raw.trim();
  if (!normalized) return null;
  return JSON.parse(normalized);
}

export function parseSummaryItemsJson(raw: string | null | undefined) {
  const parsed = parseJsonText(raw);
  if (parsed === null) return null;
  return licenseSummaryArraySchema.parse(parsed);
}

export function parseTermRowsJson(raw: string | null | undefined) {
  const parsed = parseJsonText(raw);
  if (parsed === null) return null;
  return licenseTermsArraySchema.parse(parsed);
}

export function parseCsvFormats(raw: string | null | undefined) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 8);
}
