"use client";

import * as React from "react";
import {
  Download,
  FileAudio,
  Loader2,
  Pause,
  Play,
  Plus,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAdminAssetPlayer,
  useAdminAssetPlayerState,
} from "@/components/admin/player/admin-asset-player-context";

type AssetType = "MASTER" | "PREVIEW" | "STEM" | "ALTERNATE" | "DELIVERABLE";

type Asset = {
  id: string;
  type: AssetType;
  access: string;
  status: string;
  isCurrent: boolean;
  originalFilename: string | null;
  label: string | null;
  mime: string | null;
  sizeBytes: bigint | null;
  createdAt: Date;
  storageKey: string;
};

type Stem = { name: string; group: string | null; durationSec: number | null };
type Version = {
  label: string;
  kind: string | null;
  durationSec: number | null;
};

const names: Record<AssetType, string> = {
  PREVIEW: "Preview público",
  MASTER: "Master",
  STEM: "Stem",
  ALTERNATE: "Versión",
  DELIVERABLE: "Entregable",
};

function bytes(value: bigint | null) {
  return value == null ? "—" : `${(Number(value) / 1024 / 1024).toFixed(2)} MB`;
}

function fileName(asset: Asset) {
  return (
    asset.label ||
    asset.originalFilename ||
    asset.storageKey.split("/").at(-1) ||
    "Archivo"
  );
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}

function seconds(value: number | null | undefined) {
  if (value == null) return null;
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

export function TrackAssetsModule({
  track,
}: {
  track: {
    id: string;
    isDraft: boolean;
    assets: Asset[];
    stems: Stem[];
    versions: Version[];
  };
}) {
  const [uploadingType, setUploadingType] = React.useState<AssetType | null>(
    null,
  );
  const [file, setFile] = React.useState<File | null>(null);
  const [label, setLabel] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Asset | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const { currentAsset, isPlaying } = useAdminAssetPlayerState();
  const { playAsset, pause, closePlayer } = useAdminAssetPlayer();

  const assetsByType = (type: AssetType) =>
    track.assets.filter((asset) => asset.type === type);
  const stemByName = new Map(
    track.stems.map((stem) => [normalize(stem.name), stem]),
  );
  const versionByLabel = new Map(
    track.versions.map((version) => [normalize(version.label), version]),
  );

  function openUpload(type: AssetType) {
    setUploadingType(type);
    setFile(null);
    setLabel("");
    setMessage(null);
  }

  function closeUpload() {
    if (pending) return;
    setUploadingType(null);
    setFile(null);
    setLabel("");
  }

  async function upload() {
    if (!file || !uploadingType) {
      setMessage("Selecciona un archivo antes de subir.");
      return;
    }

    setPending(true);
    setMessage("Preparando subida segura…");
    try {
      const sign = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: track.id,
          assetType: uploadingType,
          fileName: file.name,
          label: label || undefined,
          mime: file.type,
          size: file.size,
        }),
      });
      const signed = await sign.json().catch(() => null);
      if (!sign.ok || !signed?.url) {
        throw new Error(signed?.error ?? "No se pudo preparar la subida.");
      }

      setMessage("Subiendo a R2…");
      const put = await fetch(signed.url, {
        method: "PUT",
        headers: signed.headers,
        body: file,
      });
      if (!put.ok) throw new Error("R2 rechazó el archivo.");

      const complete = await fetch("/api/uploads/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadToken: signed.uploadToken }),
      });
      const json = await complete.json().catch(() => null);
      if (!complete.ok) {
        throw new Error(json?.error ?? "No se pudo vincular el archivo.");
      }

      setMessage(
        json?.job
          ? "Archivo vinculado y enviado a procesamiento."
          : "Archivo privado vinculado correctamente.",
      );
      setUploadingType(null);
      setFile(null);
      setLabel("");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado.");
    } finally {
      setPending(false);
    }
  }

  async function makeCurrent(asset: Asset) {
    setPending(true);
    try {
      const response = await fetch(
        `/api/tracks/${track.id}/assets/${asset.id}/current`,
        { method: "POST" },
      );
      const json = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(json?.error ?? "No se pudo actualizar.");
      setMessage(
        `${names[asset.type]} vigente actualizado y enviado a procesamiento.`,
      );
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado.");
    } finally {
      setPending(false);
    }
  }

  async function getAssetUrl(asset: Asset, disposition?: "attachment") {
    const query = disposition ? "?disposition=attachment" : "";
    const response = await fetch(
      `/api/tracks/${track.id}/assets/${asset.id}/download${query}`,
    );
    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.url) {
      throw new Error(json?.error ?? "No se pudo acceder al archivo.");
    }
    return json.url as string;
  }

  async function togglePlay(asset: Asset) {
    if (currentAsset?.id === asset.id && isPlaying) {
      pause();
      return;
    }
    try {
      const didPlay = await playAsset(
        {
          id: asset.id,
          trackId: track.id,
          label: fileName(asset),
          type: asset.type,
        },
        await getAssetUrl(asset),
      );
      if (!didPlay) {
        setMessage("No se pudo reproducir el archivo. Puedes descargarlo desde la fila.");
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo reproducir el archivo.",
      );
    }
  }

  async function download(asset: Asset) {
    try {
      window.open(
        await getAssetUrl(asset, "attachment"),
        "_blank",
        "noopener,noreferrer",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo descargar el archivo.",
      );
    }
  }

  async function deleteAsset() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(
        `/api/tracks/${track.id}/assets/${deleteTarget.id}`,
        { method: "DELETE" },
      );
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(json?.error ?? "No se pudo eliminar el asset.");
      }
      if (currentAsset?.id === deleteTarget.id) {
        closePlayer();
      }
      setDeleteTarget(null);
      window.location.reload();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Error inesperado.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const sharedProps = {
    pending,
    playingAssetId: isPlaying ? currentAsset?.id ?? null : null,
    onCurrent: makeCurrent,
    onPlay: togglePlay,
    onDownload: download,
    onDelete: (asset: Asset) => {
      setDeleteError(null);
      setDeleteTarget(asset);
    },
  };

  return (
    <div className="space-y-4">
      <section className="border-border bg-card rounded-xl border px-4 py-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-primary text-xs font-semibold tracking-[.14em] uppercase">
              {track.isDraft ? "Borrador privado" : "Track publicado"}
            </p>
            <h2 className="mt-1 text-lg font-semibold">Archivos del track</h2>
          </div>
          <p className="text-muted-foreground max-w-xl text-sm">
            Los archivos viven aquí. Licencias solo define cuáles de estos
            entregables se ofrecen al cliente.
          </p>
        </div>
      </section>

      <section className="border-border bg-card rounded-xl border p-4">
        <AssetBlock
          title="Public preview"
          description="La versión que escucha el público en el catálogo. Reemplazarla conserva el historial."
          assets={assetsByType("PREVIEW")}
          actionLabel={
            assetsByType("PREVIEW").length > 0
              ? "Replace preview"
              : "Add preview"
          }
          onAction={() => openUpload("PREVIEW")}
          {...sharedProps}
        />
      </section>

      <section className="border-border bg-card rounded-xl border p-4">
        <div className="border-border border-b pb-3">
          <p className="text-primary text-xs font-semibold tracking-[.14em] uppercase">
            Privado
          </p>
          <h2 className="mt-1 text-lg font-semibold">Assets privados</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Masters, stems, versiones y entregables se conservan privados con su
            historial.
          </p>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <AssetBlock
            title="Masters"
            description="El primer master queda vigente. Las correcciones se conservan hasta que marques una versión como vigente."
            assets={assetsByType("MASTER")}
            addLabel="Add Master"
            onAction={() => openUpload("MASTER")}
            {...sharedProps}
          />
          <AssetBlock
            title="Deliverables"
            description="Archivos privados adicionales que pueden formar parte de una entrega; no son masters ni stems."
            assets={assetsByType("DELIVERABLE")}
            addLabel="Add Deliverable"
            onAction={() => openUpload("DELIVERABLE")}
            {...sharedProps}
          />
          <AssetBlock
            title="Stems"
            description="Pistas separadas del track. Usa una etiqueta clara, por ejemplo Kick, Guitar 1 o Lead Vocal."
            assets={assetsByType("STEM")}
            addLabel="Add Stem"
            onAction={() => openUpload("STEM")}
            detailsFor={(asset) => {
              const stem = stemByName.get(normalize(fileName(asset)));
              return stem?.group
                ? `Grupo: ${stem.group}`
                : "Grupo por clasificar";
            }}
            {...sharedProps}
          />
          <AssetBlock
            title="Versions"
            description="Variantes como instrumental, full mix, cutdowns o alt mixes. Cada una conserva su propio archivo."
            assets={assetsByType("ALTERNATE")}
            addLabel="Add Version"
            onAction={() => openUpload("ALTERNATE")}
            detailsFor={(asset) => {
              const version = versionByLabel.get(normalize(fileName(asset)));
              const duration = seconds(version?.durationSec);
              return (
                [version?.kind, duration].filter(Boolean).join(" · ") ||
                "Versión privada"
              );
            }}
            {...sharedProps}
          />
        </div>
      </section>

      <Dialog
        open={uploadingType !== null}
        onOpenChange={(open) => {
          if (!open) closeUpload();
        }}
      >
        <DialogContent className="border-border bg-card text-foreground sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {uploadingType === "PREVIEW"
                ? "Replace preview"
                : `Add ${uploadingType ? names[uploadingType] : "asset"}`}
            </DialogTitle>
            <DialogDescription>
              {uploadingType === "STEM"
                ? "Usa un nombre claro, por ejemplo Kick, Guitar 1 o Lead Vocal. La agrupación profesional se habilitará cuando pueda guardarse de forma estructurada."
                : uploadingType === "ALTERNATE"
                  ? "Indica una etiqueta editorial como Full Mix, Instrumental o 30s Cutdown."
                  : "El archivo se vinculará a este track de forma privada y segura."}
            </DialogDescription>
          </DialogHeader>
          {uploadingType ? (
            <UploadPanel
              type={uploadingType}
              file={file}
              label={label}
              pending={pending}
              onFile={setFile}
              onLabel={setLabel}
              onSubmit={upload}
            />
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                disabled={pending}
                className="border-border hover:bg-muted/40 h-9 rounded-md border px-3 text-sm disabled:opacity-40"
              >
                Cancelar
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent
          className="border-border bg-card text-foreground sm:max-w-md"
          showCloseButton={!deleting}
        >
          <DialogHeader>
            <DialogTitle>Eliminar asset</DialogTitle>
            <DialogDescription>
              ¿Eliminar “{deleteTarget ? fileName(deleteTarget) : "este archivo"}”
              permanentemente?
            </DialogDescription>
          </DialogHeader>
          <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border p-3 text-sm">
            Se eliminarán el archivo almacenado y su registro. Esta acción no
            se puede deshacer.
          </p>
          {deleteError ? (
            <p
              role="alert"
              className="border-destructive/30 bg-destructive/5 text-destructive rounded-md border p-3 text-sm"
            >
              {deleteError}
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                disabled={deleting}
                className="border-border hover:bg-muted/40 h-9 rounded-md border px-3 text-sm disabled:opacity-40"
              >
                Cancelar
              </button>
            </DialogClose>
            <button
              type="button"
              disabled={deleting}
              onClick={deleteAsset}
              className="bg-destructive hover:bg-destructive/90 inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold text-white disabled:pointer-events-none disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              )}
              {deleting ? "Eliminando…" : "Eliminar permanentemente"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {message ? (
        <p
          role="status"
          className="border-border bg-muted/30 rounded-lg border p-3 text-sm"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

function AssetBlock({
  title,
  description,
  assets,
  actionLabel,
  addLabel,
  onAction,
  detailsFor,
  pending,
  playingAssetId,
  onCurrent,
  onPlay,
  onDownload,
  onDelete,
}: {
  title: string;
  description: string;
  assets: Asset[];
  actionLabel?: string;
  addLabel?: string;
  onAction: () => void;
  detailsFor?: (asset: Asset) => string;
  pending: boolean;
  playingAssetId: string | null;
  onCurrent: (asset: Asset) => void;
  onPlay: (asset: Asset) => void;
  onDownload: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}) {
  return (
    <article className="border-border bg-background/40 rounded-lg border p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-muted-foreground mt-1 max-w-xl text-xs leading-5">
            {description}
          </p>
        </div>
        {actionLabel ? (
          <button
            type="button"
            onClick={onAction}
            className="border-border hover:bg-muted/40 inline-flex h-8 items-center rounded-md border px-2.5 text-xs font-medium"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
      <AssetRows
        assets={assets}
        pending={pending}
        playingAssetId={playingAssetId}
        detailsFor={detailsFor}
        onCurrent={onCurrent}
        onPlay={onPlay}
        onDownload={onDownload}
        onDelete={onDelete}
      />
      {addLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="border-border text-muted-foreground hover:border-primary/60 hover:bg-primary/5 hover:text-foreground mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-dashed px-3 py-3 text-sm transition-colors"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {addLabel}
        </button>
      ) : null}
    </article>
  );
}

function UploadPanel({
  type,
  file,
  label,
  pending,
  onFile,
  onLabel,
  onSubmit,
}: {
  type: AssetType;
  file: File | null;
  label: string;
  pending: boolean;
  onFile: (file: File | null) => void;
  onLabel: (label: string) => void;
  onSubmit: () => void;
}) {
  const placeholder =
    type === "STEM"
      ? "Ej. Lead Vocal"
      : type === "ALTERNATE"
        ? "Ej. 30s Cutdown"
        : type === "MASTER"
          ? "Ej. Master v2"
          : type === "DELIVERABLE"
            ? "Ej. TV mix"
            : "Ej. Preview principal";
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(13rem,.75fr)_auto] sm:items-end">
      <label className="space-y-1">
        <span className="text-xs font-medium">Etiqueta visible</span>
        <input
          value={label}
          onChange={(event) => onLabel(event.target.value)}
          className="border-border bg-background h-9 w-full rounded-md border px-3 text-sm"
          placeholder={placeholder}
        />
      </label>
      <label className="border-border hover:bg-muted/30 flex h-9 cursor-pointer items-center justify-center rounded-md border border-dashed px-3 text-sm">
        <FileAudio className="mr-2 h-4 w-4" aria-hidden="true" />
        <span className="max-w-[12rem] truncate">
          {file?.name ?? "Elegir archivo"}
        </span>
        <input
          className="sr-only"
          type="file"
          accept="audio/*"
          onChange={(event) => onFile(event.target.files?.[0] ?? null)}
        />
      </label>
      <button
        type="button"
        disabled={!file || pending}
        onClick={onSubmit}
        className="bg-foreground text-background inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold disabled:opacity-40"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UploadCloud className="h-4 w-4" />
        )}
        Subir
      </button>
    </div>
  );
}

function AssetRows({
  assets,
  detailsFor,
  pending,
  playingAssetId,
  onCurrent,
  onPlay,
  onDownload,
  onDelete,
}: {
  assets: Asset[];
  detailsFor?: (asset: Asset) => string;
  pending: boolean;
  playingAssetId: string | null;
  onCurrent: (asset: Asset) => void;
  onPlay: (asset: Asset) => void;
  onDownload: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}) {
  if (!assets.length)
    return (
      <p className="bg-muted/25 text-muted-foreground mt-3 rounded-md px-3 py-2 text-sm">
        Aún no hay archivos.
      </p>
    );
  return (
    <ul className="mt-3 space-y-2">
      {assets.map((asset) => (
        <li
          key={asset.id}
          className="border-border flex min-w-0 flex-wrap items-center gap-3 rounded-md border px-3 py-2.5"
        >
          <FileAudio
            className="text-muted-foreground h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-[10rem] flex-1">
            <p className="truncate text-sm font-medium">{fileName(asset)}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {bytes(asset.sizeBytes)} · {asset.status.toLocaleLowerCase()} ·{" "}
              {detailsFor?.(asset) ??
                (asset.access === "PUBLIC" ? "Público" : "Privado")}
            </p>
          </div>
          {asset.isCurrent ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-700">
              <Star className="h-3 w-3" aria-hidden="true" /> Vigente
            </span>
          ) : asset.type === "MASTER" || asset.type === "PREVIEW" ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => onCurrent(asset)}
              className="border-border hover:bg-muted/40 rounded-md border px-2 py-1 text-xs disabled:opacity-40"
            >
              Marcar vigente
            </button>
          ) : null}
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPlay(asset)}
              aria-label={`${playingAssetId === asset.id ? "Pausar" : "Reproducir"} ${fileName(asset)}`}
              title={playingAssetId === asset.id ? "Pausar" : "Reproducir"}
              className="border-border hover:bg-muted/40 focus-visible:ring-ring inline-flex h-8 w-8 items-center justify-center rounded-md border focus-visible:ring-2 focus-visible:outline-none"
            >
              {playingAssetId === asset.id ? (
                <Pause className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={() => onDownload(asset)}
              aria-label={`Descargar ${fileName(asset)}`}
              title="Descargar"
              className="border-border hover:bg-muted/40 focus-visible:ring-ring inline-flex h-8 w-8 items-center justify-center rounded-md border focus-visible:ring-2 focus-visible:outline-none"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => onDelete(asset)}
              aria-label={`Eliminar ${fileName(asset)}`}
              title="Eliminar"
              className="border-destructive/40 text-destructive hover:bg-destructive/10 focus-visible:ring-destructive inline-flex h-8 w-8 items-center justify-center rounded-md border focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
