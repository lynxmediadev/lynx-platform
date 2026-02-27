// ================================================
// File: prisma/seed.ts
// Título: Seed de Tracks (idempotente con upsert)
// Descripción: Inserta 5 pistas de ejemplo para pruebas del catálogo.
// Qué hace: Carga datos coherentes y repetibles en la tabla `Track`.
// Peras y manzanas: “Dejo cinco fichas listas en la libreta; si ya existen,
//                    las actualizo, si faltan, las creo.”
// ================================================
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { buildDummyBeatLeaseContract } from "../src/lib/licenses/dummy-beat-lease-contract";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const db = new PrismaClient();

const slugify = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

const MUSIC_KEYS = ["Am", "Cm", "Dm", "Em", "Fm", "Gm", "A#m", "C#m", "F#m", "Bb", "Eb", "Dm"];
const GENRE_PRESETS = [
  { genre: "Hip Hop", subgenre: "Boom Bap" },
  { genre: "Trap", subgenre: "Drill" },
  { genre: "Electronic", subgenre: "Synthwave" },
  { genre: "R&B", subgenre: "Neo Soul" },
  { genre: "Pop", subgenre: "Alt Pop" },
  { genre: "Cinematic", subgenre: "Hybrid Trailer" },
  { genre: "Lo-Fi", subgenre: "Jazz Hop" },
  { genre: "Urban", subgenre: "Latin Trap" },
];

type LicensePlanInput = {
  commercialUse: string;
  distributionCopies: string;
  audioStreams: string;
  videoStreams: string;
  musicVideos: string;
  livePerformances: string;
  broadcasting: string;
  radioStations: string;
  term: string;
  renewal: string;
  credits: string;
  exclusivity: string;
  formats: string[];
  contentId: string;
  syncUsage: string;
  paidPerformances: string;
  nonProfitPerformances: string;
  transfer: string;
  territory: string;
  sublicensing: string;
  stemsDelivery: string;
};

function buildLicenseContent(input: LicensePlanInput) {
  return {
    summaryJson: [
      { label: "Uso comercial", value: input.commercialUse },
      { label: "Copias de distribución", value: input.distributionCopies },
      { label: "Audio streams", value: input.audioStreams },
      { label: "Video streams", value: input.videoStreams },
      { label: "Videos monetizados", value: input.musicVideos },
      { label: "Presentaciones en vivo", value: input.livePerformances },
      { label: "Broadcasting", value: input.broadcasting },
      { label: "Estaciones de radio/TV", value: input.radioStations },
      { label: "Duración de la licencia", value: input.term },
      { label: "Renovación", value: input.renewal },
      { label: "Créditos obligatorios", value: input.credits },
      { label: "Exclusividad", value: input.exclusivity },
    ],
    termsMatrixJson: [
      { label: "MP3", value: input.formats.includes("MP3") ? "Incluido" : "No incluido" },
      { label: "WAV", value: input.formats.includes("WAV") ? "Incluido" : "No incluido" },
      { label: "Trackouts", value: input.formats.includes("TRACKOUTS") ? "Incluido" : "No incluido" },
      { label: "Stems", value: input.formats.includes("STEMS") ? "Incluido" : "No incluido" },
      { label: "Copias de distribución", value: input.distributionCopies },
      { label: "Audio streams", value: input.audioStreams },
      { label: "Video streams", value: input.videoStreams },
      { label: "Videos monetizados", value: input.musicVideos },
      { label: "Presentaciones en vivo", value: input.livePerformances },
      { label: "Paid performances", value: input.paidPerformances },
      { label: "Non-profit performances", value: input.nonProfitPerformances },
      { label: "Uso en Sync", value: input.syncUsage },
      { label: "Broadcasting", value: input.broadcasting },
      { label: "Estaciones de radio/TV", value: input.radioStations },
      { label: "Content ID", value: input.contentId },
      { label: "Entrega de stems", value: input.stemsDelivery },
      { label: "Territorio", value: input.territory },
      { label: "Transferencia", value: input.transfer },
      { label: "Sub-licencia", value: input.sublicensing },
      { label: "Duración de la licencia", value: input.term },
      { label: "Renovación", value: input.renewal },
      { label: "Créditos obligatorios", value: input.credits },
      { label: "Exclusividad", value: input.exclusivity },
    ],
  };
}

async function main() {
  // Puedes ajustar audioUrl a una URL pública si prefieres.
  const AUDIO = "/audio/demo.mp3";
  const COVER = "/images/hero/hero-bg-1.png";

  // Catálogo base único: SYNC
  const catalogs = [
    { slug: "sync", name: "Sync Licensing", description: "Música lista para proyectos audiovisuales y comerciales." },
  ];

  for (const c of catalogs) {
    await db.catalog.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description },
      create: { slug: c.slug, name: c.name, description: c.description },
    });
  }

  const catalogTags = [
    { slug: "sync", name: "SYNC", type: "CATALOG" as const },
    { slug: "games", name: "GAMES", type: "CATALOG" as const },
    { slug: "documental", name: "DOCUMENTAL", type: "CATALOG" as const },
    { slug: "advertising", name: "ADVERTISING", type: "CATALOG" as const },
    { slug: "cinematic", name: "CINEMATIC", type: "CATALOG" as const },
    { slug: "sync-series", name: "SYNC_SERIES", type: "CATALOG" as const },
  ];

  for (const t of catalogTags) {
    await db.tag.upsert({
      where: { slug: t.slug },
      update: { name: t.name, type: t.type },
      create: { slug: t.slug, name: t.name, type: t.type },
    });
  }

  // Mood / Use catálogo controlado
  const moodSeeds = [
    "HAPPY",
    "DARK",
    "EPIC",
    "CHILL",
    "DRAMATIC",
    "ROMANTIC",
    "AGGRESSIVE",
    "UPLIFTING",
    "TENSION",
    "MINIMAL",
    "ELEGANT",
    "EMOTIONAL",
    "ATMOSPHERIC",
    "WARM",
    "MOTIVATIONAL",
    "TENSE",
  ];
  const useSeeds = [
    "TRAILER",
    "ADVERTISEMENT",
    "FILM",
    "TV",
    "SERIES",
    "SOCIAL_MEDIA",
    "VIDEO_GAME",
    "PODCAST",
    "DOCUMENTAL",
    "CORPORATE",
    "BRAND_CAMPAIGN",
  ];

  for (const name of moodSeeds) {
    const slug = slugify(name);
    await db.tag.upsert({
      where: { slug },
      update: { name, type: "MOOD" },
      create: { slug, name, type: "MOOD" },
    });
  }
  for (const name of useSeeds) {
    const slug = slugify(name);
    await db.tag.upsert({
      where: { slug },
      update: { name, type: "USE" },
      create: { slug, name, type: "USE" },
    });
  }

  const seedTracks = [
    {
      id: "seed-001",
      title: "Golden Horizon (Seed Demo)",
      artist: "Lynx Music Collective",
      audioUrl: AUDIO,
      coverUrl: COVER,
      moods: ["EPIC", "EMOTIONAL", "ELEGANT"],
      uses: ["TV", "FILM", "ADVERTISEMENT"],
      // Identificadores / derechos mínimos opcionales
      isrc: null,
      iswc: null,
      upc: null,
      master: "ODR Records (One-Stop)",
      publishingSplit: "100% Lynx Music Collective",
      licenseType: "NON_EXCLUSIVE",
      exclusiveTerritories: ["WORLDWIDE"],
      exclusiveTermMonths: null,
      mediaBuy: null,
      mfn: null,
      restrictions: ["Sin campañas políticas"],
      contentIdEnrolled: null,
      contentIdAdmin: null,
      contentIdWhitelist: null,
      // Asset (modo URL directa)
      assetKey: "external:///audio/demo.mp3",
      assetMime: "audio/mpeg",
      assetSize: 0,
      // Técnicos (se poblarán en Fase C)
      durationSec: null,
      loudnessLufs: null,
    },
    {
      id: "seed-002",
      title: "Golden Horizon (Edit 60s)",
      artist: "Lynx Music Collective",
      audioUrl: AUDIO,
      coverUrl: COVER,
      moods: ["EPIC"],
      uses: ["TRAILER"],
      isrc: null,
      iswc: null,
      upc: null,
      master: "ODR Records (One-Stop)",
      publishingSplit: "100% Lynx Music Collective",
      licenseType: "NON_EXCLUSIVE",
      exclusiveTerritories: ["WORLDWIDE"],
      exclusiveTermMonths: null,
      mediaBuy: null,
      mfn: null,
      restrictions: [],
      contentIdEnrolled: null,
      contentIdAdmin: null,
      contentIdWhitelist: null,
      assetKey: "external:///audio/demo.mp3",
      assetMime: "audio/mpeg",
      assetSize: 0,
      durationSec: null,
      loudnessLufs: null,
    },
    {
      id: "seed-003",
      title: "Golden Horizon (Edit 30s)",
      artist: "Lynx Music Collective",
      audioUrl: AUDIO,
      coverUrl: COVER,
      moods: ["ELEGANT"],
      uses: ["ADVERTISEMENT", "VIDEO_GAME"],
      isrc: null,
      iswc: null,
      upc: null,
      master: "ODR Records (One-Stop)",
      publishingSplit: "100% Lynx Music Collective",
      licenseType: "NON_EXCLUSIVE",
      exclusiveTerritories: ["WORLDWIDE"],
      exclusiveTermMonths: null,
      mediaBuy: null,
      mfn: null,
      restrictions: [],
      contentIdEnrolled: null,
      contentIdAdmin: null,
      contentIdWhitelist: null,
      assetKey: "external:///audio/demo.mp3",
      assetMime: "audio/mpeg",
      assetSize: 0,
      durationSec: null,
      loudnessLufs: null,
    },
    {
      id: "seed-004",
      title: "Nocturne in Blue",
      artist: "Lynx Music Collective",
      audioUrl: AUDIO,
      coverUrl: COVER,
      moods: ["ATMOSPHERIC", "DARK"],
      uses: ["FILM", "SERIES"],
      isrc: null,
      iswc: null,
      upc: null,
      master: "ODR Records (One-Stop)",
      publishingSplit: "100% Lynx Music Collective",
      licenseType: "NON_EXCLUSIVE",
      exclusiveTerritories: ["WORLDWIDE"],
      exclusiveTermMonths: null,
      mediaBuy: null,
      mfn: null,
      restrictions: [],
      contentIdEnrolled: null,
      contentIdAdmin: null,
      contentIdWhitelist: null,
      assetKey: "external:///audio/demo.mp3",
      assetMime: "audio/mpeg",
      assetSize: 0,
      durationSec: null,
      loudnessLufs: null,
    },
    {
      id: "seed-005",
      title: "Sunlit Trails",
      artist: "Lynx Music Collective",
      audioUrl: AUDIO,
      coverUrl: COVER,
      moods: ["UPLIFTING", "WARM"],
      uses: ["ADVERTISEMENT", "TV"],
      isrc: null,
      iswc: null,
      upc: null,
      master: "ODR Records (One-Stop)",
      publishingSplit: "100% Lynx Music Collective",
      licenseType: "NON_EXCLUSIVE",
      exclusiveTerritories: ["WORLDWIDE"],
      exclusiveTermMonths: null,
      mediaBuy: null,
      mfn: null,
      restrictions: [],
      contentIdEnrolled: null,
      contentIdAdmin: null,
      contentIdWhitelist: null,
      assetKey: "external:///audio/demo.mp3",
      assetMime: "audio/mpeg",
      assetSize: 0,
      durationSec: null,
      loudnessLufs: null,
    },
  ];

  // Idempotente: upsert por id (si está, actualiza; si falta, crea)
  // Carga base en Track (sin arrays) y luego vincula pivote TrackTag
  for (const t of seedTracks) {
    const { moods, uses, ...rest } = t as any;

    await db.track.upsert({
      where: { id: t.id },
      update: rest,
      create: rest,
    });

    // Reasignar tags (moods/uses) en pivote TrackTag
    await db.trackTag.deleteMany({
      where: { trackId: t.id, tag: { type: { in: ["MOOD", "USE"] } } },
    });

    for (const m of moods) {
      const tag = await db.tag.findUnique({ where: { slug: slugify(m) } });
      if (tag?.id) await db.trackTag.create({ data: { trackId: t.id, tagId: tag.id } });
    }
    for (const u of uses) {
      const tag = await db.tag.findUnique({ where: { slug: slugify(u) } });
      if (tag?.id) await db.trackTag.create({ data: { trackId: t.id, tagId: tag.id } });
    }
  }

  const licenseTemplateSeeds = [
    {
      slug: "creator-mp3-lease",
      name: "Creator MP3 Lease",
      status: "ACTIVE" as const,
      sortOrder: 10,
      isPopular: false,
      priceAmount: 12000,
      currency: "CLP" as const,
      formats: ["MP3"],
      ...buildLicenseContent({
        formats: ["MP3"],
        commercialUse: "Single digital + redes orgánicas",
        distributionCopies: "Hasta 2.500 copias",
        audioStreams: "Hasta 25.000",
        videoStreams: "Hasta 30.000",
        musicVideos: "1 video monetizable",
        livePerformances: "Hasta 3 shows",
        paidPerformances: "Hasta 3 shows pagados",
        nonProfitPerformances: "Hasta 20 presentaciones",
        broadcasting: "No incluido",
        radioStations: "0 estaciones",
        term: "1 año",
        renewal: "Renovable por upgrade",
        credits: 'Obligatorio: "Prod. by ODR Records"',
        exclusivity: "No exclusiva",
        contentId: "No permitido",
        syncUsage: "No incluye campañas pagadas",
        transfer: "No transferible",
        territory: "Worldwide",
        sublicensing: "No permitido",
        stemsDelivery: "No incluido",
      }),
      notes: "Entrada comercial para demos y lanzamientos iniciales.",
    },
    {
      slug: "producer-wav-lease",
      name: "Producer WAV Lease",
      status: "ACTIVE" as const,
      sortOrder: 20,
      isPopular: true,
      priceAmount: 26000,
      currency: "CLP" as const,
      formats: ["MP3", "WAV"],
      ...buildLicenseContent({
        formats: ["MP3", "WAV"],
        commercialUse: "Distribución comercial digital",
        distributionCopies: "Hasta 15.000 copias",
        audioStreams: "Hasta 150.000",
        videoStreams: "Hasta 200.000",
        musicVideos: "Hasta 2 videos monetizables",
        livePerformances: "Hasta 10 shows",
        paidPerformances: "Hasta 10 shows pagados",
        nonProfitPerformances: "Hasta 100 presentaciones",
        broadcasting: "Incluye radio local",
        radioStations: "Hasta 2 estaciones",
        term: "3 años",
        renewal: "Extensión con tarifa preferente",
        credits: 'Obligatorio: "Prod. by ODR Records"',
        exclusivity: "No exclusiva",
        contentId: "Permitido solo por canción final",
        syncUsage: "Incluye ads orgánicos y branded content",
        transfer: "No transferible",
        territory: "Worldwide",
        sublicensing: "No permitido",
        stemsDelivery: "No incluido",
      }),
      notes: "Plan recomendado para artistas activos en plataformas.",
    },
    {
      slug: "trackout-pro-lease",
      name: "Trackout Pro Lease",
      status: "ACTIVE" as const,
      sortOrder: 30,
      isPopular: false,
      priceAmount: 89000,
      currency: "CLP" as const,
      formats: ["MP3", "WAV", "TRACKOUTS", "STEMS"],
      ...buildLicenseContent({
        formats: ["MP3", "WAV", "TRACKOUTS", "STEMS"],
        commercialUse: "Distribución comercial amplia",
        distributionCopies: "Hasta 75.000 copias",
        audioStreams: "Hasta 800.000",
        videoStreams: "Hasta 1.000.000",
        musicVideos: "Hasta 5 videos monetizables",
        livePerformances: "Hasta 35 shows",
        paidPerformances: "Hasta 35 shows pagados",
        nonProfitPerformances: "Ilimitadas",
        broadcasting: "Incluye radio y TV cable",
        radioStations: "Hasta 10 estaciones",
        term: "5 años",
        renewal: "Renovación automática opcional",
        credits: 'Obligatorio: "Prod. by ODR Records"',
        exclusivity: "No exclusiva",
        contentId: "Permitido en composición final",
        syncUsage: "Incluye campañas digitales pagadas",
        transfer: "No transferible",
        territory: "Worldwide",
        sublicensing: "No permitido",
        stemsDelivery: "Stems estéreo + trackouts",
      }),
      notes: "Plan pro para lanzamientos comerciales de mayor escala.",
    },
    {
      slug: "sync-campaign-license",
      name: "Sync Campaign License",
      status: "ACTIVE" as const,
      sortOrder: 40,
      isPopular: true,
      priceAmount: 149000,
      currency: "CLP" as const,
      formats: ["WAV", "TRACKOUTS", "STEMS"],
      ...buildLicenseContent({
        formats: ["WAV", "TRACKOUTS", "STEMS"],
        commercialUse: "Campañas de marca y contenidos paid media",
        distributionCopies: "Hasta 250.000 copias",
        audioStreams: "Hasta 2.500.000",
        videoStreams: "Hasta 3.000.000",
        musicVideos: "Hasta 10 videos monetizables",
        livePerformances: "Hasta 60 shows",
        paidPerformances: "Hasta 60 shows pagados",
        nonProfitPerformances: "Ilimitadas",
        broadcasting: "Incluye radio, TV abierta y OTT",
        radioStations: "Hasta 30 estaciones",
        term: "7 años",
        renewal: "Upgrade o extensión anual",
        credits: "Crédito recomendado según formato",
        exclusivity: "No exclusiva",
        contentId: "Permitido con whitelist acordada",
        syncUsage: "Incluye campañas paid media multi-plataforma",
        transfer: "No transferible",
        territory: "Worldwide",
        sublicensing: "No permitido",
        stemsDelivery: "Stems completos + versión instrumental",
      }),
      notes: "Diseñada para sync comercial, agencias y branded content.",
    },
    {
      slug: "unlimited-commercial-license",
      name: "Unlimited Commercial License",
      status: "ACTIVE" as const,
      sortOrder: 50,
      isPopular: false,
      priceAmount: 229000,
      currency: "CLP" as const,
      formats: ["MP3", "WAV", "TRACKOUTS", "STEMS"],
      ...buildLicenseContent({
        formats: ["MP3", "WAV", "TRACKOUTS", "STEMS"],
        commercialUse: "Explotación comercial ilimitada no exclusiva",
        distributionCopies: "Ilimitadas",
        audioStreams: "Ilimitados",
        videoStreams: "Ilimitados",
        musicVideos: "Ilimitados",
        livePerformances: "Ilimitadas",
        paidPerformances: "Ilimitadas",
        nonProfitPerformances: "Ilimitadas",
        broadcasting: "Ilimitado",
        radioStations: "Ilimitado",
        term: "Perpetua",
        renewal: "No requiere",
        credits: "Crédito recomendado",
        exclusivity: "No exclusiva",
        contentId: "Permitido con acuerdo técnico",
        syncUsage: "Incluye campañas globales y media buy",
        transfer: "No transferible",
        territory: "Worldwide",
        sublicensing: "No permitido",
        stemsDelivery: "Pack completo + alternates",
      }),
      notes: "Máxima cobertura no exclusiva para catálogos comerciales.",
    },
    {
      slug: "exclusive-buyout-license",
      name: "Exclusive Buyout License",
      status: "ACTIVE" as const,
      sortOrder: 60,
      isPopular: false,
      priceAmount: 299000,
      currency: "CLP" as const,
      formats: ["MP3", "WAV", "TRACKOUTS", "STEMS"],
      ...buildLicenseContent({
        formats: ["MP3", "WAV", "TRACKOUTS", "STEMS"],
        commercialUse: "Uso comercial total con exclusividad",
        distributionCopies: "Ilimitadas",
        audioStreams: "Ilimitados",
        videoStreams: "Ilimitados",
        musicVideos: "Ilimitados",
        livePerformances: "Ilimitadas",
        paidPerformances: "Ilimitadas",
        nonProfitPerformances: "Ilimitadas",
        broadcasting: "Ilimitado",
        radioStations: "Ilimitado",
        term: "Perpetua",
        renewal: "No requiere",
        credits: "Crédito negociable por contrato",
        exclusivity: "Exclusiva total",
        contentId: "Transferencia según contrato",
        syncUsage: "Incluye campañas globales con exclusividad",
        transfer: "Transferible solo por contrato",
        territory: "Worldwide",
        sublicensing: "Restringido por contrato",
        stemsDelivery: "Multitracks completos + sesiones",
      }),
      notes: "Compra exclusiva sujeta a validación legal y comercial.",
    },
  ];

  const templateRows: Array<{ id: string; slug: string; priceAmount: number }> = [];
  for (const seed of licenseTemplateSeeds) {
    const agreementText = buildDummyBeatLeaseContract({
      licenseName: seed.name,
      beatTitle: "Beat demo",
      producerName: "ODR Records",
      artistName: "Artista cliente",
      priceLabel: new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
      }).format(seed.priceAmount),
      currencyLabel: "CLP",
    });

    const row = await db.licenseTemplate.upsert({
      where: { slug: seed.slug },
      update: {
        name: seed.name,
        status: seed.status,
        sortOrder: seed.sortOrder,
        isPopular: seed.isPopular,
        priceAmount: seed.priceAmount,
        currency: seed.currency,
        formats: seed.formats,
        summaryJson: seed.summaryJson,
        termsMatrixJson: seed.termsMatrixJson,
        agreementText,
        notes: seed.notes,
      },
      create: {
        slug: seed.slug,
        name: seed.name,
        status: seed.status,
        sortOrder: seed.sortOrder,
        isPopular: seed.isPopular,
        priceAmount: seed.priceAmount,
        currency: seed.currency,
        formats: seed.formats,
        summaryJson: seed.summaryJson,
        termsMatrixJson: seed.termsMatrixJson,
        agreementText,
        notes: seed.notes,
      },
      select: { id: true, slug: true, priceAmount: true },
    });
    templateRows.push({ id: row.id, slug: row.slug, priceAmount: row.priceAmount ?? 0 });
  }

  const allTracks = await db.track.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      title: true,
      artist: true,
      genres: true,
      subgenres: true,
      bpm: true,
      key: true,
      oneStop: true,
      clearedForSync: true,
      mfn: true,
      restrictions: true,
      exclusiveTerritories: true,
      restrictedTerritories: true,
      restrictedIndustries: true,
      restrictedPlatforms: true,
      restrictedBrands: true,
      licenseType: true,
      mediaBuy: true,
      master: true,
      publishingSplit: true,
    },
  });

  const defaultRestrictions = [
    [] as string[],
    ["Sin uso político partidista"],
    ["Sin uso difamatorio o adulto explícito"],
    ["No registrar Content ID del instrumental aislado"],
  ];
  const defaultTerritoryRestrictions = [
    [] as string[],
    ["Chile"],
    ["Argentina", "Perú"],
    ["México"],
  ];
  const defaultIndustryRestrictions = [
    [] as string[],
    ["Alcohol"],
    ["Apuestas"],
    ["Política"],
  ];
  const defaultPlatformRestrictions = [
    [] as string[],
    ["TikTok Ads"],
    ["TV abierta"],
    ["Meta Ads"],
  ];
  const defaultBrandRestrictions = [
    [] as string[],
    ["Brand-X"],
    ["Brand-Y"],
    ["Brand-Z"],
  ];

  const moodTagSlugs = moodSeeds.map((item) => slugify(item));
  const useTagSlugs = useSeeds.map((item) => slugify(item));
  const tags = await db.tag.findMany({
    where: { slug: { in: [...moodTagSlugs, ...useTagSlugs] } },
    select: { id: true, slug: true },
  });
  const tagMap = new Map(tags.map((tag) => [tag.slug, tag.id]));

  for (let index = 0; index < allTracks.length; index += 1) {
    const track = allTracks[index];
    if (!track) continue;

    const amount = 2 + (index % 5); // 2..6 licencias por track
    const selectedTemplates = Array.from({ length: amount }, (_, offset) => {
      const slot = (index + offset) % templateRows.length;
      return templateRows[slot];
    }).filter((row): row is { id: string; slug: string; priceAmount: number } => Boolean(row?.id));

    const prices = selectedTemplates.map((item) => item.priceAmount).filter((v) => Number.isFinite(v));
    const budgetMin = prices.length > 0 ? Math.min(...prices) : 12000;
    const budgetMax = prices.length > 0 ? Math.max(...prices) : 299000;
    const pricingTier =
      budgetMax <= 30000 ? "LOW" : budgetMax <= 120000 ? "MID" : budgetMax <= 220000 ? "HIGH" : "BESPOKE";

    const genrePreset = GENRE_PRESETS[index % GENRE_PRESETS.length]!;
    const moodSelection = [
      moodSeeds[index % moodSeeds.length]!,
      moodSeeds[(index + 3) % moodSeeds.length]!,
      moodSeeds[(index + 7) % moodSeeds.length]!,
    ].map(slugify);
    const useSelection = [
      useSeeds[index % useSeeds.length]!,
      useSeeds[(index + 2) % useSeeds.length]!,
      useSeeds[(index + 5) % useSeeds.length]!,
    ].map(slugify);

    await db.track.update({
      where: { id: track.id },
      data: {
        bpm: track.bpm ?? 82 + ((index * 7) % 62),
        key: track.key || MUSIC_KEYS[index % MUSIC_KEYS.length] || "Am",
        genres: track.genres.length > 0 ? track.genres : [genrePreset.genre],
        subgenres: track.subgenres.length > 0 ? track.subgenres : [genrePreset.subgenre],
        oneStop: track.oneStop ?? index % 3 !== 0,
        clearedForSync: track.clearedForSync ?? true,
        mfn: track.mfn ?? index % 4 === 0,
        restrictions:
          track.restrictions.length > 0
            ? track.restrictions
            : defaultRestrictions[index % defaultRestrictions.length] || [],
        exclusiveTerritories:
          track.exclusiveTerritories.length > 0 ? track.exclusiveTerritories : ["Worldwide"],
        restrictedTerritories:
          track.restrictedTerritories.length > 0
            ? track.restrictedTerritories
            : defaultTerritoryRestrictions[index % defaultTerritoryRestrictions.length] || [],
        restrictedIndustries:
          track.restrictedIndustries.length > 0
            ? track.restrictedIndustries
            : defaultIndustryRestrictions[index % defaultIndustryRestrictions.length] || [],
        restrictedPlatforms:
          track.restrictedPlatforms.length > 0
            ? track.restrictedPlatforms
            : defaultPlatformRestrictions[index % defaultPlatformRestrictions.length] || [],
        restrictedBrands:
          track.restrictedBrands.length > 0
            ? track.restrictedBrands
            : defaultBrandRestrictions[index % defaultBrandRestrictions.length] || [],
        licenseType:
          track.licenseType ||
          (selectedTemplates.some((item) => item.slug === "exclusive-buyout-license")
            ? "EXCLUSIVE"
            : "NON_EXCLUSIVE"),
        mediaBuy: track.mediaBuy || "Disponible bajo negociación",
        master: track.master || "ODR Records",
        publishingSplit: track.publishingSplit || "100% ODR Publishing",
        budgetMin,
        budgetMax,
        budgetCurrency: "CLP",
        pricingTier,
      },
    });

    await db.trackTag.deleteMany({
      where: { trackId: track.id, tag: { type: { in: ["MOOD", "USE"] } } },
    });
    for (const slug of moodSelection) {
      const tagId = tagMap.get(slug);
      if (tagId) await db.trackTag.create({ data: { trackId: track.id, tagId } });
    }
    for (const slug of useSelection) {
      const tagId = tagMap.get(slug);
      if (tagId) await db.trackTag.create({ data: { trackId: track.id, tagId } });
    }

    await db.trackLicenseAssignment.deleteMany({ where: { trackId: track.id } });
    if (selectedTemplates.length > 0) {
      await db.trackLicenseAssignment.createMany({
        data: selectedTemplates.map((template, slotIndex) => ({
          trackId: track.id,
          licenseTemplateId: template.id,
          isEnabled: true,
          sortOrder: slotIndex + 1,
        })),
        skipDuplicates: true,
      });
    }
  }
}

main()
  .then(async () => {
    console.log("✅ Seed completado.");
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed error:", e);
    await db.$disconnect();
    process.exit(1);
  });
