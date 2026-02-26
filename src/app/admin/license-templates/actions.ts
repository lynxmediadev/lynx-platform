"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAdminOrStaffAction } from "@/lib/account-auth/guards";
import {
  licenseTemplateFormSchema,
  parseCsvFormats,
  parseSummaryItemsJson,
  parseTermRowsJson,
  slugifyLicenseName,
} from "@/lib/licenses/schemas";

function parseOptionalInt(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== "string") return null;
  const normalized = raw.trim();
  if (!normalized) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return Math.round(value);
}

export async function upsertLicenseTemplateAction(formData: FormData): Promise<void> {
  try {
    await requireAdminOrStaffAction();

    const idValue = formData.get("id");
    const id = typeof idValue === "string" && idValue.trim().length > 0 ? idValue.trim() : undefined;
    const name = typeof formData.get("name") === "string" ? String(formData.get("name")) : "";
    const slugInput =
      typeof formData.get("slug") === "string" ? String(formData.get("slug")).trim() : "";
    const statusInput =
      typeof formData.get("status") === "string" ? String(formData.get("status")).trim() : "DRAFT";
    const sortOrderInput =
      typeof formData.get("sortOrder") === "string" ? String(formData.get("sortOrder")).trim() : "0";
    const currencyInput =
      typeof formData.get("currency") === "string" ? String(formData.get("currency")).trim() : "USD";
    const formatsCsv =
      typeof formData.get("formatsCsv") === "string" ? String(formData.get("formatsCsv")) : "";
    const summaryJsonText =
      typeof formData.get("summaryJson") === "string" ? String(formData.get("summaryJson")) : "";
    const termsJsonText =
      typeof formData.get("termsJson") === "string" ? String(formData.get("termsJson")) : "";
    const agreementText =
      typeof formData.get("agreementText") === "string" ? String(formData.get("agreementText")) : "";
    const notes = typeof formData.get("notes") === "string" ? String(formData.get("notes")) : "";
    const isPopular = formData.get("isPopular") === "on";
    const priceAmount = parseOptionalInt(formData.get("priceAmount"));
    const finalSlug = slugInput || slugifyLicenseName(name);

    const parsed = licenseTemplateFormSchema.safeParse({
      id,
      name,
      slug: finalSlug,
      status: statusInput,
      sortOrder: sortOrderInput,
      isPopular,
      priceAmount,
      currency: currencyInput,
      formats: parseCsvFormats(formatsCsv),
      summaryItems: parseSummaryItemsJson(summaryJsonText) ?? [],
      termRows: parseTermRowsJson(termsJsonText) ?? [],
      agreementText,
      notes,
    });

    if (!parsed.success) {
      console.error("[license-templates:upsert] validation:", parsed.error.flatten());
      return;
    }

    const data = parsed.data;
    if (data.id) {
      await prisma.licenseTemplate.update({
        where: { id: data.id },
        data: {
          name: data.name,
          slug: data.slug || slugifyLicenseName(data.name),
          status: data.status,
          sortOrder: data.sortOrder,
          isPopular: data.isPopular,
          priceAmount: data.priceAmount ?? null,
          currency: data.currency,
          formats: data.formats,
          summaryJson: data.summaryItems,
          termsMatrixJson: data.termRows,
          agreementText: data.agreementText,
          notes: data.notes || null,
        },
      });
    } else {
      await prisma.licenseTemplate.create({
        data: {
          name: data.name,
          slug: data.slug || slugifyLicenseName(data.name),
          status: data.status,
          sortOrder: data.sortOrder,
          isPopular: data.isPopular,
          priceAmount: data.priceAmount ?? null,
          currency: data.currency,
          formats: data.formats,
          summaryJson: data.summaryItems,
          termsMatrixJson: data.termRows,
          agreementText: data.agreementText,
          notes: data.notes || null,
        },
      });
    }

    revalidatePath("/admin/license-templates");
    return;
  } catch (error) {
    console.error("[license-templates:upsert] fatal:", error);
    return;
  }
}

export async function deleteLicenseTemplateAction(formData: FormData): Promise<void> {
  try {
    await requireAdminOrStaffAction();

    const idValue = formData.get("id");
    const id = typeof idValue === "string" ? idValue.trim() : "";
    if (!id) return;

    await prisma.licenseTemplate.delete({ where: { id } });
    revalidatePath("/admin/license-templates");
    return;
  } catch (error) {
    console.error("[license-templates:delete] fatal:", error);
    return;
  }
}
