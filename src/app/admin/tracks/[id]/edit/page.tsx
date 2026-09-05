// src/app/admin/tracks/[id]/edit/page.tsx
/**
 * Editor modular de track (admin) - Overview
 *
 * Ruta:
 *   - /admin/tracks/[id]/edit
 *
 * Esta vista es el panel de control del editor modular.
 * Cada modulo se edita en su subruta y existe una vista completa temporal en /full.
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { TrackAnalyzeHeaderButtons } from "@/components/admin/AnalyzeActions";
import { DeleteTrackButton } from "@/components/admin/track/DeleteTrackButton.client";
import { deleteObjectFromS3 } from "@/lib/storage/delete-object";
import { TrackEditShell } from "@/components/admin/track/edit/TrackEditShell";
import { getTrackOverviewPageData } from "@/server/track-edit/queries";
import { getTrackEditModuleNavItems } from "@/components/admin/track/edit/module-nav";

type ModuleStatus = "ok" | "warning" | "info";

function StatusChip({ status, text }: { status: ModuleStatus; text: string }) {
  const style =
    status === "ok"
      ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-300"
      : status === "warning"
        ? "border-amber-500/35 bg-amber-500/10 text-amber-300"
        : "border-border bg-muted/30 text-muted-foreground";

  return (
    <span
      className={`inline-flex h-6 items-center rounded-md border px-2 text-[11px] font-medium ${style}`}
    >
      {text}
    </span>
  );
}

function ModuleCard({
  title,
  description,
  href,
  status,
  statusText,
  details,
}: {
  title: string;
  description: string;
  href: string;
  status: ModuleStatus;
  statusText: string;
  details: string[];
}) {
  return (
    <article className="border-border bg-card/50 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-foreground text-sm font-semibold">{title}</h2>
          <p className="text-muted-foreground mt-1 text-xs">{description}</p>
        </div>
        <StatusChip status={status} text={statusText} />
      </div>

      <ul className="mt-3 space-y-1">
        {details.map((detail) => (
          <li key={detail} className="text-muted-foreground text-xs">
            {detail}
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <Button asChild size="sm" variant="outline" className="text-xs">
          <Link href={href}>Editar modulo</Link>
        </Button>
      </div>
    </article>
  );
}

export default async function AdminTrackEditOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const trackOverview = await getTrackOverviewPageData(id);
  if (!trackOverview) {
    notFound();
  }

  const assignedMoods =
    trackOverview.tags
      ?.filter((t) => t.tag.type === "MOOD")
      .map((c) => c.tag.name) ?? [];
  const assignedUses =
    trackOverview.tags
      ?.filter((t) => t.tag.type === "USE")
      .map((c) => c.tag.name) ?? [];
  const assignedCategories =
    trackOverview.tags
      ?.filter((t) => t.tag.type === "CATALOG")
      .map((c) => ({ id: c.tag.id, slug: c.tag.slug, name: c.tag.name })) ?? [];

  const writerTotal = trackOverview.publishingShares
    .filter((item) => item.role === "WRITER")
    .reduce((sum, item) => sum + Number(item.sharePct || 0), 0);
  const publisherTotal = trackOverview.publishingShares
    .filter((item) => item.role === "PUBLISHER")
    .reduce((sum, item) => sum + Number(item.sharePct || 0), 0);
  const masterTotal = trackOverview.masterShares.reduce(
    (sum, item) => sum + Number(item.sharePct || 0),
    0,
  );

  const rightsStatus: ModuleStatus =
    writerTotal === 100 && publisherTotal === 100 && masterTotal === 100
      ? "ok"
      : "warning";

  const idFilledCount = [
    trackOverview.isrc,
    trackOverview.iswc,
    trackOverview.upc,
  ].filter(
    (value) => typeof value === "string" && value.trim().length > 0,
  ).length;

  const modules = getTrackEditModuleNavItems(trackOverview.id);

  async function deleteTrackAction(formData: FormData) {
    "use server";

    const idFromForm = formData.get("id");
    const assetKey = (formData.get("assetKey") as string | null) || null;
    const coverUrl = (formData.get("coverUrl") as string | null) || null;

    if (!idFromForm || typeof idFromForm !== "string") {
      console.error(
        "[track:edit:deleteTrackAction] id invalido en FormData",
        idFromForm,
      );
      return;
    }

    try {
      await prisma.track.delete({
        where: { id: idFromForm },
      });

      const r2Result = await deleteObjectFromS3(assetKey);
      console.log("[track:edit:deleteTrackAction] deleteObjectFromS3", {
        assetKey,
        coverUrl,
        result: r2Result,
      });
    } catch (err) {
      console.error("[track:edit:deleteTrackAction] fatal:", err, {
        idFromForm,
        assetKey,
        coverUrl,
      });
      return;
    }

    revalidatePath("/admin/tracks");
    redirect("/admin/tracks");
  }

  return (
    <TrackEditShell
      title={trackOverview.title}
      artist={trackOverview.artist}
      trackId={trackOverview.id}
      modules={modules}
      activeModuleId="overview"
      headerActions={
        <>
          <DeleteTrackButton
            trackId={trackOverview.id}
            trackTitle={trackOverview.title}
            deleteAction={deleteTrackAction}
            assetKey={trackOverview.assetKey}
            coverUrl={trackOverview.coverUrl}
          />
          <TrackAnalyzeHeaderButtons
            id={trackOverview.id}
            audioUrl={trackOverview.audioUrl}
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
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <ModuleCard
          title="Creativo"
          description="Titulo, artista, modulo musical y tags creativos."
          href={`/admin/tracks/${trackOverview.id}/edit/creative`}
          status={
            trackOverview.title && trackOverview.artist ? "ok" : "warning"
          }
          statusText={
            trackOverview.title && trackOverview.artist ? "Listo" : "Pendiente"
          }
          details={[
            `Moods asignados: ${assignedMoods.length}`,
            `Usos asignados: ${assignedUses.length}`,
            `Categorias asignadas: ${assignedCategories.length}`,
          ]}
        />

        <ModuleCard
          title="Derechos"
          description="Writers, publishers, masters y toggles de explotacion."
          href={`/admin/tracks/${trackOverview.id}/edit/rights`}
          status={rightsStatus}
          statusText={rightsStatus === "ok" ? "Listo" : "Revisar"}
          details={[
            `Writer total: ${writerTotal}%`,
            `Publisher total: ${publisherTotal}%`,
            `Master total: ${masterTotal}%`,
          ]}
        />

        <ModuleCard
          title="Metadata"
          description="IDs y metadatos sincronizables para entrega/licensing."
          href={`/admin/tracks/${trackOverview.id}/edit/metadata`}
          status={idFilledCount >= 2 ? "ok" : "warning"}
          statusText={idFilledCount >= 2 ? "Listo" : "Incompleto"}
          details={[
            `IDs completados: ${idFilledCount}/3 (ISRC/ISWC/UPC)`,
            `BPM: ${trackOverview.bpm ?? "-"}`,
            `Track type: ${trackOverview.trackType ?? "-"}`,
          ]}
        />

        <ModuleCard
          title="Entregables"
          description="Versiones y stems para packaging de entrega."
          href={`/admin/tracks/${trackOverview.id}/edit/deliverables`}
          status={trackOverview._count.versions > 0 ? "ok" : "info"}
          statusText={trackOverview._count.versions > 0 ? "Listo" : "Vacio"}
          details={[
            `Versiones: ${trackOverview._count.versions}`,
            `Stems: ${trackOverview._count.stems}`,
            `Audio URL: ${trackOverview.audioUrl ? "Si" : "No"}`,
          ]}
        />

        <ModuleCard
          title="Revisión"
          description="Revisión consolidada final antes de publicar o entregar."
          href={`/admin/tracks/${trackOverview.id}/edit/review`}
          status="info"
          statusText="Disponible"
          details={[
            "Vista resumen de control final",
            "Accesos rapidos a modulos",
            "Sin cambios de datos en esta fase",
          ]}
        />
      </section>
    </TrackEditShell>
  );
}
