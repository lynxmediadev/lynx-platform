/* eslint-disable @next/next/no-img-element -- Las portadas provienen de URLs dinámicas de R2. */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Prisma } from "@prisma/client";
import CopyLinkButton from "@/components/public/CopyLinkButton";
import RelatedTracksStrip, {
  type RelatedTrack,
} from "@/components/track/RelatedTracksStrip";
import TrackContextPanel from "@/components/track/TrackContextPanel";
import TrackDeliverablesDialog from "@/components/track/TrackDeliverablesDialog";
import TrackLicensesDialog from "@/components/track/TrackLicensesDialog";
import TrackLicensesOverview from "@/components/track/TrackLicensesOverview";
import TrackSimpleAudioPlayer from "@/components/track/TrackSimpleAudioPlayer";
import { buildDummyBeatLeaseContract } from "@/lib/licenses/dummy-beat-lease-contract";
import type {
  LicenseSummaryItem,
  LicenseTermRow,
  TrackLicenseViewModel,
} from "@/lib/licenses/types";
import { resolvePublicTrackAudio } from "@/lib/storage/public-track-audio";
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
  assets: {
    where: { type: "PREVIEW", access: "PUBLIC", status: "VERIFIED" },
    select: { storageKey: true, type: true, access: true, status: true },
    orderBy: { updatedAt: "desc" },
    take: 1,
  },
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
    Prisma.TrackLicenseAssignmentGetPayload<{
      select: typeof trackLicenseAssignmentSelect;
    }>
  >;
};

function isMissingTrackLicenseAssignmentTable(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== "P2021") return false;
  const table = String(
    (error.meta as { table?: unknown } | undefined)?.table ?? "",
  );
  return table.includes("TrackLicenseAssignment");
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

function normalizeStrings(values?: string[] | null, limit = 8): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function publicAudioUrl(input: {
  assets?: Array<{ storageKey: string; type: string; access: string; status: string }>;
  assetKey: string | null;
  audioUrl: string | null;
}): string | null {
  return resolvePublicTrackAudio(input) || null;
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
  const fallbackCovers = [
    "/images/hero/hero-bg-1.png",
    "/images/hero/hero-bg-2.png",
    "/images/hero/hero-bg-3.png",
    "/images/hero/hero-bg-4.png",
  ];
  return (
    fallbackCovers[hashToPositiveInt(seed) % fallbackCovers.length] ??
    fallbackCovers[0]!
  );
}

function normalizeSummaryItems(raw: unknown): LicenseSummaryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const label =
        typeof (item as { label?: unknown }).label === "string"
          ? (item as { label: string }).label.trim()
          : "";
      const value =
        typeof (item as { value?: unknown }).value === "string"
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
      const label =
        typeof (item as { label?: unknown }).label === "string"
          ? (item as { label: string }).label.trim()
          : "";
      const value =
        typeof (item as { value?: unknown }).value === "string"
          ? (item as { value: string }).value.trim()
          : "";
      if (!label || !value) return null;
      return { label, value };
    })
    .filter((item): item is LicenseTermRow => Boolean(item))
    .slice(0, 160);
}

function buildDefaultAgreement(
  name: string,
  beatTitle: string,
  artist: string | null,
) {
  return buildDummyBeatLeaseContract({
    licenseName: name,
    beatTitle,
    producerName: "ODR Records",
    artistName: artist || "Artista",
    priceLabel: "A cotizar",
    currencyLabel: "CLP",
  });
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
      agreementText: buildDefaultAgreement(
        "Licencia estándar",
        `Track ${track.id}`,
        "Artista",
      ),
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
      agreementText: buildDefaultAgreement(
        "Licencia ampliada",
        `Track ${track.id}`,
        "Artista",
      ),
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
      agreementText: buildDefaultAgreement(
        "Licencia exclusiva",
        `Track ${track.id}`,
        "Artista",
      ),
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

function sortLicensesByPriceAsc(
  licenses: TrackLicenseViewModel[],
): TrackLicenseViewModel[] {
  return [...licenses].sort((a, b) => {
    const aHasPrice =
      typeof a.priceAmount === "number" && Number.isFinite(a.priceAmount);
    const bHasPrice =
      typeof b.priceAmount === "number" && Number.isFinite(b.priceAmount);

    if (aHasPrice && bHasPrice) {
      if (a.priceAmount !== b.priceAmount) {
        return (a.priceAmount as number) - (b.priceAmount as number);
      }
    } else if (aHasPrice !== bHasPrice) {
      // "A cotizar" (null) queda al final.
      return aHasPrice ? -1 : 1;
    }

    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }

    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });
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
    track = legacyRow
      ? ({ ...legacyRow, licenseAssignments: [] } as TrackWithLicenses)
      : null;
  }

  if (!track) notFound();

  const trackTags = (track.tags ?? []).map((tt) => tt.tag).filter(Boolean);
  const moodTags = trackTags.filter((tag) => tag.type === "MOOD");
  const useTags = trackTags.filter((tag) => tag.type === "USE");

  const moods = normalizeStrings(
    moodTags.map((tag) => tag.name),
    10,
  );
  const uses = normalizeStrings(
    useTags.map((tag) => tag.name),
    10,
  );
  const genres = normalizeStrings(track.genres ?? [], 6);

  const audioSrc = publicAudioUrl({
    assets: track.assets,
    assetKey: track.assetKey,
    audioUrl: track.audioUrl,
  });
  const primaryGenre = genres[0] ?? "—";
  const coverUrl = resolveCover(track.coverUrl, track.id);
  const subgenreLabel =
    normalizeStrings(track.subgenres ?? [], 4).join(" · ") || "—";
  const restrictionTags = normalizeStrings(track.restrictions ?? [], 10);
  const updatedLabel = formatUpdated(track.updatedAt);

  const assignedLicenses: TrackLicenseViewModel[] = track.licenseAssignments
    .filter(
      (assignment) =>
        assignment.isEnabled && assignment.licenseTemplate.status === "ACTIVE",
    )
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
        buildDefaultAgreement(template.name, track.title, track.artist);

      const currency =
        template.currency === "CLP" || template.currency === "EUR"
          ? template.currency
          : "USD";

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

  const shouldLoadFallbackLicenses = assignedLicenses.length === 0;
  const [ownerTemplates, globalTemplates, similarCandidates] =
    await Promise.all([
      shouldLoadFallbackLicenses && track.ownerUserId
        ? db.licenseTemplate.findMany({
            where: { ownerUserId: track.ownerUserId, status: "ACTIVE" },
            orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
            take: 6,
          })
        : Promise.resolve([]),
      shouldLoadFallbackLicenses
        ? db.licenseTemplate.findMany({
            where: { ownerUserId: null, status: "ACTIVE" },
            orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
            take: 6,
          })
        : Promise.resolve([]),
      db.track.findMany({
        where: { id: { not: track.id } },
        orderBy: { updatedAt: "desc" },
        take: 24,
        select: {
          id: true,
          title: true,
          artist: true,
          coverUrl: true,
          audioUrl: true,
          assetKey: true,
          assets: {
            where: { type: "PREVIEW", access: "PUBLIC", status: "VERIFIED" },
            select: { storageKey: true, type: true, access: true, status: true },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
          durationSec: true,
          bpm: true,
          key: true,
          genres: true,
          tags: {
            select: { tag: { select: { type: true, name: true } } },
          },
        },
      }),
    ]);

  let fallbackLicenses: TrackLicenseViewModel[] = [];
  if (shouldLoadFallbackLicenses) {
    const templateMap = new Map<string, (typeof ownerTemplates)[number]>();
    for (const template of ownerTemplates)
      templateMap.set(template.id, template);
    for (const template of globalTemplates) {
      if (!templateMap.has(template.id)) templateMap.set(template.id, template);
    }

    const merged = Array.from(templateMap.values()).slice(0, 6);
    fallbackLicenses = merged.map((template, index) => {
      const summaryItems = normalizeSummaryItems(template.summaryJson);
      const termRows = normalizeTermRows(template.termsMatrixJson);
      const agreementText =
        template.agreementText?.trim() ||
        buildDefaultAgreement(template.name, track.title, track.artist);
      const currency =
        template.currency === "CLP" || template.currency === "EUR"
          ? template.currency
          : "USD";

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

  const licenseCardsRaw =
    assignedLicenses.length > 0
      ? assignedLicenses
      : fallbackLicenses.length > 0
        ? fallbackLicenses
        : deriveLegacyFallbackLicenses(track);
  const licenseCards = sortLicensesByPriceAsc(licenseCardsRaw);

  const moodSet = new Set(moods.map((value) => value.toLocaleLowerCase("es")));
  const useSet = new Set(uses.map((value) => value.toLocaleLowerCase("es")));
  const genreSet = new Set(
    genres.map((value) => value.toLocaleLowerCase("es")),
  );
  const similarCatalogTracks: RelatedTrack[] = similarCandidates
    .map((item, index) => {
      const itemTags = item.tags.map((link) => link.tag).filter(Boolean);
      const sharedMoods = itemTags.filter(
        (tag) =>
          tag.type === "MOOD" && moodSet.has(tag.name.toLocaleLowerCase("es")),
      ).length;
      const sharedUses = itemTags.filter(
        (tag) =>
          tag.type === "USE" && useSet.has(tag.name.toLocaleLowerCase("es")),
      ).length;
      const sharedGenres = item.genres.filter((genre) =>
        genreSet.has(genre.toLocaleLowerCase("es")),
      ).length;
      return {
        item,
        index,
        score: sharedMoods * 3 + sharedUses * 2 + sharedGenres,
      };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 8)
    .map(({ item }) => ({
      id: item.id,
      title: item.title,
      artist: item.artist || "Artista",
      audioUrl:
        publicAudioUrl({ assets: item.assets, assetKey: item.assetKey, audioUrl: item.audioUrl }) ??
        "",
      coverUrl: resolveCover(item.coverUrl, item.id),
      durationSec: item.durationSec,
      bpm: item.bpm,
      key: item.key,
    }));

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto w-[90vw] max-w-[1700px] pt-3 pb-20 sm:pt-4">
        <header className="border-border mb-3 flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <Link
            href="/catalog"
            className="border-border text-muted-foreground hover:border-foreground/70 hover:text-foreground inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-xs font-semibold transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al catálogo
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-[11px] tracking-[0.12em] uppercase">
              ODR Records · actualizado {updatedLabel}
            </span>
            <CopyLinkButton />
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_350px] xl:items-stretch">
          <div className="flex flex-col gap-3 xl:h-full xl:justify-between xl:gap-0">
            <article className="border-border bg-card/30 relative overflow-hidden rounded-md border">
              <img
                src={coverUrl}
                alt={`Cover de ${track.title}`}
                className="h-[155px] w-full object-cover sm:h-[170px] md:h-[190px]"
                decoding="async"
                fetchPriority="high"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                <div className="flex flex-col gap-1.5">
                  <p className="text-[10px] leading-none font-semibold tracking-[0.16em] text-white/80 uppercase">
                    ODR Records · Track licensing
                  </p>
                  <h1 className="text-xl leading-tight font-semibold tracking-tight text-white sm:text-2xl">
                    {track.title}
                  </h1>
                  <p className="text-sm leading-snug text-white/85">
                    {track.artist || "Artista"}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex h-6 items-center rounded border border-white/35 bg-black/25 px-2 text-xs font-medium text-white/95">
                      BPM {track.bpm ? Math.round(track.bpm) : "—"}
                    </span>
                    <span className="inline-flex h-6 items-center rounded border border-white/35 bg-black/25 px-2 text-xs font-medium text-white/95">
                      Key {track.key || "—"}
                    </span>
                    <span className="inline-flex h-6 items-center rounded border border-white/35 bg-black/25 px-2 text-xs font-medium text-white/95">
                      {formatDuration(track.durationSec)}
                    </span>
                    <span className="inline-flex h-6 items-center rounded border border-white/35 bg-black/25 px-2 text-xs font-medium text-white/95">
                      {primaryGenre}
                    </span>
                  </div>
                </div>
              </div>
            </article>

            <TrackSimpleAudioPlayer
              trackId={track.id}
              title={track.title}
              artist={track.artist}
              src={audioSrc}
              coverUrl={coverUrl}
              durationSec={track.durationSec}
            />

            <TrackLicensesOverview licenses={licenseCards} />

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] lg:gap-3">
              <div>
                <TrackLicensesDialog
                  trackTitle={track.title}
                  trackArtist={track.artist}
                  licenses={licenseCards}
                />
              </div>
              <div className="hidden lg:block" aria-hidden />
              <div>
                <TrackDeliverablesDialog
                  trackTitle={track.title}
                  trackArtist={track.artist}
                  versions={track.versions}
                  stems={track.stems}
                />
              </div>
            </div>
          </div>

          <TrackContextPanel
            bpm={track.bpm}
            musicalKey={track.key}
            duration={formatDuration(track.durationSec)}
            syncAvailable={track.clearedForSync !== false}
            oneStop={track.oneStop}
            mfn={track.mfn}
            genre={primaryGenre}
            subgenre={subgenreLabel}
            moods={moods}
            uses={uses}
            restrictions={restrictionTags}
            exclusiveTerritories={normalizeStrings(
              track.exclusiveTerritories,
              6,
            )}
            restrictedTerritories={normalizeStrings(
              track.restrictedTerritories,
              6,
            )}
            restrictedIndustries={normalizeStrings(
              track.restrictedIndustries,
              6,
            )}
            restrictedPlatformsAndBrands={[
              ...normalizeStrings(track.restrictedPlatforms, 3),
              ...normalizeStrings(track.restrictedBrands, 3),
            ]}
          />
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-foreground/95 text-sm font-semibold tracking-[0.14em] uppercase">
              Más beats para explorar
            </h2>
            <Link
              href="/catalog"
              className="text-muted-foreground hover:text-foreground text-xs font-semibold underline-offset-4 transition hover:underline"
            >
              Ver catálogo completo
            </Link>
          </div>

          {similarCatalogTracks.length > 0 ? (
            <RelatedTracksStrip tracks={similarCatalogTracks} />
          ) : (
            <p className="text-muted-foreground text-sm">
              No encontramos beats similares por ahora.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
