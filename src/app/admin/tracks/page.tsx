// src/app/admin/tracks/page.tsx
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Admin · /admin/tracks                                                      │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Lista tracks con foco en su estado técnico de análisis.                  │
 * │ - Muestra: título, artista, estado (audio/análisis), métricas de audio     │
 * │   (LUFS, LRA, True Peak, duración, sample rate) y acciones.                │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Tabla contenida en una card con overflow-hidden.                         │
 * │ - Paginación simple con ?page=&per=.                                       │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import Link from "next/link";
import { Music2, Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  AdminListHeader,
  AdminListButton,
  AdminListShell,
  AdminStatusBadge,
  countActiveFilters,
} from "@/components/admin/list-kit";
import { TracksTableClient } from "@/components/admin/tracks/TracksTableClient";

export const dynamic = "force-dynamic";

type SearchDict = Record<string, string | string[] | undefined>;

function first(v?: string | string[]) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function Page(props: {
  searchParams: Promise<SearchDict>;
}) {
  const sp = await props.searchParams;
  const q = (first(sp.q) ?? "").trim();
  const analysis = (first(sp.analysis) ?? "").trim().toLowerCase();
  const page = Math.max(1, parseInt(first(sp.page) ?? "1", 10) || 1);
  const per = Math.min(
    100,
    Math.max(10, parseInt(first(sp.per) ?? "50", 10) || 50),
  );
  const skip = (page - 1) * per;
  const activeFilterCount = countActiveFilters([q, analysis]);

  const whereAND: Prisma.TrackWhereInput[] = [];

  if (q) {
    whereAND.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { artist: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (analysis === "analyzed") {
    whereAND.push({ analysisAt: { not: null } });
  } else if (analysis === "pending") {
    whereAND.push({ analysisAt: null });
    whereAND.push({
      OR: [{ assetKey: { not: "" } }, { audioUrl: { not: "" } }],
    });
  } else if (analysis === "no_audio") {
    whereAND.push({ assetKey: "" });
    whereAND.push({ audioUrl: "" });
  }

  const where: Prisma.TrackWhereInput =
    whereAND.length > 0 ? { AND: whereAND } : {};

  const [tracks, total] = await Promise.all([
    prisma.track.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: per,
      skip,
      select: {
        id: true,
        title: true,
        artist: true,
        analysisAt: true,
        assetKey: true,
        audioUrl: true,
        moodLinks: {
          select: {
            mood: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            mood: {
              name: "asc",
            },
          },
        },
        durationSec: true,
        sampleRateHz: true,
        loudnessLufs: true,
        loudnessRangeLu: true,
        truePeakDbfs: true,
        genres: true,
        licenseType: true,
        mediaBuy: true,
      },
    }),
    prisma.track.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / per));
  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  const buildHref = (target: number) => {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (analysis) qs.set("analysis", analysis);
    qs.set("page", String(target));
    qs.set("per", String(per));
    return `/admin/tracks?${qs.toString()}`;
  };

  const rows = tracks.map((track) => ({
    id: track.id,
    title: track.title,
    artist: track.artist,
    analysisAtIso: track.analysisAt ? track.analysisAt.toISOString() : null,
    assetKey: track.assetKey,
    audioUrl: track.audioUrl,
    moodNames: track.moodLinks.map((entry) => entry.mood.name),
    genres: track.genres,
    licenseType: track.licenseType,
    mediaBuy: track.mediaBuy,
    durationSec: track.durationSec,
    sampleRateHz: track.sampleRateHz,
    loudnessLufs: track.loudnessLufs,
    loudnessRangeLu: track.loudnessRangeLu,
    truePeakDbfs: track.truePeakDbfs,
  }));

  return (
    <section>
      <AdminListShell>
        <AdminListHeader
          icon={
            <Music2
              className="text-muted-foreground h-4 w-4"
              aria-hidden="true"
            />
          }
          title="Tracks"
          subtitle="Catálogo, estado técnico y acceso a cada ficha"
          count={
            <AdminStatusBadge>
              Página {page} de {totalPages} · {total} track
              {total === 1 ? "" : "s"}
            </AdminStatusBadge>
          }
          actionSlot={
            <div className="flex items-center gap-2">
              <AdminListButton asChild size="pill" surface="background">
                <Link href="/admin/uploads">
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Nuevo track
                </Link>
              </AdminListButton>
              <AdminListButton asChild size="pill" surface="background">
                <Link href={buildHref(prevPage)} aria-disabled={page <= 1}>
                  ← Anterior
                </Link>
              </AdminListButton>
              <AdminListButton asChild size="pill" surface="background">
                <Link
                  href={buildHref(nextPage)}
                  aria-disabled={page >= totalPages}
                >
                  Siguiente →
                </Link>
              </AdminListButton>
            </div>
          }
        />
        <TracksTableClient
          tracks={rows}
          filters={{
            q,
            analysis,
            per,
            activeCount: activeFilterCount,
          }}
        />
      </AdminListShell>
    </section>
  );
}
