/**
 * Wrapper de ruta histórica: /admin/uploads
 * Ahora reutiliza el flujo unificado de ingesta + creación de Track.
 */
import AdminTrackIngestPage from "../_components/admin-track-ingest-page";
import { prisma } from "@/lib/prisma";

export default async function AdminUploadsPage() {
  const tracks = await prisma.track.findMany({
    orderBy: [{ title: "asc" }, { artist: "asc" }],
    select: { id: true, title: true, artist: true },
  });
  return <AdminTrackIngestPage tracks={tracks} />;
}
