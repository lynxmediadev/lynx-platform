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

export function TrackLicenseAssignmentsForm({
  trackId,
  templates,
  assignments,
}: Props) {
  const assignmentMap = new Map(
    assignments.map((row) => [row.licenseTemplateId, row]),
  );

  return (
    <section className="border-border bg-card/80 rounded-lg border p-4">
      <div className="border-border mb-3 flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div>
          <p className="text-primary text-xs font-semibold tracking-[.14em] uppercase">
            Plantillas
          </p>
          <h2 className="text-foreground mt-1 text-sm font-semibold">
            Licencias disponibles para este track
          </h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Activa solo las propuestas que realmente quieras ofrecer. Los
            formatos incluidos se definen arriba y los archivos se administran
            en Archivos.
          </p>
        </div>
        <Link
          href="/admin/license-templates"
          className="border-border text-foreground hover:border-foreground/70 rounded border px-3 py-1.5 text-xs font-semibold transition"
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
            const defaultSort =
              assignment?.sortOrder ?? template.sortOrder ?? index;
            const defaultPriceOverride = assignment?.priceOverride ?? "";

            return (
              <details
                key={template.id}
                className="border-border bg-background/70 rounded border p-2.5"
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-foreground truncate text-sm font-semibold">
                        {template.name}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {template.slug} · {template.currency}{" "}
                        {template.priceAmount ?? "—"} ·{" "}
                        {template.formats.join(", ") || "Sin formatos"}
                      </p>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1 text-[10px] tracking-[0.12em] uppercase">
                      {template.isPopular ? (
                        <span className="border-border rounded border px-1.5 py-0.5">
                          Popular
                        </span>
                      ) : null}
                      <span className="border-border rounded border px-1.5 py-0.5">
                        {template.status}
                      </span>
                    </div>
                  </div>
                </summary>

                <input type="hidden" name="templateId" value={template.id} />
                <div className="border-border mt-3 border-t pt-3">
                  <p className="text-muted-foreground mb-2 text-xs">
                    Ajustes específicos para este track
                  </p>
                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="text-muted-foreground flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        name={`enabled:${template.id}`}
                        className="h-4 w-4"
                        defaultChecked={defaultEnabled}
                      />
                      Activa para este track
                    </label>
                    <label className="text-muted-foreground space-y-1 text-xs">
                      Sort order
                      <input
                        type="number"
                        name={`sortOrder:${template.id}`}
                        defaultValue={defaultSort}
                        className="border-border bg-background text-foreground h-9 w-full rounded border px-2 text-sm"
                      />
                    </label>
                    <label className="text-muted-foreground space-y-1 text-xs">
                      Price override
                      <input
                        type="number"
                        name={`priceOverride:${template.id}`}
                        defaultValue={defaultPriceOverride}
                        className="border-border bg-background text-foreground h-9 w-full rounded border px-2 text-sm"
                        placeholder="Opcional"
                      />
                    </label>
                  </div>

                  <details className="border-border mt-3 rounded border border-dashed px-3 py-2">
                    <summary className="text-muted-foreground cursor-pointer text-xs">
                      Overrides avanzados (JSON y acuerdo específico)
                    </summary>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <label className="text-muted-foreground space-y-1 text-xs">
                        Summary override (JSON)
                        <textarea
                          name={`summaryJson:${template.id}`}
                          defaultValue={prettyJson(
                            assignment?.summaryOverrideJson,
                          )}
                          rows={6}
                          className="border-border bg-background text-foreground w-full rounded border px-2 py-1.5 font-mono text-xs"
                          placeholder="[]"
                        />
                      </label>
                      <label className="text-muted-foreground space-y-1 text-xs">
                        Terms override (JSON)
                        <textarea
                          name={`termsJson:${template.id}`}
                          defaultValue={prettyJson(
                            assignment?.termsOverrideJson,
                          )}
                          rows={6}
                          className="border-border bg-background text-foreground w-full rounded border px-2 py-1.5 font-mono text-xs"
                          placeholder="[]"
                        />
                      </label>
                      <label className="text-muted-foreground space-y-1 text-xs md:col-span-2">
                        Agreement override (texto)
                        <textarea
                          name={`agreementText:${template.id}`}
                          defaultValue={assignment?.agreementOverrideText ?? ""}
                          rows={5}
                          className="border-border bg-background text-foreground w-full rounded border px-2 py-1.5 text-xs"
                          placeholder="Opcional: contrato específico para este track."
                        />
                      </label>
                    </div>
                  </details>
                </div>
              </details>
            );
          })}
        </div>

        <button
          type="submit"
          className="border-foreground bg-foreground text-background rounded border px-4 py-2 text-xs font-semibold hover:opacity-90"
        >
          Guardar asignaciones de licencias
        </button>
      </form>
    </section>
  );
}
