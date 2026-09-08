import { redirect } from "next/navigation";

/** Compatibilidad: la ficha reemplaza el antiguo resumen de solo lectura. */
export default async function TrackEditRootPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/tracks/${id}/edit/creative`);
}
