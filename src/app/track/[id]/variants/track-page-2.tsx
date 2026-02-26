import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Disc3,
  FileAudio2,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import type { Prisma } from "@prisma/client";
import CatalogClient from "@/app/catalog/CatalogClient";
import CopyLinkButton from "@/components/public/CopyLinkButton";
import LicensingDialog from "@/components/public/LicensingDialog";
import PublicAudioBar from "@/components/public/PublicAudioBar";
import { getS3PublicUrl } from "@/lib/storage/s3";
import { db } from "@/server/db";

type PageProps = {
  params: Promise<{ id: string }>;
};

type LicenseOption = {
  id: string;
  title: string;
  price: string;
  formats: string;
  note: string;
};

type SimilarTrack = {
  id: string;
  title: string;
  artist: string;
  moods: string[];
  uses: string[];
  genres: string[];
  bpm: number | undefined;
  key: string | undefined;
  audioUrl: string;
  coverUrl: string | null;
  durationSec: number | null;
  duration: string;
  waveformB64: string | null;
};

function bytesToBase64(buf: Buffer | null): string | null {
  if (!buf) return null;
  return Buffer.from(buf).toString("base64");
}

function formatDuration(sec: number | null | undefined): string {
  if (typeof sec !== "number" || !Number.isFinite(sec) || sec <= 0) return "—";
  const safe = Math.max(0, Math.floor(sec));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatUpdated(date: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatCurrencyAmount(
  amount: number | null | undefined,
  currency: string | null | undefined,
): string | null {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return null;
  const code = (currency ?? "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${code} ${Math.round(amount)}`;
  }
}

function formatLicenseType(value?: string | null): string {
  switch ((value ?? "").toUpperCase()) {
    case "NON_EXCLUSIVE":
      return "No exclusiva";
    case "EXCLUSIVE":
      return "Exclusiva";
    case "LIMITED_EXCLUSIVE":
      return "Exclusiva limitada";
    case "BUYOUT":
      return "Buyout";
    default:
      return "No definida";
  }
}

function formatPricingTier(value?: string | null): string {
  switch ((value ?? "").toUpperCase()) {
    case "LOW":
      return "Low";
    case "MID":
      return "Mid";
    case "HIGH":
      return "High";
    case "BESPOKE":
      return "Bespoke";
    default:
      return "—";
  }
}

function normalizeStrings(values?: string[] | null, limit = 8): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function publicAudioUrl(input: { assetKey: string | null; audioUrl: string | null }): string | null {
  if (input.assetKey) return getS3PublicUrl(input.assetKey);
  return input.audioUrl ?? null;
}

function deriveLicenseOptions(track: {
  licenseType: string | null;
  pricingTier: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetCurrency: string | null;
}): LicenseOption[] {
  const min =
    typeof track.budgetMin === "number" && Number.isFinite(track.budgetMin)
      ? track.budgetMin
      : null;
  const max =
    typeof track.budgetMax === "number" && Number.isFinite(track.budgetMax)
      ? track.budgetMax
      : null;

  let basic = min;
  let premium: number | null = null;
  let exclusive = max;

  if (min !== null && max !== null) {
    premium = Math.round(min + (max - min) * 0.45);
  } else if (min !== null) {
    premium = Math.round(min * 1.6);
    exclusive = Math.round(min * 2.4);
  } else if (max !== null) {
    basic = Math.round(max * 0.45);
    premium = Math.round(max * 0.7);
    exclusive = max;
  }

  const pricingTier = formatPricingTier(track.pricingTier);
  const priceLabel = (amount: number | null) =>
    formatCurrencyAmount(amount, track.budgetCurrency) ?? "A cotizar";

  const options: LicenseOption[] = [
    {
      id: "basic",
      title: "Licencia estándar",
      price: priceLabel(basic),
      formats: "MP3",
      note: "Uso digital base",
    },
    {
      id: "premium",
      title: "Licencia ampliada",
      price: priceLabel(premium),
      formats: "MP3, WAV",
      note: "Mayor alcance comercial",
    },
    {
      id: "exclusive",
      title: "Licencia exclusiva",
      price: priceLabel(exclusive),
      formats: "MP3, WAV, STEMS",
      note: pricingTier !== "—" ? `Tier ${pricingTier}` : "Asignación exclusiva del beat",
    },
  ];

  const licenseType = (track.licenseType ?? "").toUpperCase();
  if (licenseType === "EXCLUSIVE" || licenseType === "BUYOUT") {
    return [options[2]!];
  }
  if (licenseType === "NON_EXCLUSIVE") {
    return [options[0]!, options[1]!];
  }
  return options;
}

function getBadgeTone(type: "mood" | "use") {
  if (type === "mood") return "catalog-tag-mood";
  return "catalog-tag-use";
}

function hashToPositiveInt(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function resolveCover(url: string | null | undefined, seed: string): string {
  const clean = url?.trim();
  if (clean) return clean;
  return `https://loremflickr.com/960/960/music?lock=${hashToPositiveInt(seed)}`;
}

export default async function TrackPublicPage({ params }: PageProps) {
  const { id } = await params;

  const track = await db.track.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      artist: true,
      coverUrl: true,
      audioUrl: true,
      assetKey: true,
      waveform: true,
      durationSec: true,
      bpm: true,
      key: true,
      genres: true,
      subgenres: true,
      licenseType: true,
      pricingTier: true,
      budgetMin: true,
      budgetMax: true,
      budgetCurrency: true,
      oneStop: true,
      clearedForSync: true,
      mfn: true,
      mediaBuy: true,
      restrictions: true,
      updatedAt: true,
      versions: {
        select: { id: true, label: true, durationSec: true, kind: true },
        orderBy: { sortOrder: "asc" },
        take: 8,
      },
      stems: {
        select: { id: true, name: true, group: true },
        orderBy: { sortOrder: "asc" },
        take: 12,
      },
      tags: {
        select: {
          tag: {
            select: {
              type: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!track) notFound();

  const trackTags = (track.tags ?? []).map((tt) => tt.tag).filter(Boolean);
  const moodTags = trackTags.filter((tag) => tag.type === "MOOD");
  const useTags = trackTags.filter((tag) => tag.type === "USE");

  const moods = normalizeStrings(moodTags.map((tag) => tag.name), 10);
  const uses = normalizeStrings(useTags.map((tag) => tag.name), 10);
  const genres = normalizeStrings(track.genres ?? [], 6);

  const audioSrc = publicAudioUrl({ assetKey: track.assetKey, audioUrl: track.audioUrl });
  const waveformB64 = bytesToBase64(track.waveform as unknown as Buffer | null);
  const licenseOptions = deriveLicenseOptions(track);

  const similarWhere: Prisma.TrackWhereInput = moodTags.length
    ? {
        AND: [
          { id: { not: track.id } },
          {
            tags: {
              some: {
                tag: {
                  slug: { in: moodTags.map((tag) => tag.slug).slice(0, 2) },
                },
              },
            },
          },
        ],
      }
    : { id: { not: track.id } };

  let similarTracks = await db.track.findMany({
    where: similarWhere,
    orderBy: { updatedAt: "desc" },
    take: 8,
    select: {
      id: true,
      title: true,
      artist: true,
      coverUrl: true,
      audioUrl: true,
      durationSec: true,
      bpm: true,
      key: true,
      waveform: true,
      tags: {
        select: {
          tag: {
            select: {
              type: true,
              name: true,
            },
          },
        },
      },
      genres: true,
    },
  });

  if (similarTracks.length < 4) {
    const fallback = await db.track.findMany({
      where: { id: { not: track.id } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        artist: true,
        coverUrl: true,
        audioUrl: true,
        durationSec: true,
        bpm: true,
        key: true,
        waveform: true,
        tags: {
          select: {
            tag: {
              select: {
                type: true,
                name: true,
              },
            },
          },
        },
        genres: true,
      },
    });

    const map = new Map(similarTracks.map((item) => [item.id, item]));
    for (const item of fallback) {
      if (!map.has(item.id)) map.set(item.id, item);
    }
    similarTracks = Array.from(map.values()).slice(0, 8);
  }

  const similarCatalogTracks: SimilarTrack[] = similarTracks.map((item) => {
    const itemTags = (item.tags ?? []).map((tt) => tt.tag).filter(Boolean);
    const itemMoods = normalizeStrings(
      itemTags.filter((tag) => tag.type === "MOOD").map((tag) => tag.name),
      6,
    );
    const itemUses = normalizeStrings(
      itemTags.filter((tag) => tag.type === "USE").map((tag) => tag.name),
      6,
    );

    return {
      id: item.id,
      title: item.title,
      artist: item.artist,
      moods: itemMoods,
      uses: itemUses,
      genres: normalizeStrings(item.genres ?? [], 4),
      bpm: typeof item.bpm === "number" ? item.bpm : undefined,
      key: item.key ?? undefined,
      audioUrl: item.audioUrl,
      coverUrl: item.coverUrl,
      durationSec: item.durationSec,
      duration: formatDuration(item.durationSec),
      waveformB64: bytesToBase64(item.waveform as unknown as Buffer | null),
    };
  });

  const primaryGenre = genres[0] ?? "—";
  const coverUrl = resolveCover(track.coverUrl, track.id);
  const subgenreLabel = normalizeStrings(track.subgenres ?? [], 4).join(" · ") || "—";
  const restrictionTags = normalizeStrings(track.restrictions ?? [], 10);
  const updatedLabel = formatUpdated(track.updatedAt);

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto w-[90vw] max-w-[1700px] pb-20 pt-3 sm:pt-4">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-foreground/70 hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al catálogo
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              ODR Records · actualizado {updatedLabel}
            </span>
            <CopyLinkButton />
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
          <div className="space-y-4">
            <article className="relative overflow-hidden rounded-md border border-border bg-card/30">
              <img
                src={coverUrl}
                alt={`Cover de ${track.title}`}
                className="h-[280px] w-full object-cover sm:h-[340px] lg:h-[420px]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80">
                  ODR Records · Beat store
                </p>
                <h1 className="mt-1 text-2xl font-semibold leading-tight text-white sm:text-3xl">
                  {track.title}
                </h1>
                <p className="mt-1 text-sm text-white/85 sm:text-base">{track.artist || "Artista"}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded border border-white/35 bg-black/25 px-2 py-0.5 text-xs font-medium text-white/95">
                    BPM {track.bpm ? Math.round(track.bpm) : "—"}
                  </span>
                  <span className="rounded border border-white/35 bg-black/25 px-2 py-0.5 text-xs font-medium text-white/95">
                    Key {track.key || "—"}
                  </span>
                  <span className="rounded border border-white/35 bg-black/25 px-2 py-0.5 text-xs font-medium text-white/95">
                    {formatDuration(track.durationSec)}
                  </span>
                  <span className="rounded border border-white/35 bg-black/25 px-2 py-0.5 text-xs font-medium text-white/95">
                    {primaryGenre}
                  </span>
                </div>
              </div>
            </article>

            <article className="rounded-md border border-border bg-card/40 p-2.5 sm:p-3">
              <PublicAudioBar
                src={audioSrc}
                durationSec={track.durationSec ?? undefined}
                waveformB64={waveformB64}
                layout="inline"
                className="p-2"
              />
            </article>

            <section className="grid gap-3 lg:grid-cols-2">
              <article className="rounded-md border border-border bg-card/35 p-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/95">
                  Perfil sonoro
                </h3>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Género</dt>
                  <dd className="text-right font-semibold text-foreground">{primaryGenre}</dd>
                  <dt className="text-muted-foreground">Subgénero</dt>
                  <dd className="text-right font-semibold text-foreground">{subgenreLabel}</dd>
                  <dt className="text-muted-foreground">Tipo licencia</dt>
                  <dd className="text-right font-semibold text-foreground">{formatLicenseType(track.licenseType)}</dd>
                  <dt className="text-muted-foreground">Sync</dt>
                  <dd className="text-right font-semibold text-foreground">
                    {track.clearedForSync === false ? "Bajo revisión" : "Disponible"}
                  </dd>
                </dl>
              </article>

              <article className="rounded-md border border-border bg-card/35 p-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/95">
                  Moods y usos
                </h3>
                <div className="mt-2 space-y-2">
                  <div>
                    <p className="mb-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Moods</p>
                    <div className="flex flex-wrap gap-1.5">
                      {moods.length > 0 ? (
                        moods.map((mood) => (
                          <span
                            key={mood}
                            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getBadgeTone("mood")}`}
                          >
                            {mood}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin moods</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Usos</p>
                    <div className="flex flex-wrap gap-1.5">
                      {uses.length > 0 ? (
                        uses.map((use) => (
                          <span
                            key={use}
                            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getBadgeTone("use")}`}
                          >
                            {use}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin usos</span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            </section>
          </div>

          <aside className="space-y-3 xl:sticky xl:top-[calc(var(--header-h)+0.75rem)]">
            <section className="rounded-md border border-border bg-card/45 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-foreground/95">
                  <Disc3 className="h-4 w-4" />
                  Licencias disponibles
                </h2>
                <span className="text-xs text-muted-foreground">{formatPricingTier(track.pricingTier)}</span>
              </div>

              <div className="mt-3 grid gap-2">
                {licenseOptions.map((option) => (
                  <article key={option.id} className="rounded border border-border bg-background/75 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{option.title}</p>
                        <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                          {option.formats}
                        </p>
                      </div>
                      <p className="text-base font-semibold text-foreground">{option.price}</p>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">{option.note}</p>
                  </article>
                ))}
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <LicensingDialog
                  className="w-full justify-center border border-foreground bg-foreground text-background hover:opacity-90"
                  track={{
                    id: track.id,
                    title: track.title,
                    artist: track.artist,
                    durationSec: track.durationSec,
                    moods,
                    uses,
                    restrictions: restrictionTags,
                  }}
                />
                <Link
                  href={`/track/${track.id}#entregables`}
                  className="inline-flex items-center justify-center gap-2 rounded border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:border-foreground/70"
                >
                  <FileAudio2 className="h-4 w-4" />
                  Ver entregables
                </Link>
              </div>
            </section>

            <section className="rounded-md border border-border bg-card/35 p-3 sm:p-4">
              <h3 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-foreground/95">
                <SlidersHorizontal className="h-4 w-4" />
                Condiciones comerciales
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Rango presupuesto</dt>
                <dd className="text-right font-semibold text-foreground">
                  {formatCurrencyAmount(track.budgetMin, track.budgetCurrency) ?? "—"}
                  {track.budgetMax ? ` - ${formatCurrencyAmount(track.budgetMax, track.budgetCurrency)}` : ""}
                </dd>
                <dt className="text-muted-foreground">One-stop</dt>
                <dd className="text-right font-semibold text-foreground">
                  {track.oneStop === true ? "Sí" : track.oneStop === false ? "No" : "—"}
                </dd>
                <dt className="text-muted-foreground">Media buy</dt>
                <dd className="text-right font-semibold text-foreground">{track.mediaBuy || "—"}</dd>
                <dt className="text-muted-foreground">MFN</dt>
                <dd className="text-right font-semibold text-foreground">
                  {track.mfn === true ? "Sí" : track.mfn === false ? "No" : "—"}
                </dd>
              </dl>
            </section>

            <section className="rounded-md border border-border bg-card/35 p-3 sm:p-4">
              <h3 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-foreground/95">
                <ShieldCheck className="h-4 w-4" />
                Restricciones
              </h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {restrictionTags.length > 0 ? (
                  restrictionTags.map((restriction) => (
                    <span
                      key={restriction}
                      className="rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground"
                    >
                      {restriction}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Sin restricciones registradas</span>
                )}
              </div>
            </section>
          </aside>
        </section>

        <section id="entregables" className="mt-4 rounded-md border border-border bg-card/35 p-3 sm:p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground/95">Entregables del track</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <article className="rounded border border-border bg-background/70 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Versiones</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {track.versions.length > 0 ? (
                  track.versions.map((version) => (
                    <li key={version.id} className="flex items-center justify-between gap-2">
                      <span className="truncate text-foreground">{version.label || version.kind || "Versión"}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatDuration(version.durationSec)}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-muted-foreground">No hay versiones registradas.</li>
                )}
              </ul>
            </article>

            <article className="rounded border border-border bg-background/70 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Stems / Trackouts</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {track.stems.length > 0 ? (
                  track.stems.map((stem) => (
                    <li key={stem.id} className="flex items-center justify-between gap-2">
                      <span className="truncate text-foreground">{stem.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{stem.group || "—"}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-muted-foreground">No hay stems registrados.</li>
                )}
              </ul>
            </article>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground/95">Más beats para explorar</h2>
            <Link
              href="/catalog"
              className="text-xs font-semibold text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
            >
              Ver catálogo completo
            </Link>
          </div>

          {similarCatalogTracks.length > 0 ? (
            <CatalogClient
              tracks={similarCatalogTracks}
              hideHeader
              embedded
              showDetailPanel
              showFilteringControls
              title="Más beats"
              subtitle=""
              eyebrow=""
            />
          ) : (
            <p className="text-sm text-muted-foreground">No encontramos beats similares por ahora.</p>
          )}
        </section>
      </div>
    </div>
  );
}
