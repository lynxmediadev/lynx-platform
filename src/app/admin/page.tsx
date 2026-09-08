import Link from "next/link";

import { Button } from "@/components/ui/button";

const QUICK_LINKS = [
  {
    title: "1. Nuevo track",
    description: "Crea un track con el preview público que escuchará el catálogo.",
    href: "/admin/uploads",
    cta: "Crear track",
  },
  {
    title: "2. Completar metadata",
    description: "Completa ficha, archivos, licencias y derechos.",
    href: "/admin/tracks",
    cta: "Administrar pistas",
  },
  {
    title: "3. Publicar el catálogo",
    description: "Agrupa pistas en colecciones y define el catálogo público.",
    href: "/admin/playlists",
    cta: "Administrar colecciones",
  },
  {
    title: "4. Gestionar licencias",
    description: "Revisa solicitudes, cotizaciones y seguimiento comercial.",
    href: "/admin/licensing",
    cta: "Ver solicitudes",
  },
];

export default function AdminOverviewPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-foreground text-2xl font-semibold">
          Panel principal
        </h1>
        <p className="text-muted-foreground text-sm">
          El flujo principal del catálogo, de la carga al licenciamiento.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {QUICK_LINKS.map((link) => (
          <article
            key={link.href}
            className="border-border bg-card rounded-lg border p-4"
          >
            <h2 className="text-foreground text-base font-semibold">
              {link.title}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {link.description}
            </p>
            <div className="mt-3">
              <Button asChild variant="outline" size="sm">
                <Link href={link.href}>{link.cta}</Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
