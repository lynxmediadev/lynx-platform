// src/components/whitelist-dialog.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

type TrackBasics = {
  title: string;
  isrc: string;
  iswc: string;
  upc: string;
  admin: string; // Identifyy / AdRev / etc.
  mailto: string; // correo a donde enviar la solicitud
};

export function WhitelistDialog({ track }: { track: TrackBasics }) {
  const [open, setOpen] = React.useState(false);
  const [ytChannels, setYtChannels] = React.useState("");
  const [metaPages, setMetaPages] = React.useState("");
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");
  const [territories, setTerritories] = React.useState<string>("");
  const [policyTrack, setPolicyTrack] = React.useState(true);
  const [notes, setNotes] = React.useState<string>("");

  const isValid = React.useMemo(() => {
    return (
      ytChannels.trim().length > 0 ||
      metaPages.trim().length > 0 ||
      notes.trim().length > 0
    );
  }, [ytChannels, metaPages, notes]);

  const mailtoHref = React.useMemo(() => {
    const subject = encodeURIComponent(
      `Solicitud de whitelist para campaña - ${track.title}`,
    );
    const lines = [
      `Hola equipo de Content ID,`,
      ``,
      `Solicito whitelist para la(s) siguiente(s) obra(s):`,
      `Título: ${track.title}`,
      `ISRC: ${track.isrc}`,
      `ISWC: ${track.iswc}`,
      `UPC: ${track.upc}`,
      ``,
      `Canales de YouTube a autorizar (URLs o IDs):`,
      ...ytChannels
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => `- ${l}`),
      ytChannels.trim() ? `` : `- (sin canales especificados)`,
      ``,
      `Páginas/Perfiles de Meta (Instagram/Facebook) a autorizar:`,
      ...metaPages
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => `- ${l}`),
      metaPages.trim() ? `` : `- (sin páginas especificadas)`,
      ``,
      `Fechas de campaña:`,
      `- Inicio: ${startDate || "(no indicado)"}`,
      `- Fin: ${endDate || "(no indicado)"}`,
      ``,
      `Territorios: ${territories || "(no indicado)"}`,
      ``,
      `Política durante campaña: ${policyTrack ? "Track / No monetizar" : "Monetizar"}`,
      ``,
      `Notas adicionales:`,
      `${notes || "(sin notas)"}`,
      ``,
      `Gracias,`,
      `Equipo ODR Records`,
    ];
    const body = encodeURIComponent(lines.join("\n"));
    return `mailto:${track.mailto}?subject=${subject}&body=${body}`;
  }, [
    track.title,
    track.isrc,
    track.iswc,
    track.upc,
    track.mailto,
    ytChannels,
    metaPages,
    startDate,
    endDate,
    territories,
    policyTrack,
    notes,
  ]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Solicitar whitelist</Button>
      </DialogTrigger>

      {/* Más ancho y con scroll interno controlado */}
      <DialogContent className="sm:max-w-[920px] md:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>Whitelist para campaña (Content ID)</DialogTitle>
          <DialogDescription>
            Completa los datos de la campaña para autorizar canales/páginas y
            evitar reclamos durante el período acordado.
          </DialogDescription>
        </DialogHeader>

        {/* Contenedor con scroll interno y layout en dos columnas a partir de md */}
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          {/* Resumen fijo arriba del contenido scrolleable */}
          <div className="border-border bg-background/50 rounded-md border p-4 text-sm">
            <p className="font-medium">{track.title}</p>
            <div className="text-muted-foreground mt-2 grid grid-cols-2 gap-3 text-xs">
              <div>
                ISRC: <span className="text-foreground/90">{track.isrc}</span>
              </div>
              <div>
                ISWC: <span className="text-foreground/90">{track.iswc}</span>
              </div>
              <div>
                UPC: <span className="text-foreground/90">{track.upc}</span>
              </div>
              <div>
                Admin CID:{" "}
                <span className="text-foreground/90">{track.admin}</span>
              </div>
            </div>
          </div>

          {/* Grid de dos columnas */}
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {/* Columna izquierda */}
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="yt">Canales de YouTube (uno por línea)</Label>
                <Textarea
                  id="yt"
                  placeholder={`https://www.youtube.com/@name\nhttps://www.youtube.com/channel/UCxxxx`}
                  value={ytChannels}
                  onChange={(e) => setYtChannels(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="meta">
                  Páginas de Meta (Instagram/Facebook) — uno por línea
                </Label>
                <Textarea
                  id="meta"
                  placeholder={`https://instagram.com/name\nhttps://facebook.com/name`}
                  value={metaPages}
                  onChange={(e) => setMetaPages(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
            </div>

            {/* Columna derecha */}
            <div className="grid gap-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="grid gap-2 sm:col-span-1">
                  <Label htmlFor="start">Inicio</Label>
                  <Input
                    id="start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2 sm:col-span-1">
                  <Label htmlFor="end">Fin</Label>
                  <Input
                    id="end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2 sm:col-span-1">
                  <Label htmlFor="territories">Territorios</Label>
                  <Input
                    id="territories"
                    placeholder="Worldwide / LATAM / CHILE…"
                    value={territories}
                    onChange={(e) => setTerritories(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Política durante campaña</Label>
                <div className="border-border flex flex-wrap items-center gap-4 rounded-md border p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="policyTrack"
                      checked={policyTrack}
                      onCheckedChange={(v) => setPolicyTrack(Boolean(v))}
                    />
                    <label htmlFor="policyTrack" className="cursor-pointer">
                      Track / No monetizar
                    </label>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    (Desmarca para solicitar{" "}
                    <span className="text-foreground">Monetizar</span> durante
                    la campaña)
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="notes">Notas adicionales</Label>
                <Textarea
                  id="notes"
                  placeholder="Ej: Incluir canal de agencia, creador @usuario, pauta de paid media…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              {/* Ayuda breve */}
              <div className="border-border text-muted-foreground rounded-md border p-4 text-xs">
                <p className="text-foreground font-medium">Guía rápida</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Whitelist previo evita reclamos automáticos.</li>
                  <li>
                    Al finalizar la campaña, los videos pueden recibir reclamos
                    si siguen públicos.
                  </li>
                  <li>
                    TV y radio se controlan por contrato/cue sheets (no por
                    Content ID).
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer fijo (no scrollea) */}
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button asChild aria-disabled={!isValid} disabled={!isValid}>
            <Link href={mailtoHref} onClick={() => setOpen(false)}>
              Abrir correo prellenado
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
