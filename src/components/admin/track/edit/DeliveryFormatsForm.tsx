"use client";

import * as React from "react";
import { PackageCheck } from "lucide-react";
import { updateDeliveryFormats } from "@/app/admin/track/actions/delivery-formats";

const OPTIONS = [
  ["MP3", "MP3", "Preview o descarga comprimida"],
  ["WAV", "WAV", "Archivo de alta resolución"],
  ["STEMS", "Stems", "Pistas separadas"],
  ["TRACKOUTS", "Trackouts", "Sesión exportada por canales"],
  ["INSTRUMENTAL", "Instrumental", "Versión sin voz"],
  ["ALT_MIX", "Alt mix", "Mezcla alternativa"],
  ["CUTDOWNS", "Cutdowns", "Versiones cortas"],
] as const;

export function DeliveryFormatsForm({ trackId, initialFormats }: { trackId: string; initialFormats: string[] }) {
  const [pending, setPending] = React.useState(false); const [message, setMessage] = React.useState<string | null>(null);
  async function submit(formData: FormData) { setPending(true); const result = await updateDeliveryFormats(formData); setMessage(result.message); setPending(false); }
  return <form action={submit} className="rounded-xl border border-border bg-card p-5"><input type="hidden" name="id" value={trackId}/><div className="flex items-start gap-3"><PackageCheck className="mt-0.5 h-5 w-5 text-primary"/><div><h2 className="font-semibold">Formatos incluidos</h2><p className="mt-1 text-sm text-muted-foreground">Define lo que ofrecerás comercialmente. No sube ni expone archivos privados.</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{OPTIONS.map(([value, title, description]) => <label key={value} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/30"><input name="deliveryFormats" value={value} type="checkbox" defaultChecked={initialFormats.includes(value)} className="mt-1 h-4 w-4 accent-primary"/><span><span className="block text-sm font-medium">{title}</span><span className="block text-xs text-muted-foreground">{description}</span></span></label>)}</div><div className="mt-4 flex items-center gap-3"><button disabled={pending} className="h-10 rounded-md bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-40">{pending ? "Guardando…" : "Guardar formatos"}</button>{message && <span role="status" className="text-sm text-muted-foreground">{message}</span>}</div></form>;
}
