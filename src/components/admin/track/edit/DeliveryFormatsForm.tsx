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

export function DeliveryFormatsForm({
  trackId,
  initialFormats,
}: {
  trackId: string;
  initialFormats: string[];
}) {
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  async function submit(formData: FormData) {
    setPending(true);
    const result = await updateDeliveryFormats(formData);
    setMessage(result.message);
    setPending(false);
  }
  return (
    <form
      action={submit}
      className="border-border bg-card rounded-xl border p-5"
    >
      <input type="hidden" name="id" value={trackId} />
      <div className="flex items-start gap-3">
        <PackageCheck className="text-primary mt-0.5 h-5 w-5" />
        <div>
          <p className="text-primary text-xs font-semibold tracking-[.14em] uppercase">
            Oferta
          </p>
          <h2 className="mt-1 font-semibold">Entregables incluidos</h2>
          <p className="text-muted-foreground mt-1 max-w-3xl text-sm">
            Marca lo que puedes ofrecer bajo una licencia. No crea archivos:
            primero confirma que el asset real existe en la pestaña Archivos.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {OPTIONS.map(([value, title, description]) => (
          <label
            key={value}
            className="border-border hover:bg-muted/30 flex cursor-pointer items-start gap-3 rounded-lg border p-3"
          >
            <input
              name="deliveryFormats"
              value={value}
              type="checkbox"
              defaultChecked={initialFormats.includes(value)}
              className="accent-primary mt-1 h-4 w-4"
            />
            <span>
              <span className="block text-sm font-medium">{title}</span>
              <span className="text-muted-foreground block text-xs">
                {description}
              </span>
            </span>
          </label>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          disabled={pending}
          className="bg-foreground text-background h-10 rounded-md px-4 text-sm font-semibold disabled:opacity-40"
        >
          {pending ? "Guardando…" : "Guardar oferta"}
        </button>
        {message && (
          <span role="status" className="text-muted-foreground text-sm">
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
