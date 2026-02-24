"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Componente: ReplyTemplates (respuestas rápidas por email)                   │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Muestra un select con plantillas comunes (ack, info, cotización).         │
 * │ - Rellena variables del caso (nombre, track, proyecto, presupuesto, etc.).  │
 * │ - Permite editar el cuerpo antes de enviar.                                  │
 * │ - Botones: "Copiar" (clipboard) y "Abrir email" (mailto: con subject/body). │
 * │ - No toca BD ni back-end; todo es cliente.                                  │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import * as React from "react";

type RequestInfo = {
  name: string;
  email: string;
  company?: string;
  projectType: string;
  media?: string | null;
  territories?: string | null;
  term?: string | null;
  budgetAmount?: number | null;
  budgetCurrency?: string | null;
  trackTitle?: string | null;
  trackArtist?: string | null;
};

function fmtMoney(amount?: number | null, curr?: string | null) {
  if (!amount || !curr) return "";
  try {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: curr,
      maximumFractionDigits: curr === "CLP" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount} ${curr}`;
  }
}

function nl(text: string) {
  // Normaliza saltos de línea a \n (mailto luego se encodea)
  return text.replace(/\r\n/g, "\n");
}

/** Plantillas base: puedes sumar más luego (solo front). */
const TEMPLATES = {
  ACK: "Acuse de recibo",
  INFO: "Pedir info faltante",
  QUOTE: "Confirmación de cotización enviada",
} as const;
type TemplateKey = keyof typeof TEMPLATES;

function buildSubject(tpl: TemplateKey, r: RequestInfo) {
  const base = r.trackTitle ? `${r.trackTitle} – ${r.trackArtist ?? ""}`.trim() : "Solicitud de licencia";
  switch (tpl) {
    case "ACK":
      return `Recibido: ${base}`;
    case "INFO":
      return `Info adicional para ${base}`;
    case "QUOTE":
      return `Cotización enviada: ${base}`;
  }
}

function buildBody(tpl: TemplateKey, r: RequestInfo) {
  const presupuesto = fmtMoney(r.budgetAmount, r.budgetCurrency);
  const track = r.trackTitle ? `“${r.trackTitle}”${r.trackArtist ? ` - ${r.trackArtist}` : ""}` : "el track consultado";
  const cabecera = `Hola ${r.name || "—"},\n`;
  const firma = `\n\n— Equipo ODR Records\n`;

  if (tpl === "ACK") {
    return nl(
      cabecera +
        `¡Gracias por tu consulta! Ya recibimos tu solicitud de licencia para ${track}.\n` +
        `Proyecto: ${r.projectType}${r.media ? ` · Medio: ${r.media}` : ""}${r.territories ? ` · Territorios: ${r.territories}` : ""}${r.term ? ` · Term: ${r.term}` : ""}\n` +
        (presupuesto ? `Presupuesto estimado: ${presupuesto}\n` : "") +
        `Revisaremos los detalles y te responderemos con los próximos pasos.\n` +
        firma
    );
  }

  if (tpl === "INFO") {
    return nl(
      cabecera +
        `Para continuar con la evaluación de licencia para ${track}, necesitamos confirmar:\n` +
        `• Uso exacto (duración y placement)\n` +
        `• Territorios de explotación${r.territories ? ` (indicados: ${r.territories})` : ""}\n` +
        `• Term o ventana de uso${r.term ? ` (indicado: ${r.term})` : ""}\n` +
        `• Medio de difusión${r.media ? ` (indicado: ${r.media})` : ""}\n` +
        (presupuesto ? `• Rango de presupuesto: ${presupuesto}\n` : "• Rango de presupuesto\n") +
        `Quedamos atentos para avanzar.\n` +
        firma
    );
  }

  // QUOTE
  return nl(
    cabecera +
      `Te confirmamos que enviamos la cotización para la licencia de ${track}.\n` +
      `Proyecto: ${r.projectType}${r.media ? ` · Medio: ${r.media}` : ""}${r.territories ? ` · Territorios: ${r.territories}` : ""}${r.term ? ` · Term: ${r.term}` : ""}\n` +
      (presupuesto ? `Referencia de presupuesto: ${presupuesto}\n` : "") +
      `Si tienes dudas o necesitas ajustes, feliz lo vemos.\n` +
      firma
  );
}

export default function ReplyTemplates({
  toEmail,
  request,
}: {
  toEmail: string;
  request: RequestInfo;
}) {
  const [tpl, setTpl] = React.useState<TemplateKey>("ACK");
  const [subject, setSubject] = React.useState(buildSubject("ACK", request));
  const [body, setBody] = React.useState(buildBody("ACK", request));
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    setSubject(buildSubject(tpl, request));
    setBody(buildBody(tpl, request));
  }, [tpl, request]);

  function openMail() {
    const url =
      `mailto:${encodeURIComponent(toEmail)}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;
    // Abrimos en una nueva pestaña/ventana. Si el navegador bloquea, el usuario puede permitir popup.
    window.location.href = url;
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // noop: algunos contextos no permiten clipboard; el usuario puede seleccionar manual
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[16rem] flex-1">
          <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
            Plantilla
          </label>
          <select
            value={tpl}
            onChange={(e) => setTpl(e.target.value as TemplateKey)}
            className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-[0.95rem] outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {Object.entries(TEMPLATES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
            Asunto
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-[0.95rem] outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
          Cuerpo (editable)
        </label>
        <textarea
          rows={9}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-[0.95rem] leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copyToClipboard}
          className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        >
          {copied ? "¡Copiado!" : "Copiar"}
        </button>
        <button
          type="button"
          onClick={openMail}
          className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        >
          Abrir email
        </button>
        <div className="text-xs text-muted-foreground">
          A: {request.email || toEmail}
        </div>
      </div>
    </div>
  );
}
