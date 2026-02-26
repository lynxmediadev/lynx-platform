"use client";

import Link from "next/link";
import { FileText, Pause, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import LoopingText from "@/components/common/LoopingText";
import { cn } from "@/lib/utils";
import type { CatalogLicenseCard, CatalogTrack } from "./types";

function DetailMetaCell({
  label,
  value,
  forceLoopOnMobile = false,
}: {
  label: string;
  value: string;
  forceLoopOnMobile?: boolean;
}) {
  return (
    <div className="flex min-h-[48px] min-w-0 flex-col items-center justify-center px-2 py-1.5 text-center">
      <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/90">{label}</dt>
      <dd className="mt-0.5 w-full">
        <LoopingText
          text={value}
          className="text-center text-[13px] font-semibold leading-tight text-foreground"
          speedPxPerSecond={32}
          forceLoopOnMobile={forceLoopOnMobile}
        />
      </dd>
    </div>
  );
}

type DetailTagTone = "mood" | "use" | "genre";

function DetailTagPill({
  value,
  tone,
}: {
  value: string;
  tone: DetailTagTone;
}) {
  const toneClass =
    tone === "mood"
      ? "catalog-tag-mood"
      : tone === "use"
        ? "catalog-tag-use"
        : "border-border bg-muted/70 text-foreground";

  return (
    <span className={cn("max-w-full truncate rounded-full border px-2 py-0.5 text-xs font-medium", toneClass)}>
      {value}
    </span>
  );
}

function DetailTagColumn({
  label,
  values,
  tone,
}: {
  label: string;
  values: string[];
  tone: DetailTagTone;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/90">{label}</p>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {values.map((value) => (
            <DetailTagPill key={`${label}-${value}`} value={value} tone={tone} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground/90">—</p>
      )}
    </div>
  );
}

type Props = {
  selectedTrack: CatalogTrack | null;
  panelDuration: number;
  panelProgress: number;
  panelCurrentSec: number;
  panelTrackIsPlaying: boolean;
  selectedTrackBpmBadge: string;
  selectedTrackBpmValue: number | null;
  selectedTrackGenreLabel: string;
  selectedTrackLicenseLabel: string;
  selectedTrackSyncLabel: string;
  selectedTrackMoods: string[];
  selectedTrackUses: string[];
  selectedTrackLicenseCards: CatalogLicenseCard[];
  formatTime: (seconds: number) => string;
  onPlayTrack: (track: CatalogTrack) => void;
  onSeekTrack: (track: CatalogTrack, ratio: number) => void;
  resolveCoverUrl: (track: CatalogTrack) => string;
};

export default function TrackDetailPanel({
  selectedTrack,
  panelDuration,
  panelProgress,
  panelCurrentSec,
  panelTrackIsPlaying,
  selectedTrackBpmBadge,
  selectedTrackBpmValue,
  selectedTrackGenreLabel,
  selectedTrackLicenseLabel,
  selectedTrackSyncLabel,
  selectedTrackMoods,
  selectedTrackUses,
  selectedTrackLicenseCards,
  formatTime,
  onPlayTrack,
  onSeekTrack,
  resolveCoverUrl,
}: Props) {
  return (
    <section className="rounded-md border border-border bg-background/95 p-4 sm:p-5">
      <header className="mb-3 border-b border-border/80 pb-2.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/90">
          Detalle del track
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground/90">
          {selectedTrack ? "Selección actual" : "Sin selección"}
        </p>
      </header>

      {selectedTrack ? (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-md border border-border bg-card">
            <img
              src={resolveCoverUrl(selectedTrack)}
              alt={`Cover grande de ${selectedTrack.title}`}
              className="aspect-[2/1] w-full object-cover"
            />
          </div>

          <div className="space-y-2 rounded-md border border-border bg-card/45 p-3">
            <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5">
              <button
                type="button"
                onClick={() => onPlayTrack(selectedTrack)}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full border transition",
                  panelTrackIsPlaying
                    ? "border-foreground bg-foreground text-background"
                    : "border-foreground text-foreground hover:bg-foreground hover:text-background",
                )}
                aria-label={panelTrackIsPlaying ? "Pausar track" : "Reproducir track"}
              >
                {panelTrackIsPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="ml-0.5 h-5 w-5" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <LoopingText
                  text={selectedTrack.title}
                  className="text-left text-lg font-semibold leading-tight text-foreground"
                  speedPxPerSecond={34}
                  forceLoopOnMobile
                />
                <LoopingText
                  text={`de ${selectedTrack.artist || "Artista"}`}
                  className="text-left text-sm text-muted-foreground"
                  speedPxPerSecond={30}
                  forceLoopOnMobile
                />
              </div>
              <span className="justify-self-end whitespace-nowrap rounded border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {selectedTrackBpmBadge}
              </span>
            </div>

            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={1000}
                value={Math.round(panelProgress * 1000)}
                onChange={(event) => {
                  onSeekTrack(selectedTrack, Number(event.target.value) / 1000);
                }}
                className="h-2 w-full cursor-pointer accent-foreground"
                aria-label="Progreso de reproducción"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatTime(panelCurrentSec)}</span>
                <span>{formatTime(panelDuration)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/track/${selectedTrack.id}`}
              className="inline-flex items-center justify-center rounded border border-foreground bg-foreground px-3 py-2 text-sm font-semibold text-background transition hover:opacity-90"
            >
              Ver detalles
            </Link>
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded border border-foreground/50 px-3 py-2 text-sm font-semibold text-foreground transition hover:border-foreground"
                >
                  <FileText className="h-4 w-4" />
                  Licencias
                </button>
              </DialogTrigger>
              <DialogContent className="border-border bg-background text-foreground sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Licencias disponibles</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    {selectedTrack.title} · {selectedTrack.artist}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedTrackLicenseCards.map((card) => (
                    <article
                      key={card.id}
                      className="rounded border border-border bg-card/60 p-3"
                    >
                      <p className="text-sm font-semibold text-foreground">{card.title}</p>
                      <p className="mt-2 text-xl font-semibold leading-none text-foreground">
                        {card.price}
                      </p>
                      <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        {card.formats}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{card.note}</p>
                    </article>
                  ))}
                </div>
                <div className="flex flex-col items-start justify-between gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center">
                  <p>Valores referenciales sujetos al uso final.</p>
                  <Link
                    href={`/track/${selectedTrack.id}`}
                    className="inline-flex items-center rounded border border-foreground/50 px-2.5 py-1.5 font-semibold text-foreground transition hover:border-foreground"
                  >
                    Ver ficha completa
                  </Link>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="overflow-hidden rounded-md border border-border bg-card/30">
            <dl className="grid grid-cols-3 divide-x divide-border/80 border-b border-border/80">
              <DetailMetaCell label="BPM" value={selectedTrackBpmValue ? String(selectedTrackBpmValue) : "—"} />
              <DetailMetaCell label="Tonalidad" value={selectedTrack.key ?? "—"} />
              <DetailMetaCell label="Género" value={selectedTrackGenreLabel} />
            </dl>
            <dl className="grid grid-cols-3 divide-x divide-border/80">
              <DetailMetaCell
                label="Duración"
                value={selectedTrack.duration || formatTime(panelDuration)}
              />
              <DetailMetaCell label="Licencia" value={selectedTrackLicenseLabel} />
              <DetailMetaCell
                label="Estado sync"
                value={selectedTrackSyncLabel}
                forceLoopOnMobile
              />
            </dl>
          </div>

          {(selectedTrackMoods.length > 0 || selectedTrackUses.length > 0) && (
            <div className="rounded-md border border-border bg-card/30 p-2.5">
              <div className="grid grid-cols-1 divide-y divide-border/80 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <div className="pb-2.5 sm:pb-0 sm:pr-2.5">
                  <DetailTagColumn label="Moods" values={selectedTrackMoods} tone="mood" />
                </div>
                <div className="pt-2.5 sm:pt-0 sm:pl-2.5">
                  <DetailTagColumn label="Usos" values={selectedTrackUses} tone="use" />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Selecciona un track para ver detalles.</p>
      )}
    </section>
  );
}
