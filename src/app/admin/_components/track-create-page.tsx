"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileAudio, Loader2, Plus, UploadCloud } from "lucide-react";

type SignedUpload = { url: string; headers: Record<string, string>; assetKey: string; publicUrl: string; uploadToken: string };

export default function TrackCreatePage() {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [artist, setArtist] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [upload, setUpload] = React.useState<SignedUpload | null>(null);
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  async function create(draft: boolean) {
    if (!title.trim() || !artist.trim()) return setMessage("Título y artista son obligatorios.");
    if (!draft && !upload) return setMessage("Primero sube el preview público.");
    setPending(true); setMessage(draft ? "Creando borrador…" : "Creando track…");
    try {
      const response = await fetch("/api/tracks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, artist, draft, audio: upload ? { url: upload.publicUrl } : undefined, assetKey: upload?.assetKey, assetMime: file?.type, assetSize: file?.size, assetUploadToken: upload?.uploadToken }) });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.track?.id) throw new Error(json?.error ?? "No fue posible crear el track.");
      router.push(`/admin/tracks/${json.track.id}/edit/assets`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Error inesperado."); }
    finally { setPending(false); }
  }

  async function uploadPreview() {
    if (!file) return setMessage("Selecciona un archivo de audio.");
    setPending(true); setMessage("Preparando subida segura…");
    try {
      const signed = await fetch("/api/uploads/sign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName: file.name, mime: file.type, size: file.size, assetType: "PREVIEW" }) });
      const json = await signed.json().catch(() => null) as SignedUpload | null;
      if (!signed.ok || !json?.url || !json.publicUrl) throw new Error("No se pudo preparar la subida.");
      setMessage("Subiendo preview a R2…");
      const put = await fetch(json.url, { method: "PUT", headers: json.headers, body: file });
      if (!put.ok) throw new Error("R2 rechazó el preview.");
      setUpload(json); setMessage("Preview listo. Ahora crea el track.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Error inesperado."); }
    finally { setPending(false); }
  }

  return <main className="mx-auto w-full max-w-3xl space-y-6">
    <header className="border-b border-border pb-5"><p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Biblioteca de audio</p><h1 className="mt-1 text-3xl font-semibold">Nuevo track</h1><p className="mt-2 text-sm text-muted-foreground">Crea el track con el preview que escuchará el público. Masters y stems se agregan después, dentro del track correcto.</p></header>
    <section className="grid gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:grid-cols-2">
      <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground">Título *</span><input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 w-full rounded-lg border border-border bg-background px-3" placeholder="Nombre del track" /></label>
      <label className="space-y-2"><span className="text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground">Artista *</span><input value={artist} onChange={(e) => setArtist(e.target.value)} className="h-11 w-full rounded-lg border border-border bg-background px-3" placeholder="Artista o proyecto" /></label>
    </section>
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-start gap-3"><FileAudio className="mt-0.5 h-5 w-5 text-primary"/><div><h2 className="font-semibold">Preview público</h2><p className="mt-1 text-sm text-muted-foreground">Este es el único archivo que se sube al crear un track. Será visible en el catálogo.</p></div></div>
      <label className="mt-5 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center"><UploadCloud className="mb-2 h-7 w-7 text-muted-foreground"/><span className="font-medium">{file?.name ?? "Seleccionar preview"}</span><span className="mt-1 text-xs text-muted-foreground">MP3, WAV, FLAC, OGG, M4A o AIFF</span><input className="sr-only" type="file" accept="audio/*" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setUpload(null); }} /></label>
      <button disabled={!file || pending || Boolean(upload)} onClick={uploadPreview} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-foreground font-semibold text-background disabled:opacity-40">{pending && !upload ? <Loader2 className="h-4 w-4 animate-spin"/> : <UploadCloud className="h-4 w-4"/>}{upload ? "Preview listo" : "Subir preview"}</button>
    </section>
    <div className="flex flex-col gap-3 sm:flex-row"><button disabled={pending || !upload} onClick={() => create(false)} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-primary-foreground disabled:opacity-40"><Plus className="h-4 w-4"/>Crear track y abrir Archivos</button><button disabled={pending} onClick={() => create(true)} className="h-12 rounded-lg border border-border px-4 text-sm font-medium disabled:opacity-40">Crear borrador sin preview</button></div>
    {message && <p role="status" className="rounded-lg border border-border bg-muted/30 p-3 text-sm">{message}</p>}
  </main>;
}
