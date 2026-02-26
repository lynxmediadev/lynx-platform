/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/app/track/[id]/page.tsx                                        │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Objetivo                                                                    │
 * │ - Ficha pública del track con estética mínima/cinematográfica y tokens      │
 * │   globales (bg-background/card/border, radios 2px).                         │
 * │ - Server Component prepara datos y entrega waveform/base64 + URLs públicas. │
 * │ - PublicAudioBar usa el waveform Artlist-style y soporta click-to-seek.     │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import Head from "next/head";
import Link from "next/link";
import CatalogClient from "@/app/catalog/CatalogClient";
import { db } from "@/server/db";
import { getS3PublicUrl } from "@/lib/storage/s3";
import TrackHero, { type TrackHeroDetailSection } from "./TrackHero";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string; catalog?: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

/** Buffer(Bytes) → base64 para entregar al canvas del cliente */
function bytesToBase64(buf: Buffer | null): string | null {
  if (!buf) return null;
  return Buffer.from(buf).toString("base64");
}

/** Prefiere assetKey→R2; si no, usa audioUrl como fallback */
function publicAudioUrl(input: {
  assetKey: string | null;
  audioUrl: string | null;
}): string | null {
  if (input.assetKey) return getS3PublicUrl(input.assetKey);
  return input.audioUrl ?? null;
}

function baseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL)
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL)
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  // Fallback explícito al dominio público para evitar canonicals en localhost en prod
  return "https://lynxmedia.cl";
}

/** mm:ss para duración */
function fmtDuration(sec: number | null | undefined): string {
  if (sec == null || !isFinite(sec)) return "—";
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function formatUpdated(date: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Pill visual para moods/uses/restrictions */
function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-[2px] border border-border bg-background/80 px-2 py-1 text-[11px] leading-tight text-foreground">
      {children}
    </span>
  );
}

type PublishingShare = {
  role: string;
  name: string | null;
  sharePct: number | null;
  ipiNumber: string | null;
  pro: string | null;
  caeNumber: string | null;
};

type TrackVersionLite = {
  label: string;
  durationSec: number | null;
  kind: string | null;
};

type TrackStemLite = {
  name: string;
  group: string | null;
};

function formatText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function formatList(
  values: string[] | null | undefined,
  separator = " / ",
): string | null {
  if (!Array.isArray(values) || values.length === 0) return null;
  const cleaned = values.map((value) => value.trim()).filter(Boolean);
  return cleaned.length ? cleaned.join(separator) : null;
}

function formatBooleanFlag(value: boolean | null | undefined) {
  if (value === null || value === undefined) return null;
  return value ? "Si" : "No";
}

function formatTrackType(value: string | null | undefined) {
  if (!value) return null;
  switch (value) {
    case "INSTRUMENTAL":
      return "Instrumental";
    case "VOCAL":
      return "Vocal";
    case "VOCAL_INSTRUMENTAL":
      return "Vocal + instrumental";
    case "OTHER":
      return "Otro";
    default:
      return value;
  }
}

function formatLicenseType(value: string | null | undefined) {
  if (!value) return null;
  switch (value) {
    case "NON_EXCLUSIVE":
      return "No exclusiva";
    case "EXCLUSIVE":
      return "Exclusiva";
    case "LIMITED_EXCLUSIVE":
      return "Exclusiva limitada";
    case "BUYOUT":
      return "Buyout";
    default:
      return value;
  }
}

function formatPricingTier(value: string | null | undefined) {
  if (!value) return null;
  switch (value) {
    case "LOW":
      return "Low";
    case "MID":
      return "Mid";
    case "HIGH":
      return "High";
    case "BESPOKE":
      return "Bespoke";
    default:
      return value;
  }
}

function formatBudgetRange(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string | null | undefined,
) {
  const hasMin = typeof min === "number" && Number.isFinite(min);
  const hasMax = typeof max === "number" && Number.isFinite(max);
  if (!hasMin && !hasMax) return null;
  const prefix = currency ? `${currency} ` : "";
  if (hasMin && hasMax) return `${prefix}${min} - ${max}`;
  if (hasMin) return `${prefix}${min}+`;
  return `${prefix}${max}`;
}

function formatTermMonths(months: number | null | undefined) {
  if (typeof months !== "number" || !Number.isFinite(months)) return null;
  return `${months} mes${months === 1 ? "" : "es"}`;
}

function formatPublishing(
  shares: PublishingShare[] | null | undefined,
  fallback: string | null | undefined,
) {
  if (Array.isArray(shares) && shares.length) {
    const items = shares
      .map((share) => {
        const name = formatText(share.name);
        if (!name) return null;
        const pct =
          typeof share.sharePct === "number" && Number.isFinite(share.sharePct)
            ? ` ${share.sharePct}%`
            : "";
        const role = formatPublishingRole(share.role);
        return role ? `${role}: ${name}${pct}` : `${name}${pct}`;
      })
      .filter((item): item is string => Boolean(item));
    if (items.length) return items.join(" / ");
  }
  return formatText(fallback);
}

function formatPublishingRole(role: string) {
  if (!role) return null;
  if (role === "WRITER") return "Autor";
  if (role === "PUBLISHER") return "Publisher";
  return role;
}

function formatPublishingDetails(share: PublishingShare | null) {
  if (!share) return null;
  const name = formatText(share.name);
  const pct =
    typeof share.sharePct === "number" && Number.isFinite(share.sharePct)
      ? `${share.sharePct}%`
      : null;
  const details = [
    share.pro ? `PRO ${share.pro}` : null,
    share.caeNumber ? `CAE ${share.caeNumber}` : null,
    share.ipiNumber ? `IPI ${share.ipiNumber}` : null,
  ].filter(Boolean) as string[];

  const base = [name, pct].filter(Boolean).join(" ");
  if (!base && details.length === 0) return null;
  if (!base) return details.join(" · ");
  if (details.length === 0) return base;
  return `${base} · ${details.join(" · ")}`;
}

function formatVersions(versions: TrackVersionLite[] | null | undefined) {
  if (!Array.isArray(versions) || versions.length === 0) return [];
  return versions
    .map((version) => formatVersionLabel(version))
    .filter((value): value is string => Boolean(value));
}

function formatVersionLabel(version: TrackVersionLite) {
  const label = version.label?.trim();
  if (label) return label;
  if (version.durationSec && Number.isFinite(version.durationSec)) {
    return fmtDuration(version.durationSec);
  }
  if (version.kind) return version.kind;
  return null;
}

function formatVersionDetail(version: TrackVersionLite) {
  const label = formatText(version.label) ?? formatVersionLabel(version);
  if (!label) return null;
  const duration =
    typeof version.durationSec === "number" && Number.isFinite(version.durationSec)
      ? fmtDuration(version.durationSec)
      : null;
  const kind = formatVersionKind(version.kind);
  const extras = [duration, kind].filter(Boolean);
  return extras.length ? `${label} · ${extras.join(" · ")}` : label;
}

function formatVersionKind(value: string | null | undefined) {
  if (!value) return null;
  switch (value) {
    case "FULL":
      return "Full";
    case "CUTDOWN":
      return "Cutdown";
    case "ALT_MIX":
      return "Alt mix";
    case "INSTRUMENTAL":
      return "Instrumental";
    case "VOCAL":
      return "Vocal";
    case "OTHER":
      return "Otro";
    default:
      return value;
  }
}

function formatStemDetail(stem: TrackStemLite) {
  const name = formatText(stem.name);
  if (!name) return null;
  const group = formatStemGroup(stem.group);
  return group ? `${name} · ${group}` : name;
}

function formatStemGroup(value: string | null | undefined) {
  if (!value) return null;
  switch (value) {
    case "INSTRUMENT":
      return "Instrumento";
    case "VOCAL":
      return "Vocal";
    case "FX":
      return "FX";
    case "PERCUSSION":
      return "Percusion";
    case "OTHER":
      return "Otro";
    default:
      return value;
  }
}

function pickCatalogSlug(
  fromParam: string | null | undefined,
  fromTags: { slug: string; type: string }[] | null | undefined,
) {
  const candidate = fromParam?.trim().toLowerCase();
  if (candidate) return candidate;
  if (fromTags && fromTags.length) {
    const cat = fromTags.find((t) => t.type === "CATALOG");
    if (cat) return cat.slug;
  }
  return null;
}

export default async function TrackPublicPage({ params, searchParams }: PageProps) {
  const { id, catalog: routeCatalog } = await params;
  const sp = searchParams ? await searchParams : undefined;

  const catalogParam =
    (Array.isArray(sp?.c) ? sp?.c[0] : sp?.c) ??
    (Array.isArray(sp?.catalog) ? sp?.catalog[0] : sp?.catalog);
  const catParam = Array.isArray(sp?.cat) ? sp?.cat[0] : sp?.cat;

  // Redirige /track/[id]?c=slug -> /track/[id] (sin query, uso de cat opcional)
  if (catalogParam && !routeCatalog) {
    return redirect(`/track/${id}`);
  }

  // 1) Datos del track (pública + ficha técnica)
  const track = await db.track.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      artist: true,
      coverUrl: true,
      durationSec: true,
      bpm: true,
      key: true,
      trackType: true,
      genres: true,
      subgenres: true,
      assetKey: true,
      audioUrl: true,
      waveform: true,
      restrictions: true,
      master: true,
      isrc: true,
      iswc: true,
      licenseType: true,
      oneStop: true,
      clearedForSync: true,
      exclusiveTerritories: true,
      exclusiveTermMonths: true,
      restrictedTerritories: true,
      restrictedIndustries: true,
      restrictedPlatforms: true,
      restrictedBrands: true,
      mediaBuy: true,
      pricingTier: true,
      budgetMin: true,
      budgetMax: true,
      budgetCurrency: true,
      publishingSplit: true,
      publishingShares: {
        select: {
          role: true,
          name: true,
          sharePct: true,
          ipiNumber: true,
          pro: true,
          caeNumber: true,
        },
      },
      versions: {
        select: {
          label: true,
          durationSec: true,
          kind: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      stems: {
        select: {
          name: true,
          group: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      updatedAt: true,
      tags: {
        select: {
          tag: {
            select: { slug: true, type: true, name: true },
          },
        },
      },
    },
  });
  if (!track) notFound();

  const moods = (track.tags ?? [])
    .filter((tt) => tt.tag?.type === "MOOD")
    .map((tt) => ({ name: tt.tag!.name, slug: tt.tag!.slug }))
    .filter((t) => t.name && t.slug);
  const uses = (track.tags ?? [])
    .filter((tt) => tt.tag?.type === "USE")
    .map((tt) => ({ name: tt.tag!.name, slug: tt.tag!.slug }))
    .filter((t) => t.name && t.slug);

  // 2) Preparar src público + waveform en base64 para el canvas
  const src = publicAudioUrl({
    assetKey: track.assetKey,
    audioUrl: track.audioUrl,
  });
  const waveformB64 = bytesToBase64(track.waveform as unknown as Buffer | null);

  // 3) Similar por mood + tag de catálogo (si aplica); fallback recientes
  const catalogSlugs =
    track.tags
      ?.map((t: any) => (t.tag?.type === "CATALOG" ? t.tag.slug : null))
      .filter(Boolean) ?? [];

  const baseSelect = {
    id: true,
    title: true,
    artist: true,
    loudnessLufs: true,
    durationSec: true,
    bpm: true,
    key: true,
    audioUrl: true,
    waveform: true,
    tags: {
      select: {
        tag: { select: { name: true, slug: true, type: true } },
      },
    },
  };

  const makeWhere = (useMood: boolean) => {
    const clauses: any[] = [{ id: { not: track.id } }];
    if (useMood && moods.length) {
      clauses.push({
        tags: {
          some: { tag: { type: "MOOD", slug: moods[0]?.slug } },
        },
      });
    }
    if (catalogSlugs.length) {
      clauses.push({
        tags: {
          some: { tag: { slug: { in: catalogSlugs }, type: "CATALOG" } },
        },
      });
    }
    return clauses.length ? { AND: clauses } : undefined;
  };

  let similar = await db.track.findMany({
    where: makeWhere(true),
    orderBy: { updatedAt: "desc" },
    take: 6,
    select: baseSelect,
  });
  if (!similar.length) {
    similar = await db.track.findMany({
      where: makeWhere(false),
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: baseSelect,
    });
  }

  const similarCatalogTracks = similar.map((s: any) => ({
    id: s.id,
    title: s.title ?? "Sin título",
    artist: s.artist ?? "Artista desconocido",
    moods: moods.map((m) => m.name),
    uses: uses.map((u) => u.name),
    bpm: s.bpm ?? undefined,
    key: s.key ?? undefined,
    audioUrl: s.audioUrl,
    durationSec: s.durationSec ?? null,
    duration: fmtDuration(s.durationSec ?? 0),
    waveformB64: bytesToBase64(s.waveform as any),
  }));

  const activeCatalogSlug = pickCatalogSlug(
    catParam ?? catalogParam,
    track.tags?.map((t: any) => ({
      slug: t.tag?.slug,
      type: t.tag?.type,
    })),
  );

  const backHref = catParam
    ? `/catalog?cat=${encodeURIComponent(catParam)}`
    : activeCatalogSlug
      ? "/catalog"
      : "/catalog";
  const backLabel = "Catálogo";
  const canonicalPath = `/track/${id}`;
  const canonicalUrl = `${baseUrl()}${canonicalPath}`;

  const publishingSummary = formatPublishing(
    track.publishingShares as PublishingShare[] | null | undefined,
    track.publishingSplit,
  );

  const writerShare =
    track.publishingShares?.find((share) => share.role === "WRITER") ?? null;
  const publisherShare =
    track.publishingShares?.find((share) => share.role === "PUBLISHER") ?? null;

  const writerDetails = formatPublishingDetails(writerShare);
  const publisherDetails = formatPublishingDetails(publisherShare);

  const versionLabels = formatVersions(track.versions);
  const versionDetailLabels = (track.versions ?? [])
    .map((version) => formatVersionDetail(version))
    .filter((value): value is string => Boolean(value));
  const stemLabels = (track.stems ?? [])
    .map((stem) => formatStemDetail(stem))
    .filter((value): value is string => Boolean(value));
  const budgetLabel = formatBudgetRange(
    track.budgetMin,
    track.budgetMax,
    track.budgetCurrency,
  );

  const detailSections: TrackHeroDetailSection[] = [
    {
      id: "sync",
      label: "Metadata sync",
      hint: "Musical y clasificación",
      columns: [
        [
          {
            label: "BPM",
            value:
              track.bpm != null ? String(Math.round(track.bpm)) : null,
          },
          { label: "Tonalidad", value: formatText(track.key) },
          {
            label: "Tipo de track",
            value: formatTrackType(track.trackType),
          },
          { label: "Genero", value: formatList(track.genres) },
          { label: "Subgenero", value: formatList(track.subgenres) },
        ],
        [
          { label: "One-stop", value: formatBooleanFlag(track.oneStop) },
          {
            label: "Cleared para sync",
            value: formatBooleanFlag(track.clearedForSync),
          },
          {
            label: "Tipo de licencia",
            value: formatLicenseType(track.licenseType),
          },
          {
            label: "Territorios permitidos",
            value: formatList(track.exclusiveTerritories),
          },
          {
            label: "Plazo (meses)",
            value: formatTermMonths(track.exclusiveTermMonths),
          },
        ],
      ],
    },
    {
      id: "restrictions",
      label: "Restricciones y pricing",
      hint: "Alcance y condiciones",
      columns: [
        [
          {
            label: "Territorios restringidos",
            value: formatList(track.restrictedTerritories),
          },
          {
            label: "Industrias restringidas",
            value: formatList(track.restrictedIndustries, " · "),
          },
          {
            label: "Plataformas restringidas",
            value: formatList(track.restrictedPlatforms, " · "),
          },
          {
            label: "Marcas restringidas",
            value: formatList(track.restrictedBrands, " · "),
          },
          { label: "Media buy", value: formatText(track.mediaBuy) },
          {
            label: "Restricciones",
            value: formatList(track.restrictions, " · "),
          },
        ],
        [
          {
            label: "Pricing tier",
            value: formatPricingTier(track.pricingTier),
          },
          { label: "Presupuesto", value: budgetLabel },
        ],
      ],
    },
    {
      id: "rights",
      label: "Derechos y autores",
      hint: "Licencias e IDs",
      columns: [
        [
          { label: "Master", value: formatText(track.master) },
          { label: "Publishing", value: publishingSummary },
          { label: "ISRC", value: formatText(track.isrc) },
          { label: "ISWC", value: formatText(track.iswc) },
        ],
        [
          { label: "Autor", value: writerDetails },
          { label: "Publisher", value: publisherDetails },
        ],
      ],
    },
  ];

  return (
    <div className="bg-background text-foreground">
      <Head>
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-16 pt-10">
        {/* Header minimal */}
        <header className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
          >
            ← {backLabel}
          </Link>
          <span aria-label="Última actualización">{formatUpdated(track.updatedAt)}</span>
        </header>

        <TrackHero
          track={{
            id: track.id,
            title: track.title,
            artist: track.artist,
            durationSec: track.durationSec,
            moods: moods.map((m) => m.name),
            uses: uses.map((u) => u.name),
            restrictions: track.restrictions,
            bpm: track.bpm ?? null,
            key: track.key ?? null,
            versions: versionLabels.length ? versionLabels : null,
          }}
          coverUrl={track.coverUrl}
          audioSrc={src}
          waveformB64={waveformB64}
          detailSections={detailSections}
        />

        <section className="rounded-[2px] border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-medium leading-tight">Entregables</h2>
            <span className="text-xs text-muted-foreground">
              Versiones y stems
            </span>
          </div>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Versiones
              </p>
              <div className="mt-2">
                {versionDetailLabels.length ? (
                  <div className="flex flex-wrap gap-2">
                    {versionDetailLabels.map((label, index) => (
                      <Pill key={`version-${index}`}>{label}</Pill>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Stems / trackouts
              </p>
              <div className="mt-2">
                {stemLabels.length ? (
                  <div className="flex flex-wrap gap-2">
                    {stemLabels.map((label, index) => (
                      <Pill key={`stem-${index}`}>{label}</Pill>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2px] border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-medium leading-tight">Piezas similares</h2>
            <span className="text-xs text-muted-foreground">
              {moods.length ? `Mood · ${moods[0]?.name}` : "Recientes"}
            </span>
          </div>
          {similarCatalogTracks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay sugerencias por ahora.</p>
          ) : (
            <CatalogClient
              tracks={similarCatalogTracks}
              hideHeader
              compact
              catalogSlug={activeCatalogSlug ?? undefined}
              title="Piezas similares"
              subtitle=""
              eyebrow=""
            />
          )}
        </section>
      </div>
    </div>
  );
}
