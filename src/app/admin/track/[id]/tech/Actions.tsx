"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export default function Actions({ trackId }: { trackId: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const post = async () => {
    try {
      setBusy(true);
      const r = await fetch(`/api/tracks/${trackId}/analyze`, { method: "POST" });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      const body = await r.json();
      setNotice(body?.queued ? "Procesamiento enviado a la cola." : "Solicitud completada.");
      router.refresh();
    } catch (e) {
      alert(`Error: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        className="rounded-md border px-3 py-2"
        disabled={busy}
        onClick={post}
        title="Encola análisis LUFS/TP/LRA, preview y waveform para el worker"
      >
        {busy ? "Enviando..." : "Procesar audio"}
      </button>
      {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}
    </div>
  );
}
