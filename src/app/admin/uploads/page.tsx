/**
 * Wrapper de ruta histórica: /admin/uploads
 * Ahora reutiliza el flujo unificado de ingesta + creación de Track.
 */
import TrackCreatePage from "../_components/track-create-page";

export default function AdminUploadsPage() {
  return <TrackCreatePage />;
}
