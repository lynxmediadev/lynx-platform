export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrackEditShell } from "@/components/admin/track/edit/TrackEditShell";
import { getTrackEditModuleNavItems } from "@/components/admin/track/edit/module-nav";
import { TrackAssetsModule } from "@/components/admin/track/edit/TrackAssetsModule";
import { getTrackAssetsPageData } from "@/server/track-edit/queries";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const track = await getTrackAssetsPageData(id); if (!track) notFound(); return <TrackEditShell title={track.title} artist={track.artist} trackId={track.id} modules={getTrackEditModuleNavItems(track.id)} activeModuleId="assets" headerActions={<Button asChild variant="outline" size="sm"><Link href="/admin/tracks">Volver al listado</Link></Button>}><TrackAssetsModule track={track}/></TrackEditShell>; }
