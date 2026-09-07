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

type AdminTrackIngestPageProps = {
  heading?: string;
  description?: string;
};

type SignUploadResponse = {
  url: string;
  assetKey: string;
  publicUrl: string;
  uploadToken: string;
  headers: Record<string, string>;
  // Para compatibilidad futura dejamos fields opcional,
  // pero para R2 + PUT no lo usamos.
  fields?: Record<string, string>;
};

type UploadedAsset = {
  assetKey: string;
  publicUrl: string;
  mime: string;
  size: number;
  uploadToken: string;
};

export default function AdminTrackIngestPage(props: AdminTrackIngestPageProps) {
  const router = useRouter();

  // Metadata básica
  const [title, setTitle] = React.useState("");
  const [artist, setArtist] = React.useState("");
  const [coverUrl, setCoverUrl] = React.useState("");

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

  const heading = props.heading ?? "Ingesta de track";
  const description =
    props.description ??
    "Sube un archivo de audio a R2, completa la metadata básica y crea un track en el catálogo.";

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
          assetType: "PREVIEW",
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

      if (!signJson.url || !signJson.assetKey || !signJson.publicUrl || !signJson.uploadToken) {
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
      };

      setUploadedAsset(uploaded);
      setStatusMsg("Archivo subido a R2 correctamente.");
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

      const data = await res.json();
      console.log("[AdminTrackIngest] track creado:", data);
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

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <header className="border-b border-border pb-3">
        <h1 className="text-lg font-semibold text-foreground">{heading}</h1>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </header>

      <section className="space-y-4 rounded-xl border border-border bg-card/80 p-4">
        {/* Paso 1 + 2: archivo de audio + subida a R2 */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-foreground/80">
            Archivo de audio
          </label>
          <p className="text-[11px] text-muted-foreground">
            Selecciona el preview público (MP3 recomendado). Los masters,
            stems y entregables se guardan aparte como assets privados.
          </p>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="mt-1 block w-full text-xs text-foreground file:mr-2 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-xs file:text-foreground hover:file:bg-accent"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleUploadToR2}
              disabled={!file || uploading}
              className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? "Subiendo…" : "Subir a R2"}
            </button>

            {uploadedAsset && (
              <span className="text-[11px] text-success">
                Asset listo ({uploadedAsset.assetKey})
              </span>
            )}
          </div>
        </div>

        {/* Metadata básica */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-foreground/80">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-0.5 w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Ej: Shifting Shadows"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-foreground/80">
              Artista
            </label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="mt-0.5 w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Ej: Lynx / Dtrip"
            />
          </div>
        </div>

        {/* Cover URL */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-foreground/80">
            Cover URL (opcional)
          </label>
          <p className="text-[11px] text-muted-foreground">
            URL completa de una imagen de portada. Puede ser un asset estático
            del sitio o una URL externa.
          </p>
          <input
            type="text"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            className="mt-0.5 w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Ej: https://tu-sitio.com/covers/mi-track.png"
          />
        </div>

        {/* Moods / Uses */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-foreground/80">
              Moods
            </label>
            <p className="text-[11px] text-muted-foreground">
              Una entrada por línea o separadas por comas. .
            </p>
            <textarea
              value={moodsInput}
              onChange={(e) => setMoodsInput(e.target.value)}
              rows={5}
              className="mt-0.5 mb-0 w-full resize-y rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder={`SAD\nCINEMATIC`}
            />
            <p className="font-mono text-[10px] text-muted-foreground">
              Ej: DARK, CINEMATIC, TENSE, HOPEFULL
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-foreground/80">
              Usos previstos
            </label>
            <p className="text-[11px] text-muted-foreground">
              Una entrada por línea o separadas por comas.
            </p>

            <textarea
              value={usesInput}
              onChange={(e) => setUsesInput(e.target.value)}
              rows={5}
              className="mt-0.5 mb-0 w-full resize-y rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder={`TRAILER\nSERIE\nDOCUMENTAL\nAD TECH`}
            />
            <p className="font-mono text-[10px] text-muted-foreground">
              Ej: TRAILER, SERIE, DOCUMENTAL, AD TECH
            </p>
          </div>
        </div>

        {/* Footer: estado + botón crear */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <div className="rounded-xs border border-border bg-muted/30 p-2 px-4">
            <h4 className="text-[15px] font-black text-foreground/80">
              Instrucciones:
            </h4>
            <p className="pl-1 text-[12px] font-black text-muted-foreground">
              1) Selecciona archivo
            </p>
            <p className="pl-1 text-[12px] font-black text-muted-foreground">
              2) Sube a R2
            </p>
            <p className="pl-1 text-[12px] font-black text-muted-foreground">
              3) Crea track
            </p>
          </div>
          <div className="flex items-center gap-3">
            {statusMsg && (
              <span className="text-[11px] text-muted-foreground">
                {statusMsg}
              </span>
            )}
            <button
              type="button"
              onClick={handleCreateTrack}
              disabled={creating}
              className="inline-flex h-8 items-center justify-center rounded-md border border-primary/60 bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? "Creando…" : "Crear track"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
