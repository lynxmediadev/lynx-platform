"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Componente: InternalNotesEditor (autosave con feedback)                     │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Textarea para `internalNotes`.                                            │
 * │ - Guarda automáticamente tras 600ms sin teclear (debounce).                 │
 * │ - Muestra estado: "Guardando…", "Guardado", "Error".                        │
 * │ - Botón "Guardar ahora" y "Limpiar" por si quieres control manual.          │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import * as React from "react";
import SaveStateBadge from "@/components/admin/ui/SaveStateBadge";

type Props = {
  requestId: string;
  initialValue: string;
};

export default function InternalNotesEditor({
  requestId,
  initialValue,
}: Props) {
  const [value, setValue] = React.useState(initialValue);
  const [status, setStatus] = React.useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const controllerRef = React.useRef<AbortController | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpia request anterior si hay nueva edición
  React.useEffect(() => {
    return () => {
      if (controllerRef.current) controllerRef.current.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function doSave(next: string) {
    // Cancelar request anterior si sigue viva
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    setStatus("saving");
    try {
      const res = await fetch(`/admin/licensing/${requestId}/internal-notes`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ internalNotes: next }),
        signal: controllerRef.current.signal,
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2200);
    } catch {
      setStatus("error");
    }
  }

  // Debounce: guarda 600ms después de dejar de teclear
  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    setValue(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void doSave(next), 600);
  }

  return (
    <div className="space-y-2">
      <label className="text-muted-foreground block text-xs tracking-wide uppercase">
        Notas internas
      </label>

      <textarea
        value={value}
        onChange={onChange}
        placeholder="Resumen breve de la gestión, next steps, objeciones, etc."
        rows={6}
        className="border-border bg-muted focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 text-[0.95rem] leading-6 outline-none focus-visible:ring-2"
      />

      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <button
          type="button"
          className="border-border bg-card hover:bg-accent rounded border px-2 py-1"
          onClick={() => void doSave(value)}
        >
          Guardar ahora
        </button>
        <button
          type="button"
          className="border-border bg-card hover:bg-accent rounded border px-2 py-1"
          onClick={() => {
            setValue("");
            void doSave("");
          }}
        >
          Limpiar
        </button>

        <span className="ml-auto">
          <SaveStateBadge
            state={status}
            className={
              status === "saved"
                ? "text-emerald-500"
                : status === "error"
                  ? "text-destructive"
                  : "text-muted-foreground"
            }
            savingLabel="Guardando"
            savedLabel="Guardado"
            errorLabel="Error"
          />
        </span>
      </div>
    </div>
  );
}
