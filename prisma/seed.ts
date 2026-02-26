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

  // Mood catálogo controlado
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
  ];

  for (const name of moodSeeds) {
    const slug = slugify(name);
    await db.tag.upsert({
      where: { slug },
      update: { name, type: "MOOD" },
      create: { slug, name, type: "MOOD" },
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
      slug: "sync-basic-mp3",
      name: "Sync Basic MP3",
      status: "ACTIVE" as const,
      sortOrder: 10,
      isPopular: false,
      priceAmount: 49,
      currency: "USD" as const,
      formats: ["MP3"],
      summaryJson: [
        { label: "Distribución", value: "Hasta 5.000 copias" },
        { label: "Audio streams", value: "Hasta 50.000" },
        { label: "Videos", value: "1 video monetizable" },
      ],
      termsMatrixJson: [
        { label: "MP3", value: "Incluido" },
        { label: "WAV", value: "No incluido" },
        { label: "Trackouts", value: "No incluido" },
        { label: "Broadcasting", value: "No incluido" },
      ],
      agreementText:
        "Licencia no exclusiva básica para uso digital. No transfiere titularidad ni derechos de master/publishing.",
    },
    {
      slug: "sync-standard-wav",
      name: "Sync Standard WAV",
      status: "ACTIVE" as const,
      sortOrder: 20,
      isPopular: true,
      priceAmount: 99,
      currency: "USD" as const,
      formats: ["MP3", "WAV"],
      summaryJson: [
        { label: "Distribución", value: "Hasta 20.000 copias" },
        { label: "Audio streams", value: "Hasta 250.000" },
        { label: "Videos", value: "Hasta 3 videos monetizables" },
      ],
      termsMatrixJson: [
        { label: "MP3", value: "Incluido" },
        { label: "WAV", value: "Incluido" },
        { label: "Trackouts", value: "No incluido" },
        { label: "Broadcasting", value: "2 estaciones de radio" },
      ],
      agreementText:
        "Licencia no exclusiva estándar para campañas y contenido comercial medio. Requiere acreditación del productor.",
    },
    {
      slug: "sync-premium-trackouts",
      name: "Sync Premium Trackouts",
      status: "ACTIVE" as const,
      sortOrder: 30,
      isPopular: false,
      priceAmount: 199,
      currency: "USD" as const,
      formats: ["MP3", "WAV", "STEMS"],
      summaryJson: [
        { label: "Distribución", value: "Hasta 100.000 copias" },
        { label: "Audio streams", value: "Hasta 1.000.000" },
        { label: "Videos", value: "Uso ilimitado en redes" },
      ],
      termsMatrixJson: [
        { label: "MP3", value: "Incluido" },
        { label: "WAV", value: "Incluido" },
        { label: "Trackouts", value: "Incluido" },
        { label: "Broadcasting", value: "Ilimitado en digital" },
      ],
      agreementText:
        "Licencia premium con acceso a stems/trackouts para producciones de alto alcance comercial.",
    },
    {
      slug: "sync-exclusive-rights",
      name: "Sync Exclusive Rights",
      status: "ACTIVE" as const,
      sortOrder: 40,
      isPopular: false,
      priceAmount: 499,
      currency: "USD" as const,
      formats: ["MP3", "WAV", "STEMS"],
      summaryJson: [
        { label: "Exclusividad", value: "Sí (según contrato)" },
        { label: "Distribución", value: "Ilimitada" },
        { label: "Broadcasting", value: "Ilimitado" },
      ],
      termsMatrixJson: [
        { label: "MP3", value: "Incluido" },
        { label: "WAV", value: "Incluido" },
        { label: "Trackouts", value: "Incluido" },
        { label: "Derechos", value: "Exclusivo por contrato" },
      ],
      agreementText:
        "Licencia exclusiva sujeta a evaluación comercial. Requiere acuerdo contractual detallado por escrito.",
    },
  ];

  const templateRows: Array<{ id: string }> = [];
  for (const seed of licenseTemplateSeeds) {
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
        agreementText: seed.agreementText,
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
        agreementText: seed.agreementText,
      },
      select: { id: true },
    });
    templateRows.push(row);
  }

  for (let index = 0; index < seedTracks.length; index += 1) {
    const track = seedTracks[index];
    if (!track?.id) continue;

    const amount = 2 + (index % 3); // 2..4 licencias por track
    const selectedTemplates = Array.from({ length: amount }, (_, offset) => {
      const slot = (index + offset) % templateRows.length;
      return templateRows[slot];
    }).filter((row): row is { id: string } => Boolean(row?.id));

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
