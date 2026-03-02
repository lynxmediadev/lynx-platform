"use client";

import { FileAudio2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DeliverableVersion = {
  id: string;
  label: string | null;
  kind: string | null;
  durationSec: number | null;
};

type DeliverableStem = {
  id: string;
  name: string;
  group: string | null;
};

type Props = {
  trackTitle: string;
  trackArtist: string;
  versions: DeliverableVersion[];
  stems: DeliverableStem[];
};

function formatDuration(sec: number | null) {
  if (!sec || !Number.isFinite(sec) || sec <= 0) return "—";
  const safe = Math.floor(sec);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function TrackDeliverablesDialog({
  trackTitle,
  trackArtist,
  versions,
  stems,
}: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex h-10 w-full items-center justify-center gap-2 rounded border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:border-foreground/70"
        >
          <FileAudio2 className="h-4 w-4" />
          Entregables
        </button>
      </DialogTrigger>
      <DialogContent className="border-border bg-background text-foreground sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Entregables del track</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {trackTitle} · {trackArtist}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-2">
          <article className="rounded border border-border bg-card/60 p-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Versiones
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              {versions.length > 0 ? (
                versions.map((version) => (
                  <li key={version.id} className="flex items-center justify-between gap-2">
                    <span className="truncate text-foreground">
                      {version.label || version.kind || "Versión"}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDuration(version.durationSec)}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">No hay versiones registradas.</li>
              )}
            </ul>
          </article>

          <article className="rounded border border-border bg-card/60 p-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Stems / Trackouts
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              {stems.length > 0 ? (
                stems.map((stem) => (
                  <li key={stem.id} className="flex items-center justify-between gap-2">
                    <span className="truncate text-foreground">{stem.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {stem.group || "—"}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">No hay stems registrados.</li>
              )}
            </ul>
          </article>
        </div>
      </DialogContent>
    </Dialog>
  );
}
