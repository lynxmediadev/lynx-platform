export const dynamic = "force-dynamic";

import Link from "next/link";
import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/account-auth/guards";
import {
  deleteLicenseTemplateAction,
  upsertLicenseTemplateAction,
} from "./actions";

function prettyJson(value: unknown) {
  if (!value) return "[]";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "[]";
  }
}

const SUMMARY_EXAMPLE = `[
  { "label": "Uso principal", "value": "Distribución digital" },
  { "label": "Límite streams", "value": "50.000" },
  { "label": "Videos", "value": "1 video monetizable" }
]`;

const TERMS_EXAMPLE = `[
  { "label": "MP3", "value": "Incluido" },
  { "label": "WAV", "value": "Incluido" },
  { "label": "Trackouts", "value": "No incluido" },
  { "label": "Distribución", "value": "Hasta 5.000 copias" }
]`;

const AGREEMENT_EXAMPLE = `LICENCIA NO EXCLUSIVA\n\n1. El licenciatario puede usar el beat para su proyecto dentro de los límites de esta licencia.\n2. El productor conserva la titularidad del master y publishing.\n3. Superados los límites, se requiere upgrade o renovación.\n4. La acreditación del productor es obligatoria cuando aplique.`;

export default async function AdminLicenseTemplatesPage() {
  await requireRole([UserRole.ADMIN, UserRole.STAFF], { redirectTo: "/admin" });

  const templates = await prisma.licenseTemplate.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      sortOrder: true,
      isPopular: true,
      priceAmount: true,
      currency: true,
      formats: true,
      summaryJson: true,
      termsMatrixJson: true,
      agreementText: true,
      notes: true,
      ownerUserId: true,
      owner: {
        select: {
          email: true,
          name: true,
        },
      },
      _count: {
        select: {
          assignments: true,
        },
      },
    },
  });

  return (
    <section className="space-y-5">
      <header className="rounded-lg border border-border bg-card/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-base font-semibold text-foreground">License Templates</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Plantillas reutilizables para asignar hasta 6 licencias activas por track.
            </p>
          </div>
          <Link
            href="/admin/tracks"
            className="rounded border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-foreground/70"
          >
            Ir a tracks
          </Link>
        </div>
      </header>

      <form
        action={upsertLicenseTemplateAction}
        className="space-y-3 rounded-lg border border-border bg-card/60 p-4"
      >
        <h2 className="text-sm font-semibold text-foreground">Crear plantilla</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-xs text-muted-foreground">
            Nombre
            <input
              name="name"
              required
              className="h-9 w-full rounded border border-border bg-background px-2 text-sm text-foreground"
              placeholder="WAV Lease Pro"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            Slug (opcional)
            <input
              name="slug"
              className="h-9 w-full rounded border border-border bg-background px-2 text-sm text-foreground"
              placeholder="wav-lease-pro"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            Estado
            <select
              name="status"
              defaultValue="ACTIVE"
              className="h-9 w-full rounded border border-border bg-background px-2 text-sm text-foreground"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            Sort order
            <input
              name="sortOrder"
              type="number"
              defaultValue={10}
              className="h-9 w-full rounded border border-border bg-background px-2 text-sm text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            Precio
            <input
              name="priceAmount"
              type="number"
              className="h-9 w-full rounded border border-border bg-background px-2 text-sm text-foreground"
              placeholder="49990"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            Moneda
            <select
              name="currency"
              defaultValue="USD"
              className="h-9 w-full rounded border border-border bg-background px-2 text-sm text-foreground"
            >
              <option value="USD">USD</option>
              <option value="CLP">CLP</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
          <label className="space-y-1 text-xs text-muted-foreground md:col-span-2">
            Formatos (CSV)
            <input
              name="formatsCsv"
              defaultValue="MP3,WAV"
              className="h-9 w-full rounded border border-border bg-background px-2 text-sm text-foreground"
              placeholder="MP3,WAV,STEMS"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground md:col-span-2">
            <input type="checkbox" name="isPopular" className="h-4 w-4" />
            Marcar como popular
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            Resumen (JSON)
            <textarea
              name="summaryJson"
              defaultValue={SUMMARY_EXAMPLE}
              rows={8}
              className="w-full rounded border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            Mapa completo (JSON)
            <textarea
              name="termsJson"
              defaultValue={TERMS_EXAMPLE}
              rows={8}
              className="w-full rounded border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground md:col-span-2">
            Contrato (texto)
            <textarea
              name="agreementText"
              defaultValue={AGREEMENT_EXAMPLE}
              rows={8}
              className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground md:col-span-2">
            Notas
            <textarea
              name="notes"
              rows={3}
              className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground"
              placeholder="Notas internas opcionales."
            />
          </label>
        </div>
        <button
          type="submit"
          className="rounded border border-foreground bg-foreground px-4 py-2 text-xs font-semibold text-background hover:opacity-90"
        >
          Guardar plantilla
        </button>
      </form>

      <div className="space-y-3">
        {templates.map((template) => (
          <details
            key={template.id}
            className="rounded-lg border border-border bg-card/50 p-3"
          >
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{template.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {template.slug} · {template.currency} {template.priceAmount ?? "—"} ·{" "}
                    {template.formats.join(", ") || "Sin formatos"}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="rounded border border-border px-2 py-0.5 text-muted-foreground">
                    {template.status}
                  </span>
                  <span className="rounded border border-border px-2 py-0.5 text-muted-foreground">
                    Usada: {template._count.assignments}
                  </span>
                  <span className="rounded border border-border px-2 py-0.5 text-muted-foreground">
                    {template.ownerUserId ? `Owner: ${template.owner?.name || template.owner?.email || "—"}` : "Global"}
                  </span>
                </div>
              </div>
            </summary>

            <form
              action={upsertLicenseTemplateAction}
              className="mt-3 space-y-3 border-t border-border/70 pt-3"
            >
              <input type="hidden" name="id" value={template.id} />
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1 text-xs text-muted-foreground">
                  Nombre
                  <input
                    name="name"
                    required
                    defaultValue={template.name}
                    className="h-9 w-full rounded border border-border bg-background px-2 text-sm text-foreground"
                  />
                </label>
                <label className="space-y-1 text-xs text-muted-foreground">
                  Slug
                  <input
                    name="slug"
                    required
                    defaultValue={template.slug}
                    className="h-9 w-full rounded border border-border bg-background px-2 text-sm text-foreground"
                  />
                </label>
                <label className="space-y-1 text-xs text-muted-foreground">
                  Estado
                  <select
                    name="status"
                    defaultValue={template.status}
                    className="h-9 w-full rounded border border-border bg-background px-2 text-sm text-foreground"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </label>
                <label className="space-y-1 text-xs text-muted-foreground">
                  Sort order
                  <input
                    name="sortOrder"
                    type="number"
                    defaultValue={template.sortOrder}
                    className="h-9 w-full rounded border border-border bg-background px-2 text-sm text-foreground"
                  />
                </label>
                <label className="space-y-1 text-xs text-muted-foreground">
                  Precio
                  <input
                    name="priceAmount"
                    type="number"
                    defaultValue={template.priceAmount ?? ""}
                    className="h-9 w-full rounded border border-border bg-background px-2 text-sm text-foreground"
                  />
                </label>
                <label className="space-y-1 text-xs text-muted-foreground">
                  Moneda
                  <select
                    name="currency"
                    defaultValue={template.currency}
                    className="h-9 w-full rounded border border-border bg-background px-2 text-sm text-foreground"
                  >
                    <option value="USD">USD</option>
                    <option value="CLP">CLP</option>
                    <option value="EUR">EUR</option>
                  </select>
                </label>
                <label className="space-y-1 text-xs text-muted-foreground md:col-span-2">
                  Formatos (CSV)
                  <input
                    name="formatsCsv"
                    defaultValue={(template.formats ?? []).join(",")}
                    className="h-9 w-full rounded border border-border bg-background px-2 text-sm text-foreground"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground md:col-span-2">
                  <input
                    type="checkbox"
                    name="isPopular"
                    className="h-4 w-4"
                    defaultChecked={template.isPopular}
                  />
                  Marcar como popular
                </label>
                <label className="space-y-1 text-xs text-muted-foreground">
                  Resumen (JSON)
                  <textarea
                    name="summaryJson"
                    defaultValue={prettyJson(template.summaryJson)}
                    rows={8}
                    className="w-full rounded border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground"
                  />
                </label>
                <label className="space-y-1 text-xs text-muted-foreground">
                  Mapa completo (JSON)
                  <textarea
                    name="termsJson"
                    defaultValue={prettyJson(template.termsMatrixJson)}
                    rows={8}
                    className="w-full rounded border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground"
                  />
                </label>
                <label className="space-y-1 text-xs text-muted-foreground md:col-span-2">
                  Contrato (texto)
                  <textarea
                    name="agreementText"
                    defaultValue={template.agreementText}
                    rows={8}
                    className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                  />
                </label>
                <label className="space-y-1 text-xs text-muted-foreground md:col-span-2">
                  Notas
                  <textarea
                    name="notes"
                    defaultValue={template.notes ?? ""}
                    rows={3}
                    className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  className="rounded border border-foreground bg-foreground px-4 py-2 text-xs font-semibold text-background hover:opacity-90"
                >
                  Guardar cambios
                </button>
              </div>
            </form>

            <form action={deleteLicenseTemplateAction} className="mt-2">
              <input type="hidden" name="id" value={template.id} />
              <button
                type="submit"
                className="rounded border border-destructive/60 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
              >
                Eliminar plantilla
              </button>
            </form>
          </details>
        ))}
      </div>
    </section>
  );
}
