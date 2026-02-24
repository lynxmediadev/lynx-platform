// src/components/admin/QuickAdminActions.tsx
"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Componente cliente: Acciones rápidas para el admin                         │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Objetivo (peras y manzanas):                                                │
 * │ - Facilitar respuesta/comercialización:                                     │
 * │   • Responder por correo (mailto) con asunto/cuerpo prellenados.            │
 * │   • Copiar email, copiar resumen (texto), copiar JSON.                      │
 * │   • Descargar JSON de la solicitud (archivo .json).                         │
 * │ - Microinteracciones discretas (toasts livianos con texto).                 │
 * │ - Respeta tokens de color de tu theme; estilos tailwind mínimos.            │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import * as React from "react";

type Req = {
  id: string;
  createdAtISO: string;
  name: string;
  email: string;
  company: string;
  projectType: string;
  media: string;
  territories: string;
  term: string;
  budgetAmount: number | null;
  budgetCurrency: string | null;
  mfn: boolean;
  needWhitelist: boolean;
  notes: string;
  trackId: string;
  trackTitle: string;
  trackArtist: string;
  trackDurationSec: number | null;
  moods: string[];
  uses: string[];
  restrictions: string[];
  pageUrl: string;
  rawPayload: unknown;
};

function money(amount: number | null, curr: string | null) {
  if (!amount || !curr) return "—";
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

/** Botón con estilos sobrios (usa tokens) */
function Btn({
  children,
  onClick,
  as = "button",
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  as?: "button" | "a";
  href?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  if (as === "a" && href) {
    return (
      <a className={base} href={href}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={base} onClick={onClick}>
      {children}
    </button>
  );
}

/** Toast mínimo (texto) */
function Toast({ text }: { text: string }) {
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md border border-border bg-card px-3 py-2 text-sm shadow">
      {text}
    </div>
  );
}

export default function QuickAdminActions({ request }: { request: Req }) {
  const [toast, setToast] = React.useState<string | null>(null);

  // Helpers de feedback
  const show = (t: string) => {
    setToast(t);
    window.setTimeout(() => setToast(null), 1400);
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      show("Copiado");
    } catch {
      show("No se pudo copiar");
    }
  };

  // Construye asunto/cuerpo estándar (puedes ajustar el wording)
  const subject = `Licencia — ${request.trackTitle || "Track"} (${request.projectType})`;
  const bodyLines = [
    `Hola ${request.name},`,
    ``,
    `Gracias por tu interés en licenciar "${request.trackTitle || "este track"}".`,
    `Resumen de tu solicitud:`,
    `• Proyecto: ${request.projectType}${request.media ? ` · ${request.media}` : ""}`,
    `• Territorios: ${request.territories || "—"} · Term: ${request.term || "—"}`,
    `• Presupuesto: ${money(request.budgetAmount, request.budgetCurrency)}`,
    `• MFN: ${request.mfn ? "Sí" : "No"} · Whitelist: ${request.needWhitelist ? "Sí" : "No"}`,
    `• Track: ${request.trackTitle || "—"} · Artista: ${request.trackArtist || "—"} (ID: ${
      request.trackId
    })`,
    request.pageUrl ? `• URL: ${request.pageUrl}` : ``,
    ``,
    `Cuéntame si necesitas una cotización formal o más alternativas del catálogo.`,
    ``,
    `Saludos,`,
    `ODR Records`,
  ]
    .filter(Boolean)
    .join("\n");

  const mailtoHref = `mailto:${encodeURIComponent(
    request.email
  )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines)}`;

  // Resumen en texto para copiar (útil en CRMs/chat)
  const summaryText = [
    `Solicitud de licencia #${request.id} (${new Date(request.createdAtISO).toLocaleString()})`,
    `Solicitante: ${request.name} ${request.company ? `(${request.company})` : ""} · ${
      request.email
    }`,
    `Proyecto: ${request.projectType}${request.media ? ` · ${request.media}` : ""}`,
    `Territorios: ${request.territories || "—"} · Term: ${request.term || "—"}`,
    `Presupuesto: ${money(request.budgetAmount, request.budgetCurrency)}`,
    `MFN: ${request.mfn ? "Sí" : "No"} · Whitelist: ${request.needWhitelist ? "Sí" : "No"}`,
    `Track: ${request.trackTitle || "—"} · Artista: ${request.trackArtist || "—"} · ID: ${
      request.trackId
    } · Duración: ${request.trackDurationSec ?? "—"} s`,
    request.moods.length ? `Moods: ${request.moods.join(", ")}` : ``,
    request.uses.length ? `Usos: ${request.uses.join(", ")}` : ``,
    request.restrictions.length ? `Restricciones: ${request.restrictions.join(", ")}` : ``,
    request.pageUrl ? `URL: ${request.pageUrl}` : ``,
    request.notes ? `Notas: ${request.notes}` : ``,
  ]
    .filter(Boolean)
    .join("\n");

  const copyJSON = () => copy(JSON.stringify(request.rawPayload, null, 2));
  const copySummary = () => copy(summaryText);
  const copyEmail = () => copy(request.email);

  const downloadJSON = () => {
    try {
      const blob = new Blob([JSON.stringify(request.rawPayload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `licensing-request-${request.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      show("Descarga iniciada");
    } catch {
      show("No se pudo descargar");
    }
  };

  return (
    <div className="space-y-3">
      {/* Línea 1: responder y copiar correo */}
      <div className="flex flex-wrap gap-2">
        <Btn as="a" href={mailtoHref}>Responder por correo</Btn>
        <Btn onClick={copyEmail}>Copiar correo</Btn>
      </div>

      {/* Línea 2: copiar/descargar artefactos */}
      <div className="flex flex-wrap gap-2">
        <Btn onClick={copySummary}>Copiar resumen</Btn>
        <Btn onClick={copyJSON}>Copiar JSON</Btn>
        <Btn onClick={downloadJSON}>Descargar JSON</Btn>
      </div>

      {/* Toast liviano para feedback */}
      {toast && <Toast text={toast} />}
    </div>
  );
}
