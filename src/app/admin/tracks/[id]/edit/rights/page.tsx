export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { TrackAnalyzeHeaderButtons } from "@/components/admin/AnalyzeActions";
import { TrackEditShell } from "@/components/admin/track/edit/TrackEditShell";
import { getTrackEditModuleNavItems } from "@/components/admin/track/edit/module-nav";
import { RightsModuleForm } from "@/components/admin/track/edit/RightsModuleForm";
import { getTrackRightsPageData } from "@/server/track-edit/queries";

export default async function AdminTrackEditRightsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const rightsPageData = await getTrackRightsPageData(id);

  if (!rightsPageData) {
    notFound();
  }

  const modules = getTrackEditModuleNavItems(rightsPageData.id);

  return (
    <TrackEditShell
      title={rightsPageData.title}
      artist={rightsPageData.artist}
      trackId={rightsPageData.id}
      modules={modules}
      activeModuleId="rights"
      headerActions={
        <>
          <TrackAnalyzeHeaderButtons
            id={rightsPageData.id}
            audioUrl={rightsPageData.audioUrl}
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
      <RightsModuleForm
        trackId={rightsPageData.id}
        track={{
          mfn: !!rightsPageData.mfn,
          contentIdEnrolled: !!rightsPageData.contentIdEnrolled,
          contentIdAdmin: rightsPageData.contentIdAdmin ?? "",
          contentIdWhitelist: rightsPageData.contentIdWhitelist ?? "",
          master: rightsPageData.master ?? "",
          oneStop: !!rightsPageData.oneStop,
          clearedForSync: !!rightsPageData.clearedForSync,
          publishingShares: rightsPageData.publishingShares,
          masterShares: rightsPageData.masterShares,
          restrictions: rightsPageData.restrictions ?? [],
        }}
      />
    </TrackEditShell>
  );
}
