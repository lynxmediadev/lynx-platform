export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { TrackAnalyzeHeaderButtons } from "@/components/admin/AnalyzeActions";
import { TrackEditShell } from "@/components/admin/track/edit/TrackEditShell";
import { getTrackEditModuleNavItems } from "@/components/admin/track/edit/module-nav";
import { getTrackOverviewPageData } from "@/server/track-edit/queries";

export default async function AdminTrackEditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const trackOverview = await getTrackOverviewPageData(id);
  if (!trackOverview) {
    notFound();
  }

  const modules = getTrackEditModuleNavItems(trackOverview.id);

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
      .map((c) => c.tag.name) ?? [];

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

  return (
    <TrackEditShell
      title={trackOverview.title}
      artist={trackOverview.artist}
      trackId={trackOverview.id}
      modules={modules}
      activeModuleId="review"
      headerActions={
        <>
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
      <section className="border-border bg-card/50 rounded-lg border p-4">
        <h2 className="text-foreground text-sm font-semibold">
          Revision consolidada
        </h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Verifica estado final antes de publicar o exportar payload.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <article className="border-border bg-card/50 rounded-lg border p-4">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Creativo
          </h3>
          <ul className="text-muted-foreground mt-2 space-y-1 text-xs">
            <li>Titulo: {trackOverview.title ?? "-"}</li>
            <li>Artista: {trackOverview.artist ?? "-"}</li>
            <li>Moods: {assignedMoods.length}</li>
            <li>Usos: {assignedUses.length}</li>
            <li>Categorias: {assignedCategories.length}</li>
          </ul>
        </article>

        <article className="border-border bg-card/50 rounded-lg border p-4">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Derechos
          </h3>
          <ul className="text-muted-foreground mt-2 space-y-1 text-xs">
            <li>Writer total: {writerTotal}%</li>
            <li>Publisher total: {publisherTotal}%</li>
            <li>Master total: {masterTotal}%</li>
            <li>One-Stop: {trackOverview.oneStop ? "Si" : "No"}</li>
            <li>Cleared: {trackOverview.clearedForSync ? "Si" : "No"}</li>
          </ul>
        </article>

        <article className="border-border bg-card/50 rounded-lg border p-4">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Metadata y entrega
          </h3>
          <ul className="text-muted-foreground mt-2 space-y-1 text-xs">
            <li>ISRC: {trackOverview.isrc ?? "-"}</li>
            <li>ISWC: {trackOverview.iswc ?? "-"}</li>
            <li>UPC: {trackOverview.upc ?? "-"}</li>
            <li>Versiones: {trackOverview._count.versions}</li>
            <li>Stems: {trackOverview._count.stems}</li>
          </ul>
        </article>
      </section>
    </TrackEditShell>
  );
}
