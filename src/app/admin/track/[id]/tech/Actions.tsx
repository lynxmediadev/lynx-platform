"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export default function Actions({ trackId }: { trackId: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<null | string>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const post = async (normalize = false) => {
    try {
      setBusy(normalize ? "normalize" : "analyze");
      const url = normalize
        ? `/api/tracks/${trackId}/analyze?normalize=1`
        : `/api/tracks/${trackId}/analyze`;
      const r = await fetch(url, { method: "POST" });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      const body = await r.json();
      setNotice(body?.queued ? "Procesamiento enviado a la cola local." : "Análisis completado.");
      router.refresh();
    } catch (e) {
      alert(`Error: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        className="rounded-md border px-3 py-2"
        disabled={!!busy}
        onClick={() => post(false)}
        title="Analiza LUFS/TP/LRA y genera waveform"
      >
        {busy === "analyze" ? "Enviando..." : "Analizar"}
      </button>
      <button
        className="rounded-md bg-black text-white px-3 py-2"
        disabled={!!busy}
        onClick={() => post(true)}
        title="Normaliza a -16 LUFS aprox, sube a R2 y regenera waveform"
      >
        {busy === "normalize" ? "Enviando..." : "Analizar + Normalizar"}
      </button>
      <button
        className="rounded-md border px-3 py-2"
        disabled={!!busy}
        onClick={() => post(false)}
        title="Sólo regenerar waveform sin normalizar"
      >
        Regenerar waveform
      </button>
      {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}
    </div>
  );
}
