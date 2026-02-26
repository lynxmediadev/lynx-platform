"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdminOrStaffAction } from "@/lib/account-auth/guards";
import {
  parseSummaryItemsJson,
  parseTermRowsJson,
  trackLicenseAssignmentFormSchema,
} from "@/lib/licenses/schemas";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalInt(formData: FormData, key: string): number | null {
  const raw = readString(formData, key);
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed);
}

export async function updateTrackLicenseAssignmentsAction(formData: FormData): Promise<void> {
  try {
    await requireAdminOrStaffAction();

    const trackId = readString(formData, "trackId");
    const templateIdsRaw = formData.getAll("templateId");
    const templateIds = Array.from(
      new Set(
        templateIdsRaw
          .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
          .filter(Boolean),
      ),
    );

    if (!trackId) {
      return;
    }
    if (templateIds.length === 0) {
      await prisma.trackLicenseAssignment.deleteMany({ where: { trackId } });
      revalidatePath(`/admin/tracks/${trackId}/edit/metadata`);
      revalidatePath(`/track/${trackId}`);
      return;
    }

    const assignments = templateIds.map((templateId, index) => {
      const isEnabled = formData.get(`enabled:${templateId}`) === "on";
      const sortOrder = readOptionalInt(formData, `sortOrder:${templateId}`) ?? index;
      const priceOverride = readOptionalInt(formData, `priceOverride:${templateId}`);
      const summaryItems = parseSummaryItemsJson(readString(formData, `summaryJson:${templateId}`));
      const termRows = parseTermRowsJson(readString(formData, `termsJson:${templateId}`));
      const agreementTextRaw = readString(formData, `agreementText:${templateId}`);
      const agreementText = agreementTextRaw.length > 0 ? agreementTextRaw : null;

      return {
        templateId,
        isEnabled,
        sortOrder,
        priceOverride,
        summaryItems,
        termRows,
        agreementText,
      };
    });

    const parsed = trackLicenseAssignmentFormSchema.safeParse({
      trackId,
      assignments,
    });

    if (!parsed.success) {
      console.error(
        "[track-license-assignments:update] validation:",
        parsed.error.flatten(),
      );
      return;
    }

    const enabledCount = parsed.data.assignments.filter((row) => row.isEnabled).length;
    if (enabledCount > 6) {
      console.error("[track-license-assignments:update] max active licenses exceeded", {
        trackId,
        enabledCount,
      });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.trackLicenseAssignment.deleteMany({
        where: {
          trackId,
          licenseTemplateId: { notIn: templateIds },
        },
      });

      for (const row of parsed.data.assignments) {
        const hasOverride =
          row.priceOverride !== null ||
          row.summaryItems !== null ||
          row.termRows !== null ||
          ((row.agreementText ?? null) !== null && (row.agreementText ?? "").length > 0);

        if (!row.isEnabled && !hasOverride) {
          await tx.trackLicenseAssignment.deleteMany({
            where: {
              trackId,
              licenseTemplateId: row.templateId,
            },
          });
          continue;
        }

        await tx.trackLicenseAssignment.upsert({
          where: {
            trackId_licenseTemplateId: {
              trackId,
              licenseTemplateId: row.templateId,
            },
          },
          update: {
            isEnabled: row.isEnabled,
            sortOrder: row.sortOrder,
            priceOverride: row.priceOverride ?? null,
            summaryOverrideJson: row.summaryItems ?? Prisma.JsonNull,
            termsOverrideJson: row.termRows ?? Prisma.JsonNull,
            agreementOverrideText: row.agreementText ?? null,
          },
          create: {
            trackId,
            licenseTemplateId: row.templateId,
            isEnabled: row.isEnabled,
            sortOrder: row.sortOrder,
            priceOverride: row.priceOverride ?? null,
            summaryOverrideJson: row.summaryItems ?? Prisma.JsonNull,
            termsOverrideJson: row.termRows ?? Prisma.JsonNull,
            agreementOverrideText: row.agreementText ?? null,
          },
        });
      }
    });

    revalidatePath(`/admin/tracks/${trackId}/edit/metadata`);
    revalidatePath(`/admin/tracks/${trackId}/edit/full`);
    revalidatePath(`/track/${trackId}`);
    return;
  } catch (error) {
    console.error("[track-license-assignments:update] fatal:", error);
    return;
  }
}
