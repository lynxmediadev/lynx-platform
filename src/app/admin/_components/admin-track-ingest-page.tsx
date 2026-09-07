// src/app/admin/_components/admin-track-ingest-page.tsx
/**
 * AdminTrackIngestPage (componente compartido)
 *
 * Rutas donde se usa:
 *   - /admin/uploads
 *
 * Peras y manzanas:
 * - Flujo en 3 pasos:
 *     1) Seleccionar archivo de audio en el disco.
 *     2) Subirlo a R2 usando /api/uploads/sign (URL firmada).
 *     3) Crear un Track vía POST /api/tracks con:
 *          • title, artist, coverUrl
 *          • moods, uses
 *          • audioUrl (publicUrl de R2)
 *          • assetKey, assetMime, assetSize (para gestión/borrado en R2)
 *
 * Notas importantes:
 * - /api/uploads/sign devuelve una URL firmada de tipo PUT (x-id=PutObject).
 *   Por eso aquí subimos el archivo con fetch(url, { method: "PUT", body: file }).
 * - No toca nada de análisis ni waveform; sólo ingesta.
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  FileAudio,
  Globe2,
  Loader2,
  LockKeyhole,
  UploadCloud,
} from "lucide-react";

type AssetType = "PREVIEW" | "MASTER" | "STEM" | "ALTERNATE" | "DELIVERABLE";

type AdminTrackIngestPageProps = {
  heading?: string;
  description?: string;
  tracks?: Array<{ id: string; title: string; artist: string }>;
};

type SignUploadResponse = {
  url: string;
  assetKey: string;
  publicUrl: string | null;
  uploadToken: string;
  headers: Record<string, string>;
  // Para compatibilidad futura dejamos fields opcional,
  // pero para R2 + PUT no lo usamos.
  fields?: Record<string, string>;
};

type UploadedAsset = {
  assetKey: string;
  publicUrl: string | null;
  mime: string;
  size: number;
  uploadToken: string;
  assetType: AssetType;
};

export default function AdminTrackIngestPage(props: AdminTrackIngestPageProps) {
  const router = useRouter();
  const tracks = props.tracks ?? [];
  const [mode, setMode] = React.useState<"create" | "attach">("create");
  const [assetType, setAssetType] = React.useState<AssetType>("PREVIEW");
  const [trackId, setTrackId] = React.useState("");

  // Metadata básica
  const [title, setTitle] = React.useState("");
  const [artist, setArtist] = React.useState("");
  const [coverUrl, setCoverUrl] = React.useState("");
  const [genresInput, setGenresInput] = React.useState("");
  const [subgenresInput, setSubgenresInput] = React.useState("");
  const [bpm, setBpm] = React.useState("");
  const [musicalKey, setMusicalKey] = React.useState("");
  const [trackType, setTrackType] = React.useState("INSTRUMENTAL");

  // Moods y usos con valores iniciales útiles (se pueden sobrescribir al tiro)
  const [moodsInput, setMoodsInput] = React.useState("");
  const [usesInput, setUsesInput] = React.useState("");

  // Archivo local + estado de subida
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadedAsset, setUploadedAsset] =
    React.useState<UploadedAsset | null>(null);

  // Creación de track
  const [creating, setCreating] = React.useState(false);
  const [statusMsg, setStatusMsg] = React.useState<string | null>(null);

  const heading = props.heading ?? "Biblioteca de audio";
  const description =
    props.description ??
    "Crea tracks con preview público o adjunta masters, stems y entregables privados.";

  const isPrivate = mode === "attach";

  function changeMode(nextMode: "create" | "attach") {
    setMode(nextMode);
    setAssetType(nextMode === "create" ? "PREVIEW" : "MASTER");
    setFile(null);
    setUploadedAsset(null);
    setStatusMsg(null);
  }

  /**
   * Normaliza un textarea (comas / líneas) a array de strings únicos.
   */
  function toCleanList(input: string): string[] {
    return Array.from(
      new Set(
        input
          .split(/[\n,]/g)
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    );
  }

  /**
   * Paso 1: seleccionar archivo
   */
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    setFile(f);
    setUploadedAsset(null);
    setStatusMsg(null);
  }

  /**
   * Paso 2: subir archivo a R2 usando URL firmada.
   *
   * Importante:
   * - /api/uploads/sign espera un payload con:
   *     { fileName: string; mime: string; size: number; ... }
   * - Devuelve una URL firmada de tipo PUT (query con X-Amz-* y x-id=PutObject).
   * - NO usamos FormData aquí: enviamos el archivo crudo como body del PUT.
   */
  async function handleUploadToR2() {
    if (!file) {
      setStatusMsg("Primero selecciona un archivo de audio.");
      return;
    }
    if (mode === "attach" && !trackId) {
      setStatusMsg("Selecciona el track al que pertenece el archivo privado.");
      return;
    }

    setUploading(true);
    setStatusMsg("Solicitando firma de subida…");
    setUploadedAsset(null);

    try {
      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mime: file.type,
          size: file.size,
          assetType,
          trackId: mode === "attach" ? trackId : undefined,
        }),
      });

      if (!signRes.ok) {
        const errText = await signRes.text().catch(() => "");
        console.error(
          "[AdminTrackIngest] error en /api/uploads/sign:",
          errText,
        );
        setStatusMsg("Error al obtener firma de subida.");
        return;
      }

      const signJson = (await signRes.json()) as SignUploadResponse;

      if (!signJson.url || !signJson.assetKey || !signJson.uploadToken || (mode === "create" && !signJson.publicUrl)) {
        console.error(
          "[AdminTrackIngest] respuesta de sign incompleta:",
          signJson,
        );
        setStatusMsg(
          "Respuesta de firma incompleta (falta assetKey/publicUrl).",
        );
        return;
      }

      setStatusMsg("Subiendo archivo a R2…");

      // ⬇️ AQUÍ ESTABA EL PROBLEMA:
      //   - Antes: POST + FormData → 403 (firma de PUT no coincide).
      //   - Ahora: PUT + body: file, con Content-Type alineado al mime usado en la firma.
      const uploadRes = await fetch(signJson.url, {
        method: "PUT",
        headers: signJson.headers,
        body: file,
      });

      if (!uploadRes.ok) {
        // El navegador suele bloquear leer el body por CORS,
        // pero el status nos sirve para debug rápido.
        console.error(
          "[AdminTrackIngest] error al subir a R2. status:",
          uploadRes.status,
          uploadRes.statusText,
        );
        setStatusMsg("Error al subir archivo a R2.");
        return;
      }

      // Éxito: guardamos metadatos del asset
      const uploaded: UploadedAsset = {
        assetKey: signJson.assetKey,
        publicUrl: signJson.publicUrl,
        mime: file.type || "audio/*",
        size: file.size ?? 0,
        uploadToken: signJson.uploadToken,
        assetType,
      };

      if (mode === "attach") {
        setStatusMsg("Verificando y vinculando el asset privado…");
        const completeRes = await fetch("/api/uploads/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadToken: signJson.uploadToken }),
        });
        const completeJson = await completeRes.json().catch(() => null);
        if (!completeRes.ok || !completeJson?.ok) {
          setStatusMsg(completeJson?.error ?? "El archivo subió, pero no pudo vincularse al track.");
          return;
        }
        setUploadedAsset(uploaded);
        setStatusMsg(`${assetType} privado subido y vinculado correctamente.`);
        setFile(null);
      } else {
        setUploadedAsset(uploaded);
        setStatusMsg("Preview subido. Completa la metadata y crea el track.");
      }
    } catch (err) {
      console.error("[AdminTrackIngest] excepción en subida a R2:", err);
      setStatusMsg("Error inesperado al subir archivo.");
    } finally {
      setUploading(false);
    }
  }

  /**
   * Paso 3: crear track en BD vía /api/tracks.
   *
   * Requiere:
   * - título no vacío
   * - uploadedAsset (assetKey/publicUrl listos)
   */
  async function handleCreateTrack() {
    if (!title.trim()) {
      setStatusMsg("El Título es obligatorio.");
      return;
    }

    if (!artist.trim()) {
      setStatusMsg("El Artista es obligatorio.");
      return;
    }

    if (!uploadedAsset) {
      setStatusMsg("Primero sube el archivo a R2 antes de crear el track.");
      return;
    }

    setCreating(true);
    setStatusMsg("Creando track en el catálogo…");

    const moods = toCleanList(moodsInput);
    const uses = toCleanList(usesInput);

    try {
      const res = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          artist: artist.trim(),

          audio: {
            url: uploadedAsset.publicUrl,
          },

          coverUrl: coverUrl.trim() || null,
          moods,
          uses,
          genres: toCleanList(genresInput),
          subgenres: toCleanList(subgenresInput),
          bpm: bpm ? Number(bpm) : undefined,
          key: musicalKey.trim() || undefined,
          trackType,

          // Metadatos de asset para R2
          assetKey: uploadedAsset.assetKey,
          assetMime: uploadedAsset.mime,
          assetSize: uploadedAsset.size,
          assetUploadToken: uploadedAsset.uploadToken,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        console.error(
          "[AdminTrackIngest] error al crear track:",
          json ?? res.status,
        );
        setStatusMsg(
          json?.error ??
            "Error al crear el track. Revisa la consola del servidor.",
        );
        return;
      }

      await res.json();
      setStatusMsg("Track creado correctamente.");

      // Flujo principal: volver al listado técnico
      router.push("/admin/tracks");
    } catch (err) {
      console.error("[AdminTrackIngest] excepción al crear track:", err);
      setStatusMsg("Error inesperado al crear track.");
    } finally {
      setCreating(false);
    }
  }

  const fieldClass = "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/15";
  const labelClass = "text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <header className="space-y-1 border-b border-border pb-4">
        <h1 className="text-2xl font-semibold text-foreground">{heading}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </header>

      <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/30 p-1.5">
        <button type="button" onClick={() => changeMode("create")} className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition ${mode === "create" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <Globe2 className="h-4 w-4" /> Nuevo track + preview
        </button>
        <button type="button" onClick={() => changeMode("attach")} className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition ${mode === "attach" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <LockKeyhole className="h-4 w-4" /> Archivo privado
        </button>
      </div>

      <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div>
            <p className={labelClass}>1 · Destino</p>
            <h2 className="mt-1 text-lg font-semibold">{isPrivate ? "Biblioteca privada" : "Preview del catálogo"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{isPrivate ? "Solo usuarios autorizados podrán solicitar una descarga firmada." : "Audio público optimizado para escucha y catálogo."}</p>
          </div>

          {isPrivate && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <label className="space-y-1.5"><span className={labelClass}>Track</span><select value={trackId} onChange={(e) => setTrackId(e.target.value)} className={fieldClass}><option value="">Seleccionar track…</option>{tracks.map((track) => <option key={track.id} value={track.id}>{track.title} — {track.artist}</option>)}</select></label>
              <label className="space-y-1.5"><span className={labelClass}>Tipo de archivo</span><select value={assetType} onChange={(e) => setAssetType(e.target.value as AssetType)} className={fieldClass}><option value="MASTER">Master original</option><option value="STEM">Stem / pista separada</option><option value="ALTERNATE">Versión alternativa</option><option value="DELIVERABLE">Entregable</option></select></label>
            </div>
          )}

          <label className="group flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/60 p-5 text-center transition hover:border-primary/50 hover:bg-accent/30">
            <UploadCloud className="mb-3 h-8 w-8 text-muted-foreground transition group-hover:text-primary" />
            <span className="text-sm font-medium">{file ? file.name : "Seleccionar archivo de audio"}</span>
            <span className="mt-1 text-xs text-muted-foreground">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · ${file.type || "audio"}` : "MP3, WAV, FLAC, OGG, M4A o AIFF"}</span>
            <input key={mode} type="file" accept="audio/*" onChange={handleFileChange} className="sr-only" />
          </label>

          <button type="button" onClick={handleUploadToR2} disabled={!file || uploading || (isPrivate && !trackId)} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileAudio className="h-4 w-4" />}
            {uploading ? "Subiendo y verificando…" : isPrivate ? `Subir ${assetType.toLowerCase()} privado` : "Subir preview"}
          </button>

          {uploadedAsset && <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span>{isPrivate ? `${uploadedAsset.assetType} vinculado al track.` : "Preview listo para crear el track."}</span></div>}
        </div>

        {mode === "create" ? (
          <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div><p className={labelClass}>2 · Información</p><h2 className="mt-1 text-lg font-semibold">Datos del catálogo</h2></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5"><span className={labelClass}>Título *</span><input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} placeholder="Shifting Shadows" /></label>
              <label className="space-y-1.5"><span className={labelClass}>Artista *</span><input value={artist} onChange={(e) => setArtist(e.target.value)} className={fieldClass} placeholder="Lynx Music Collective" /></label>
              <label className="space-y-1.5"><span className={labelClass}>BPM</span><input type="number" min="0" value={bpm} onChange={(e) => setBpm(e.target.value)} className={fieldClass} placeholder="120" /></label>
              <label className="space-y-1.5"><span className={labelClass}>Tonalidad</span><input value={musicalKey} onChange={(e) => setMusicalKey(e.target.value)} className={fieldClass} placeholder="Am" /></label>
              <label className="space-y-1.5"><span className={labelClass}>Tipo</span><select value={trackType} onChange={(e) => setTrackType(e.target.value)} className={fieldClass}><option value="INSTRUMENTAL">Instrumental</option><option value="VOCAL">Vocal</option><option value="VOCAL_INSTRUMENTAL">Vocal + instrumental</option><option value="OTHER">Otro</option></select></label>
              <label className="space-y-1.5"><span className={labelClass}>Cover URL</span><input type="url" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} className={fieldClass} placeholder="https://…" /></label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5"><span className={labelClass}>Géneros</span><input value={genresInput} onChange={(e) => setGenresInput(e.target.value)} className={fieldClass} placeholder="Electronic, Hip Hop" /></label>
              <label className="space-y-1.5"><span className={labelClass}>Subgéneros</span><input value={subgenresInput} onChange={(e) => setSubgenresInput(e.target.value)} className={fieldClass} placeholder="Synthwave, Trap" /></label>
              <label className="space-y-1.5"><span className={labelClass}>Moods</span><textarea value={moodsInput} onChange={(e) => setMoodsInput(e.target.value)} rows={3} className={`${fieldClass} h-auto py-2`} placeholder="Dark, cinematic, tense" /></label>
              <label className="space-y-1.5"><span className={labelClass}>Usos previstos</span><textarea value={usesInput} onChange={(e) => setUsesInput(e.target.value)} rows={3} className={`${fieldClass} h-auto py-2`} placeholder="Trailer, documental, publicidad" /></label>
            </div>
            <button type="button" onClick={handleCreateTrack} disabled={creating || !uploadedAsset || !title.trim() || !artist.trim()} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40">{creating && <Loader2 className="h-4 w-4 animate-spin" />}{creating ? "Creando track…" : "Crear track y enviar a procesamiento"}</button>
          </div>
        ) : (
          <div className="flex min-h-72 flex-col justify-center rounded-2xl border border-border bg-card p-8 shadow-sm"><LockKeyhole className="h-9 w-9 text-primary" /><h2 className="mt-4 text-xl font-semibold">Privado por diseño</h2><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Masters, stems, versiones y entregables van a <strong>lynx-private-assets</strong>. El sistema verifica tamaño y MIME, crea el TrackAsset y solo entrega enlaces temporales a usuarios autorizados.</p><div className="mt-5 grid gap-2 text-sm sm:grid-cols-2"><span className="rounded-lg bg-muted/50 p-3">✓ Sin URL pública</span><span className="rounded-lg bg-muted/50 p-3">✓ Vinculado al track</span><span className="rounded-lg bg-muted/50 p-3">✓ Descarga autorizada</span><span className="rounded-lg bg-muted/50 p-3">✓ Master encola análisis</span></div></div>
        )}
      </section>

      {statusMsg && <div role="status" className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">{statusMsg}</div>}
    </div>
  );
}
