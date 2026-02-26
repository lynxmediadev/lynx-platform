import Link from "next/link";
import { updateTrackLicenseAssignmentsAction } from "@/app/admin/track/actions/licenses";

type TemplateRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  sortOrder: number;
  isPopular: boolean;
  priceAmount: number | null;
  currency: "CLP" | "USD" | "EUR";
  formats: string[];
};

type AssignmentRow = {
  licenseTemplateId: string;
  isEnabled: boolean;
  sortOrder: number;
  priceOverride: number | null;
  summaryOverrideJson: unknown;
  termsOverrideJson: unknown;
  agreementOverrideText: string | null;
};

type Props = {
  trackId: string;
  templates: TemplateRow[];
  assignments: AssignmentRow[];
};

function prettyJson(value: unknown) {
  if (!value) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

export function TrackLicenseAssignmentsForm({ trackId, templates, assignments }: Props) {
  const assignmentMap = new Map(assignments.map((row) => [row.licenseTemplateId, row]));

  return (
    <section className="rounded-lg border border-border bg-card/80 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Asignación de licencias por track</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Activa/desactiva plantillas y define overrides específicos para este track. Máximo 6 activas.
          </p>
        </div>
        <Link
          href="/admin/license-templates"
          className="rounded border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-foreground/70"
        >
          Gestionar plantillas
        </Link>
      </div>

      <form action={updateTrackLicenseAssignmentsAction} className="space-y-3">
        <input type="hidden" name="trackId" value={trackId} />
        <div className="space-y-2">
          {templates.map((template, index) => {
            const assignment = assignmentMap.get(template.id);
            const defaultEnabled = assignment?.isEnabled ?? false;
            const defaultSort = assignment?.sortOrder ?? template.sortOrder ?? index;
            const defaultPriceOverride = assignment?.priceOverride ?? "";

            return (
              <details
                key={template.id}
                className="rounded border border-border bg-background/70 p-2.5"
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{template.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {template.slug} · {template.currency} {template.priceAmount ?? "—"} ·{" "}
                        {template.formats.join(", ") || "Sin formatos"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      {template.isPopular ? (
                        <span className="rounded border border-border px-1.5 py-0.5">Popular</span>
                      ) : null}
                      <span className="rounded border border-border px-1.5 py-0.5">{template.status}</span>
                    </div>
                  </div>
                </summary>

                <input type="hidden" name="templateId" value={template.id} />
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      name={`enabled:${template.id}`}
                      className="h-4 w-4"
                      defaultChecked={defaultEnabled}
                    />
                    Activa para este track
                  </label>
                  <label className="space-y-1 text-xs text-muted-foreground">
                    Sort order
                    <input
                      type="number"
                      name={`sortOrder:${template.id}`}
                      defaultValue={defaultSort}
                      className="h-9 w-full rounded border border-border bg-background px-2 text-sm text-foreground"
                    />
                  </label>
                  <label className="space-y-1 text-xs text-muted-foreground">
                    Price override
                    <input
                      type="number"
                      name={`priceOverride:${template.id}`}
                      defaultValue={defaultPriceOverride}
                      className="h-9 w-full rounded border border-border bg-background px-2 text-sm text-foreground"
                      placeholder="Opcional"
                    />
                  </label>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-xs text-muted-foreground">
                    Summary override (JSON)
                    <textarea
                      name={`summaryJson:${template.id}`}
                      defaultValue={prettyJson(assignment?.summaryOverrideJson)}
                      rows={6}
                      className="w-full rounded border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground"
                      placeholder="[]"
                    />
                  </label>
                  <label className="space-y-1 text-xs text-muted-foreground">
                    Terms override (JSON)
                    <textarea
                      name={`termsJson:${template.id}`}
                      defaultValue={prettyJson(assignment?.termsOverrideJson)}
                      rows={6}
                      className="w-full rounded border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground"
                      placeholder="[]"
                    />
                  </label>
                  <label className="space-y-1 text-xs text-muted-foreground md:col-span-2">
                    Agreement override (texto)
                    <textarea
                      name={`agreementText:${template.id}`}
                      defaultValue={assignment?.agreementOverrideText ?? ""}
                      rows={5}
                      className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                      placeholder="Opcional: contrato específico para este track."
                    />
                  </label>
                </div>
              </details>
            );
          })}
        </div>

        <button
          type="submit"
          className="rounded border border-foreground bg-foreground px-4 py-2 text-xs font-semibold text-background hover:opacity-90"
        >
          Guardar asignaciones de licencias
        </button>
      </form>
    </section>
  );
}
