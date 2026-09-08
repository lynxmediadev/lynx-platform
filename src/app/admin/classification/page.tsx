import { Tags } from "lucide-react";

import { requireRole } from "@/lib/account-auth/guards";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const tagTypeLabels = {
  MOOD: "Moods",
  USE: "Usos",
  CATALOG: "Categorías",
  GENERIC: "Tags genéricos",
} as const;

export default async function AdminClassificationPage() {
  const user = await requireRole(["ADMIN", "STAFF"], {
    redirectTo: "/admin/login?err=forbidden",
  });
  if (!user) return null;

  const [tags, legacyMoods] = await Promise.all([
    prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        _count: { select: { tracks: true } },
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
    prisma.mood.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        _count: { select: { tracks: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const tagsByType = Object.keys(tagTypeLabels).map((type) => ({
    type: type as keyof typeof tagTypeLabels,
    label: tagTypeLabels[type as keyof typeof tagTypeLabels],
    rows: tags.filter((tag) => tag.type === type),
  }));

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <header className="border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Tags className="h-5 w-5 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-semibold">Clasificación</h1>
        </div>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Vista de los vocabularios actuales del catálogo. Esta etapa no migra ni
          unifica datos: permite reconocer qué clasificaciones existen antes de
          consolidarlas para la búsqueda global.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {tagsByType.map(({ type, label, rows }) => (
          <article key={type} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-semibold">{label}</h2>
              <span className="text-xs text-muted-foreground">{rows.length}</span>
            </div>
            {rows.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2" aria-label={label}>
                {rows.map((tag) => (
                  <li
                    key={tag.id}
                    className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs"
                  >
                    {tag.name}
                    <span className="ml-1.5 text-muted-foreground">{tag._count.tracks}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Aún no hay términos.</p>
            )}
          </article>
        ))}
      </div>

      <article className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="font-semibold">Moods legacy</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Relación histórica `Mood` / `TrackMood`; se conserva hasta una consolidación validada.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">{legacyMoods.length}</span>
        </div>
        {legacyMoods.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Moods legacy">
            {legacyMoods.map((mood) => (
              <li
                key={mood.id}
                className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs"
              >
                {mood.name}
                {mood.category ? <span className="ml-1 text-muted-foreground">· {mood.category}</span> : null}
                <span className="ml-1.5 text-muted-foreground">{mood._count.tracks}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Aún no hay moods legacy.</p>
        )}
      </article>

      <aside className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
        Géneros y subgéneros siguen almacenados directamente en cada track. La futura consolidación debe preservar las asignaciones existentes, ofrecer vocabularios controlados y mantener filtros estructurados como BPM, tonalidad, duración y artista.
      </aside>
    </section>
  );
}
