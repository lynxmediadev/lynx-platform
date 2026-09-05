export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { TrackAnalyzeHeaderButtons } from "@/components/admin/AnalyzeActions";
import { TrackEditShell } from "@/components/admin/track/edit/TrackEditShell";
import { getTrackEditModuleNavItems } from "@/components/admin/track/edit/module-nav";
import { CreativeModuleForm } from "@/components/admin/track/edit/CreativeModuleForm";
import {
  getTagOptionsBundle,
  getTrackCreativePageData,
} from "@/server/track-edit/queries";

export default async function AdminTrackEditCreativePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [trackCreative, tagOptions] = await Promise.all([
    getTrackCreativePageData(id),
    getTagOptionsBundle(),
  ]);

  if (!trackCreative) {
    notFound();
  }

  const modules = getTrackEditModuleNavItems(trackCreative.id);
  const assignedMoods =
    trackCreative.tags
      ?.filter((t) => t.tag.type === "MOOD")
      .map((c) => c.tag.name) ?? [];
  const assignedUses =
    trackCreative.tags
      ?.filter((t) => t.tag.type === "USE")
      .map((c) => c.tag.name) ?? [];
  const assignedCategories =
    trackCreative.tags
      ?.filter((t) => t.tag.type === "CATALOG")
      .map((c) => ({ id: c.tag.id, slug: c.tag.slug, name: c.tag.name })) ?? [];

  return (
    <TrackEditShell
      title={trackCreative.title}
      artist={trackCreative.artist}
      trackId={trackCreative.id}
      modules={modules}
      activeModuleId="creative"
      headerActions={
        <>
          <TrackAnalyzeHeaderButtons
            id={trackCreative.id}
            audioUrl={trackCreative.audioUrl}
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
      <CreativeModuleForm
        track={{
          id: trackCreative.id,
          title: trackCreative.title,
          artist: trackCreative.artist,
          bpm: trackCreative.bpm,
          key: trackCreative.key,
          trackType: trackCreative.trackType,
          genres: trackCreative.genres,
          subgenres: trackCreative.subgenres,
          assignedMoods,
          assignedUses,
          assignedCategories,
        }}
        moodCatalog={tagOptions.moodOptions}
        useCatalog={tagOptions.useOptions}
        categoryCatalog={tagOptions.catalogOptions}
      />
    </TrackEditShell>
  );
}
