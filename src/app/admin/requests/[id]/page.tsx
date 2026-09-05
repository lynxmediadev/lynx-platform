import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import prisma from "@/lib/prisma";

export const metadata: Metadata = { title: "Solicitud — Admin" };
export const dynamic = "force-dynamic";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const req = await prisma.contactRequest.findUnique({
    where: { id },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      name: true,
      email: true,
      serviceType: true,
      status: true,
      details: true,
      urgency: true,
      deadlineAt: true,
      pageUrl: true,
      rawPayload: true,
    },
  });

  if (!req) return notFound();

  const fmt = new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const payload = (req.rawPayload ?? {}) as any;
  const projectType: "single" | "album" | string = payload.projectType ?? "—";
  const contact = payload.contact ?? {};
  const single = payload.single ?? null;
  const album = payload.album ?? null;
  const addons = single?.addons ?? {};
  const pricingClp = single?.pricingClp ?? null;
  const vocalTracks =
    typeof single?.vocalTracks === "number" ? single.vocalTracks : null;
  const currency = payload.currency ?? "CLP";

  const currencyFormatter = (() => {
    try {
      return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: typeof currency === "string" ? currency : "CLP",
        maximumFractionDigits: 0,
      });
    } catch {
      return new Intl.NumberFormat("es-CL");
    }
  })();

  const fmtMoney = (amount: number | null | undefined) =>
    typeof amount === "number" ? currencyFormatter.format(amount) : "—";

  const priceMap = {
    drum: 20000,
    vocal: 20000,
    acapella: 10000,
    instrumental: 15000,
    live: 20000,
    rush: 35000,
    revs: 40000,
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card/80">
        <CardContent className="space-y-4 p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">
                Solicitud
              </p>
              <h1 className="text-foreground text-2xl font-semibold">
                {req.serviceType}
              </h1>
              <p className="text-muted-foreground text-xs">{req.id}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="text-xs tracking-wide uppercase"
              >
                {req.status}
              </Badge>
              <Badge variant="outline" className="text-xs">
                U{req.urgency}
              </Badge>
              <Button
                asChild
                variant="outline"
                className="full-sm rounded-[2px] text-xs"
              >
                <Link href="/admin/requests">Volver a la lista</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border bg-card/80">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Datos + Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <div className="table-scroll">
              <table className="border-border w-full border text-xs">
                <thead className="bg-card">
                  <tr>
                    <th className="text-muted-foreground border-border border-b px-2 py-1 text-left text-[10px] uppercase">
                      Ítem
                    </th>
                    <th className="text-muted-foreground border-border border-b px-2 py-1 text-left text-[10px] uppercase">
                      Dato
                    </th>
                    <th className="text-muted-foreground border-border border-b px-2 py-1 text-right text-[10px] uppercase">
                      Detalle
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  <tr>
                    <td className="px-2 py-1">Servicio</td>
                    <td className="px-2 py-1">{req.serviceType}</td>
                    <td className="px-2 py-1 text-right">—</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1">Estado</td>
                    <td className="px-2 py-1">{req.status}</td>
                    <td className="px-2 py-1 text-right">U{req.urgency}</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1">Creada</td>
                    <td className="px-2 py-1">{fmt.format(req.createdAt)}</td>
                    <td className="px-2 py-1 text-right">—</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1">Actualizada</td>
                    <td className="px-2 py-1">{fmt.format(req.updatedAt)}</td>
                    <td className="px-2 py-1 text-right">—</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1">Deadline</td>
                    <td className="px-2 py-1">
                      {req.deadlineAt ? fmt.format(req.deadlineAt) : "—"}
                    </td>
                    <td className="px-2 py-1 text-right">—</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1">Origen</td>
                    <td className="px-2 py-1">{req.pageUrl ?? "—"}</td>
                    <td className="px-2 py-1 text-right">—</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1">Nombre</td>
                    <td className="px-2 py-1">{contact.name ?? req.name}</td>
                    <td className="px-2 py-1 text-right">—</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1">Email</td>
                    <td className="px-2 py-1">{contact.email ?? req.email}</td>
                    <td className="px-2 py-1 text-right">—</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1">Compañía</td>
                    <td className="px-2 py-1">{contact.company ?? "—"}</td>
                    <td className="px-2 py-1 text-right">—</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1">Teléfono</td>
                    <td className="px-2 py-1">{contact.phone ?? "—"}</td>
                    <td className="px-2 py-1 text-right">—</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1">Notas contacto</td>
                    <td className="px-2 py-1">{contact.notes ?? "—"}</td>
                    <td className="px-2 py-1 text-right">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              Resumen técnico + Add-ons
              <Badge variant="outline" className="text-xs uppercase">
                {projectType}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {projectType === "single" && single ? (
              <>
                <div className="text-xs">
                  <table className="border-border w-full border text-xs">
                    <thead className="bg-card">
                      <tr>
                        <th className="text-muted-foreground border-border border-b px-2 py-1 text-left text-[10px] uppercase">
                          Ítem
                        </th>
                        <th className="text-muted-foreground border-border border-b px-2 py-1 text-left text-[10px] uppercase">
                          Estado
                        </th>
                        <th className="text-muted-foreground border-border border-b px-2 py-1 text-right text-[10px] uppercase">
                          Precio
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-border divide-y">
                      <tr>
                        <td className="px-2 py-1"># Tracks</td>
                        <td className="px-2 py-1">{single.tracks}</td>
                        <td className="px-2 py-1 text-right">—</td>
                      </tr>
                      <tr>
                        <td className="px-2 py-1">Vocales</td>
                        <td className="px-2 py-1">{vocalTracks ?? 0}</td>
                        <td className="px-2 py-1 text-right">
                          {vocalTracks
                            ? fmtMoney(vocalTracks * priceMap.vocal)
                            : "—"}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 py-1">Batería</td>
                        <td className="px-2 py-1">
                          {single.drumQuantize ? "Sí" : "No"}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {single.drumQuantize ? fmtMoney(priceMap.drum) : "—"}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 py-1">Acapella</td>
                        <td className="px-2 py-1">
                          {addons.acapella ? "Sí" : "No"}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {addons.acapella ? fmtMoney(priceMap.acapella) : "—"}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 py-1">Instrumental</td>
                        <td className="px-2 py-1">
                          {addons.instrumental ? "Sí" : "No"}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {addons.instrumental
                            ? fmtMoney(priceMap.instrumental)
                            : "—"}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 py-1">Backing live</td>
                        <td className="px-2 py-1">
                          {addons.liveBacking ? "Sí" : "No"}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {addons.liveBacking ? fmtMoney(priceMap.live) : "—"}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 py-1">Rush 2d</td>
                        <td className="px-2 py-1">
                          {addons.rush ? "Sí" : "No"}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {addons.rush ? fmtMoney(priceMap.rush) : "—"}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 py-1">Revisiones ilimitadas</td>
                        <td className="px-2 py-1">
                          {addons.unlimitedRevs ? "Sí" : "No"}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {addons.unlimitedRevs ? fmtMoney(priceMap.revs) : "—"}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 py-1">Moneda</td>
                        <td className="px-2 py-1">{currency}</td>
                        <td className="px-2 py-1 text-right">—</td>
                      </tr>
                      <tr>
                        <td className="px-2 py-1">Límite de tracks</td>
                        <td className="px-2 py-1">
                          {single.overMax ? "Superado" : "OK"}
                        </td>
                        <td className="px-2 py-1 text-right">—</td>
                      </tr>
                      <tr>
                        <td className="px-2 py-1 font-semibold">Total</td>
                        <td className="px-2 py-1">{currency}</td>
                        <td className="px-2 py-1 text-right font-semibold">
                          {fmtMoney(pricingClp)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}

            {projectType === "album" && album ? (
              <>
                <div className="text-xs">
                  <table className="border-border w-full border text-xs">
                    <thead className="bg-card">
                      <tr>
                        <th className="text-muted-foreground border-border border-b px-2 py-1 text-left text-[10px] uppercase">
                          Ítem
                        </th>
                        <th className="text-muted-foreground border-border border-b px-2 py-1 text-left text-[10px] uppercase">
                          Estado
                        </th>
                        <th className="text-muted-foreground border-border border-b px-2 py-1 text-right text-[10px] uppercase">
                          Precio
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-border divide-y">
                      <tr>
                        <td className="px-2 py-1">Canciones</td>
                        <td className="px-2 py-1">{album.songs}</td>
                        <td className="px-2 py-1 text-right">—</td>
                      </tr>
                      <tr>
                        <td className="px-2 py-1">Plazo</td>
                        <td className="px-2 py-1">{album.timeline || "—"}</td>
                        <td className="px-2 py-1 text-right">—</td>
                      </tr>
                      <tr>
                        <td className="px-2 py-1">Estilo</td>
                        <td className="px-2 py-1">{album.style || "—"}</td>
                        <td className="px-2 py-1 text-right">—</td>
                      </tr>
                      <tr>
                        <td className="px-2 py-1">Moneda</td>
                        <td className="px-2 py-1">{currency}</td>
                        <td className="px-2 py-1 text-right">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="text-foreground text-xs">
                  <p className="text-muted-foreground text-[10px] uppercase">
                    Notas
                  </p>
                  <p className="mt-1">{album.notes || "—"}</p>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card/80">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Detalle textual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground text-sm">
            {req.details || payload.notes || "—"}
          </p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card/80">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Payload completo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible defaultValue="">
            <AccordionItem value="payload">
              <AccordionTrigger className="text-muted-foreground text-xs">
                Ver payload completo
              </AccordionTrigger>
              <AccordionContent>
                <pre className="border-border bg-background text-foreground mt-2 max-h-[520px] overflow-auto rounded-[2px] border p-3 text-xs">
                  {JSON.stringify(req.rawPayload, null, 2)}
                </pre>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
