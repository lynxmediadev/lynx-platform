import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Prisma } from "@prisma/client";
import CatalogClient from "@/app/catalog/CatalogClient";
import CopyLinkButton from "@/components/public/CopyLinkButton";
import TrackDeliverablesDialog from "@/components/track/TrackDeliverablesDialog";
import TrackLicensesDialog from "@/components/track/TrackLicensesDialog";
import TrackSimpleAudioPlayer from "@/components/track/TrackSimpleAudioPlayer";
import type {
  LicenseSummaryItem,
  LicenseTermRow,
  TrackLicenseViewModel,
} from "@/lib/licenses/types";
import { getS3PublicUrl } from "@/lib/storage/s3";
import { db } from "@/server/db";

type PageProps = {
  params: Promise<{ id: string }>;
};

const trackBaseSelect = {
  id: true,
  title: true,
  artist: true,
  coverUrl: true,
  audioUrl: true,
  assetKey: true,
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
  restrictions: true,
  exclusiveTerritories: true,
  restrictedTerritories: true,
  restrictedIndustries: true,
  restrictedPlatforms: true,
  restrictedBrands: true,
  updatedAt: true,
  ownerUserId: true,
  versions: {
    select: { id: true, label: true, durationSec: true, kind: true },
    orderBy: { sortOrder: "asc" },
    take: 20,
  },
  stems: {
    select: { id: true, name: true, group: true },
    orderBy: { sortOrder: "asc" },
    take: 30,
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
} satisfies Prisma.TrackSelect;

const trackLicenseAssignmentSelect = {
  id: true,
  isEnabled: true,
  sortOrder: true,
  priceOverride: true,
  summaryOverrideJson: true,
  termsOverrideJson: true,
  agreementOverrideText: true,
  licenseTemplate: {
    select: {
      id: true,
      name: true,
      status: true,
      sortOrder: true,
      isPopular: true,
      priceAmount: true,
      currency: true,
      formats: true,
      summaryJson: true,
      termsMatrixJson: true,
      agreementText: true,
      notes: true,
      ownerUserId: true,
    },
  },
} satisfies Prisma.TrackLicenseAssignmentSelect;

type TrackBase = Prisma.TrackGetPayload<{ select: typeof trackBaseSelect }>;
type TrackWithLicenses = TrackBase & {
  licenseAssignments: Array<
    Prisma.TrackLicenseAssignmentGetPayload<{ select: typeof trackLicenseAssignmentSelect }>
  >;
};

function isMissingTrackLicenseAssignmentTable(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== "P2021") return false;
  const table = String((error.meta as { table?: unknown } | undefined)?.table ?? "");
  return table.includes("TrackLicenseAssignment");
}

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
  licenseType: string | null;
  pricingTier: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetCurrency: string | null;
  clearedForSync: boolean | null;
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

function normalizeSummaryItems(raw: unknown): LicenseSummaryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const label = typeof (item as { label?: unknown }).label === "string"
        ? (item as { label: string }).label.trim()
        : "";
      const value = typeof (item as { value?: unknown }).value === "string"
        ? (item as { value: string }).value.trim()
        : "";
      if (!label || !value) return null;
      return { label, value };
    })
    .filter((item): item is LicenseSummaryItem => Boolean(item))
    .slice(0, 80);
}

function normalizeTermRows(raw: unknown): LicenseTermRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const label = typeof (item as { label?: unknown }).label === "string"
        ? (item as { label: string }).label.trim()
        : "";
      const value = typeof (item as { value?: unknown }).value === "string"
        ? (item as { value: string }).value.trim()
        : "";
      if (!label || !value) return null;
      return { label, value };
    })
    .filter((item): item is LicenseTermRow => Boolean(item))
    .slice(0, 160);
}

function buildDefaultAgreement(name: string) {
  return [
    `${name}`,
    "",
    "1. Licencia sujeta a aprobación y pago correspondiente.",
    "2. El productor conserva la titularidad del master y publishing.",
    "3. El uso del beat debe respetar límites y condiciones pactadas.",
  ].join("\n");
}

function formatLicenseType(value?: string | null) {
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

function deriveLegacyFallbackLicenses(track: {
  id: string;
  licenseType: string | null;
  pricingTier: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetCurrency: string | null;
}): TrackLicenseViewModel[] {
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

  const currency = (track.budgetCurrency ?? "USD").toUpperCase();
  const safeCurrency: "CLP" | "USD" | "EUR" =
    currency === "CLP" || currency === "EUR" ? currency : "USD";

  const items: TrackLicenseViewModel[] = [
    {
      id: `legacy-basic-${track.id}`,
      templateId: `legacy-basic-${track.id}`,
      name: "Licencia estándar",
      isPopular: false,
      priceAmount: basic,
      currency: safeCurrency,
      formats: ["MP3"],
      summaryItems: [
        { label: "Uso", value: "Distribución digital base" },
        { label: "Fuente", value: "Fallback legacy" },
      ],
      termRows: [
        { label: "MP3", value: "Incluido" },
        { label: "WAV", value: "No incluido" },
      ],
      agreementText: buildDefaultAgreement("Licencia estándar"),
      notes: null,
      source: "legacy-fallback",
      sortOrder: 1,
    },
    {
      id: `legacy-premium-${track.id}`,
      templateId: `legacy-premium-${track.id}`,
      name: "Licencia ampliada",
      isPopular: true,
      priceAmount: premium,
      currency: safeCurrency,
      formats: ["MP3", "WAV"],
      summaryItems: [
        { label: "Uso", value: "Mayor alcance comercial" },
        { label: "Fuente", value: "Fallback legacy" },
      ],
      termRows: [
        { label: "MP3", value: "Incluido" },
        { label: "WAV", value: "Incluido" },
      ],
      agreementText: buildDefaultAgreement("Licencia ampliada"),
      notes: track.pricingTier ? `Tier: ${track.pricingTier}` : null,
      source: "legacy-fallback",
      sortOrder: 2,
    },
    {
      id: `legacy-exclusive-${track.id}`,
      templateId: `legacy-exclusive-${track.id}`,
      name: "Licencia exclusiva",
      isPopular: false,
      priceAmount: exclusive,
      currency: safeCurrency,
      formats: ["MP3", "WAV", "STEMS"],
      summaryItems: [
        { label: "Uso", value: "Asignación exclusiva del track" },
        { label: "Tipo", value: formatLicenseType(track.licenseType) },
      ],
      termRows: [
        { label: "MP3", value: "Incluido" },
        { label: "WAV", value: "Incluido" },
        { label: "Trackouts", value: "Incluido" },
      ],
      agreementText: buildDefaultAgreement("Licencia exclusiva"),
      notes: null,
      source: "legacy-fallback",
      sortOrder: 3,
    },
  ];

  const normalizedType = (track.licenseType ?? "").toUpperCase();
  if (normalizedType === "EXCLUSIVE" || normalizedType === "BUYOUT") {
    return [items[2]!];
  }
  if (normalizedType === "NON_EXCLUSIVE") {
    return [items[0]!, items[1]!];
  }
  return items;
}

export default async function TrackPublicPage({ params }: PageProps) {
  const { id } = await params;

  let track: TrackWithLicenses | null = null;
  try {
    const row = await db.track.findUnique({
      where: { id },
      select: {
        ...trackBaseSelect,
        licenseAssignments: {
          select: trackLicenseAssignmentSelect,
          orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
        },
      },
    });
    track = row as TrackWithLicenses | null;
  } catch (error) {
    if (!isMissingTrackLicenseAssignmentTable(error)) {
      throw error;
    }
    console.warn(
      "[track-page] TrackLicenseAssignment table missing in DB. Falling back to legacy license rendering.",
    );
    const legacyRow = await db.track.findUnique({
      where: { id },
      select: trackBaseSelect,
    });
    track = legacyRow ? ({ ...legacyRow, licenseAssignments: [] } as TrackWithLicenses) : null;
  }

  if (!track) notFound();

  const trackTags = (track.tags ?? []).map((tt) => tt.tag).filter(Boolean);
  const moodTags = trackTags.filter((tag) => tag.type === "MOOD");
  const useTags = trackTags.filter((tag) => tag.type === "USE");

  const moods = normalizeStrings(moodTags.map((tag) => tag.name), 10);
  const uses = normalizeStrings(useTags.map((tag) => tag.name), 10);
  const genres = normalizeStrings(track.genres ?? [], 6);

  const audioSrc = publicAudioUrl({ assetKey: track.assetKey, audioUrl: track.audioUrl });
  const primaryGenre = genres[0] ?? "—";
  const coverUrl = resolveCover(track.coverUrl, track.id);
  const subgenreLabel = normalizeStrings(track.subgenres ?? [], 4).join(" · ") || "—";
  const restrictionTags = normalizeStrings(track.restrictions ?? [], 10);
  const updatedLabel = formatUpdated(track.updatedAt);

  const assignedLicenses: TrackLicenseViewModel[] = track.licenseAssignments
    .filter((assignment) => assignment.isEnabled && assignment.licenseTemplate.status === "ACTIVE")
    .map((assignment) => {
      const template = assignment.licenseTemplate;
      const summaryItems = normalizeSummaryItems(
        assignment.summaryOverrideJson ?? template.summaryJson,
      );
      const termRows = normalizeTermRows(
        assignment.termsOverrideJson ?? template.termsMatrixJson,
      );
      const agreementText =
        assignment.agreementOverrideText?.trim() ||
        template.agreementText?.trim() ||
        buildDefaultAgreement(template.name);

      const currency = template.currency === "CLP" || template.currency === "EUR" ? template.currency : "USD";

      return {
        id: assignment.id,
        templateId: template.id,
        name: template.name,
        isPopular: template.isPopular,
        priceAmount: assignment.priceOverride ?? template.priceAmount ?? null,
        currency,
        formats: normalizeStrings(template.formats ?? [], 8),
        summaryItems,
        termRows,
        agreementText,
        notes: template.notes,
        source: "assignment",
        sortOrder: assignment.sortOrder,
      } satisfies TrackLicenseViewModel;
    })
    .slice(0, 6);

  let fallbackLicenses: TrackLicenseViewModel[] = [];
  if (assignedLicenses.length === 0) {
    const ownerTemplates = track.ownerUserId
      ? await db.licenseTemplate.findMany({
          where: {
            ownerUserId: track.ownerUserId,
            status: "ACTIVE",
          },
          orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
          take: 6,
        })
      : [];

    const globalTemplates = await db.licenseTemplate.findMany({
      where: {
        ownerUserId: null,
        status: "ACTIVE",
      },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      take: 6,
    });

    const templateMap = new Map<string, (typeof ownerTemplates)[number]>();
    for (const template of ownerTemplates) templateMap.set(template.id, template);
    for (const template of globalTemplates) {
      if (!templateMap.has(template.id)) templateMap.set(template.id, template);
    }

    const merged = Array.from(templateMap.values()).slice(0, 6);
    fallbackLicenses = merged.map((template, index) => {
      const summaryItems = normalizeSummaryItems(template.summaryJson);
      const termRows = normalizeTermRows(template.termsMatrixJson);
      const agreementText =
        template.agreementText?.trim() || buildDefaultAgreement(template.name);
      const currency = template.currency === "CLP" || template.currency === "EUR" ? template.currency : "USD";

      return {
        id: `fallback-${template.id}`,
        templateId: template.id,
        name: template.name,
        isPopular: template.isPopular,
        priceAmount: template.priceAmount ?? null,
        currency,
        formats: normalizeStrings(template.formats ?? [], 8),
        summaryItems,
        termRows,
        agreementText,
        notes: template.notes,
        source: template.ownerUserId ? "owner-fallback" : "global-fallback",
        sortOrder: template.sortOrder ?? index,
      } satisfies TrackLicenseViewModel;
    });
  }

  const licenseCards =
    assignedLicenses.length > 0
      ? assignedLicenses
      : fallbackLicenses.length > 0
        ? fallbackLicenses
        : deriveLegacyFallbackLicenses(track);

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
      licenseType: true,
      pricingTier: true,
      budgetMin: true,
      budgetMax: true,
      budgetCurrency: true,
      clearedForSync: true,
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
        licenseType: true,
        pricingTier: true,
        budgetMin: true,
        budgetMax: true,
        budgetCurrency: true,
        clearedForSync: true,
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
      licenseType: item.licenseType,
      pricingTier: item.pricingTier,
      budgetMin: item.budgetMin,
      budgetMax: item.budgetMax,
      budgetCurrency: item.budgetCurrency,
      clearedForSync: item.clearedForSync,
    };
  });

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

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_350px] xl:items-start">
          <div className="space-y-3">
            <article className="relative overflow-hidden rounded-md border border-border bg-card/30">
              <img
                src={coverUrl}
                alt={`Cover de ${track.title}`}
                className="h-[260px] w-full object-cover sm:h-[320px] lg:h-[380px]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80">
                  ODR Records · Track licensing
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

            <div className="grid gap-2 sm:grid-cols-2">
              <TrackLicensesDialog
                trackTitle={track.title}
                trackArtist={track.artist}
                licenses={licenseCards}
              />
              <TrackDeliverablesDialog
                trackTitle={track.title}
                trackArtist={track.artist}
                versions={track.versions}
                stems={track.stems}
              />
            </div>

            <TrackSimpleAudioPlayer
              trackId={track.id}
              title={track.title}
              artist={track.artist}
              src={audioSrc}
              coverUrl={coverUrl}
              durationSec={track.durationSec}
            />
          </div>

          <aside className="space-y-3 xl:sticky xl:top-[calc(var(--header-h)+0.75rem)]">
            <section className="rounded-md border border-border bg-card/35 p-3">
              <h2 className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/95">
                <SlidersHorizontal className="h-4 w-4" />
                Snapshot del beat
              </h2>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <dt className="text-muted-foreground">BPM</dt>
                <dd className="text-right font-semibold text-foreground">
                  {track.bpm ? Math.round(track.bpm) : "—"}
                </dd>
                <dt className="text-muted-foreground">Tonalidad</dt>
                <dd className="text-right font-semibold text-foreground">{track.key || "—"}</dd>
                <dt className="text-muted-foreground">Duración</dt>
                <dd className="text-right font-semibold text-foreground">{formatDuration(track.durationSec)}</dd>
                <dt className="text-muted-foreground">Estado sync</dt>
                <dd className="text-right font-semibold text-foreground">
                  {track.clearedForSync === false ? "Bajo revisión" : "Disponible"}
                </dd>
                <dt className="text-muted-foreground">One-stop</dt>
                <dd className="text-right font-semibold text-foreground">
                  {track.oneStop === true ? "Sí" : track.oneStop === false ? "No" : "—"}
                </dd>
                <dt className="text-muted-foreground">MFN</dt>
                <dd className="text-right font-semibold text-foreground">
                  {track.mfn === true ? "Sí" : track.mfn === false ? "No" : "—"}
                </dd>
              </dl>
            </section>

            <section className="rounded-md border border-border bg-card/35 p-3">
              <h2 className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/95">
                <ShieldCheck className="h-4 w-4" />
                Perfil creativo
              </h2>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Género</dt>
                <dd className="text-right font-semibold text-foreground">{primaryGenre}</dd>
                <dt className="text-muted-foreground">Subgénero</dt>
                <dd className="truncate text-right font-semibold text-foreground">{subgenreLabel}</dd>
              </dl>
              <div className="mt-2.5 grid gap-2">
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
            </section>

            <section className="rounded-md border border-border bg-card/35 p-3">
              <h2 className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/95">
                <ShieldCheck className="h-4 w-4" />
                Cumplimiento y restricciones
              </h2>
              <div className="mt-2 space-y-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Restricciones</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
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
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="rounded border border-border bg-background/70 p-2">
                    <p className="font-semibold text-foreground">Territorios exclusivos</p>
                    <p className="mt-0.5 line-clamp-3">
                      {normalizeStrings(track.exclusiveTerritories, 6).join(", ") || "—"}
                    </p>
                  </div>
                  <div className="rounded border border-border bg-background/70 p-2">
                    <p className="font-semibold text-foreground">Territorios restringidos</p>
                    <p className="mt-0.5 line-clamp-3">
                      {normalizeStrings(track.restrictedTerritories, 6).join(", ") || "—"}
                    </p>
                  </div>
                  <div className="rounded border border-border bg-background/70 p-2">
                    <p className="font-semibold text-foreground">Industrias restringidas</p>
                    <p className="mt-0.5 line-clamp-3">
                      {normalizeStrings(track.restrictedIndustries, 6).join(", ") || "—"}
                    </p>
                  </div>
                  <div className="rounded border border-border bg-background/70 p-2">
                    <p className="font-semibold text-foreground">Plataformas/Marcas</p>
                    <p className="mt-0.5 line-clamp-3">
                      {[
                        ...normalizeStrings(track.restrictedPlatforms, 3),
                        ...normalizeStrings(track.restrictedBrands, 3),
                      ].join(", ") || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-md border border-border bg-card/35 p-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/95">
                Licencias
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Este track tiene {licenseCards.length} opción{licenseCards.length === 1 ? "" : "es"} de licencia.
              </p>
              <div className="mt-2 space-y-1">
                {licenseCards.slice(0, 3).map((license) => (
                  <div
                    key={license.id}
                    className="flex items-center justify-between gap-2 rounded border border-border bg-background/70 px-2 py-1.5"
                  >
                    <p className="truncate text-xs font-medium text-foreground">{license.name}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatCurrencyAmount(license.priceAmount, license.currency) ?? "A cotizar"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <TrackLicensesDialog
                  trackTitle={track.title}
                  trackArtist={track.artist}
                  licenses={licenseCards}
                />
              </div>
            </section>
          </aside>
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground/95">
              Más beats para explorar
            </h2>
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
