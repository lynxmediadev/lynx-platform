export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

import { Button } from "@/components/ui/button";
import { TrackAnalyzeHeaderButtons } from "@/components/admin/AnalyzeActions";
import { TrackEditShell } from "@/components/admin/track/edit/TrackEditShell";
import { getTrackEditModuleNavItems } from "@/components/admin/track/edit/module-nav";
import { MetadataModuleForm } from "@/components/admin/track/edit/MetadataModuleForm";
import { TrackLicenseAssignmentsForm } from "@/components/admin/track/edit/TrackLicenseAssignmentsForm";
import { DeliveryFormatsForm } from "@/components/admin/track/edit/DeliveryFormatsForm";
import { getTrackMetadataPageData } from "@/server/track-edit/queries";

export default async function AdminTrackEditMetadataPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const metadataPageData = await getTrackMetadataPageData(id);

  if (!metadataPageData) {
    notFound();
  }

  const templateWhere: Prisma.LicenseTemplateWhereInput =
    metadataPageData.ownerUserId
      ? {
          OR: [
            { ownerUserId: metadataPageData.ownerUserId },
            { ownerUserId: null },
          ],
        }
      : { ownerUserId: null };
  const assignedTemplateIds = metadataPageData.licenseAssignments.map(
    (assignment) => assignment.licenseTemplateId,
  );

  const combinedWhere: Prisma.LicenseTemplateWhereInput =
    assignedTemplateIds.length > 0
      ? {
          OR: [templateWhere, { id: { in: assignedTemplateIds } }],
        }
      : templateWhere;

  const licenseTemplates = await prisma.licenseTemplate.findMany({
    where: combinedWhere,
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      sortOrder: true,
      isPopular: true,
      priceAmount: true,
      currency: true,
      formats: true,
    },
  });

  const modules = getTrackEditModuleNavItems(metadataPageData.id);

  return (
    <TrackEditShell
      title={metadataPageData.title}
      artist={metadataPageData.artist}
      trackId={metadataPageData.id}
      modules={modules}
      activeModuleId="metadata"
      headerActions={
        <>
          <TrackAnalyzeHeaderButtons
            id={metadataPageData.id}
            audioUrl={metadataPageData.audioUrl}
          />
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full text-xs sm:w-auto"
          >
            <Link href="/admin/tracks">Volver al listado</Link>
          </Button>
        </>
      }
    >
      <section className="border-border bg-card rounded-xl border p-4">
        <div className="border-border border-b pb-3">
          <p className="text-primary text-xs font-semibold tracking-[.14em] uppercase">
            Oferta comercial
          </p>
          <h2 className="mt-1 text-lg font-semibold">Licencias</h2>
          <p className="text-muted-foreground mt-1 max-w-3xl text-sm">
            Archivos define qué existe; Licencias define qué se ofrece y bajo
            qué condiciones. Esta pantalla no expone assets privados.
          </p>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <article className="border-border bg-background/40 rounded-lg border p-3">
            <p className="text-muted-foreground text-xs font-semibold tracking-[.12em] uppercase">
              Artist
            </p>
            <h3 className="mt-1 font-semibold">Artistas y canciones</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Una propuesta principal, simple y justa. Se configurará con las
              plantillas que correspondan a este track.
            </p>
          </article>
          <article className="border-border bg-background/40 rounded-lg border p-3">
            <p className="text-muted-foreground text-xs font-semibold tracking-[.12em] uppercase">
              Sync
            </p>
            <h3 className="mt-1 font-semibold">Publicidad y audiovisual</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Define alcance, territorios, exclusividad, restricciones y
              presupuesto para briefs profesionales.
            </p>
          </article>
        </div>
      </section>

      <MetadataModuleForm
        track={{
          id: metadataPageData.id,
          isrc: metadataPageData.isrc,
          iswc: metadataPageData.iswc,
          upc: metadataPageData.upc,
          licenseType: metadataPageData.licenseType,
          mediaBuy: metadataPageData.mediaBuy,
          exclusiveTerritories: metadataPageData.exclusiveTerritories ?? [],
          exclusiveTermMonths: metadataPageData.exclusiveTermMonths,
          restrictedTerritories: metadataPageData.restrictedTerritories ?? [],
          restrictedIndustries: metadataPageData.restrictedIndustries ?? [],
          restrictedPlatforms: metadataPageData.restrictedPlatforms ?? [],
          restrictedBrands: metadataPageData.restrictedBrands ?? [],
          restrictions: metadataPageData.restrictions ?? [],
          pricingTier: metadataPageData.pricingTier,
          budgetMin: metadataPageData.budgetMin,
          budgetMax: metadataPageData.budgetMax,
          budgetCurrency: metadataPageData.budgetCurrency,
        }}
      />

      <DeliveryFormatsForm
        trackId={metadataPageData.id}
        initialFormats={metadataPageData.deliveryFormats}
      />

      <TrackLicenseAssignmentsForm
        trackId={metadataPageData.id}
        templates={licenseTemplates}
        assignments={metadataPageData.licenseAssignments}
      />
    </TrackEditShell>
  );
}
