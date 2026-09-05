export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { TrackAnalyzeHeaderButtons } from "@/components/admin/AnalyzeActions";
import { TrackEditShell } from "@/components/admin/track/edit/TrackEditShell";
import { getTrackEditModuleNavItems } from "@/components/admin/track/edit/module-nav";
import { DeliverablesModuleForm } from "@/components/admin/track/edit/DeliverablesModuleForm";
import { getTrackDeliverablesPageData } from "@/server/track-edit/queries";

export default async function AdminTrackEditDeliverablesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const deliverablesPageData = await getTrackDeliverablesPageData(id);

  if (!deliverablesPageData) {
    notFound();
  }

  const modules = getTrackEditModuleNavItems(deliverablesPageData.id);

  return (
    <TrackEditShell
      title={deliverablesPageData.title}
      artist={deliverablesPageData.artist}
      trackId={deliverablesPageData.id}
      modules={modules}
      activeModuleId="deliverables"
      headerActions={
        <>
          <TrackAnalyzeHeaderButtons
            id={deliverablesPageData.id}
            audioUrl={deliverablesPageData.audioUrl}
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
      <DeliverablesModuleForm
        track={{
          id: deliverablesPageData.id,
          versions: deliverablesPageData.versions,
          stems: deliverablesPageData.stems,
        }}
      />
    </TrackEditShell>
  );
}
