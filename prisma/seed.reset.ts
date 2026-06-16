// ================================================
// File: prisma/seed.reset.ts
// Título: Seed de Reset (destruye y recrea base mínima)
// Descripción: Elimina todos los registros de Track y re-inserta los 5 seeds base.
// Actualizado: migrado a sistema de TrackTag (moods/uses eliminados del modelo Track).
// ================================================
import { config as loadEnv } from "dotenv";
import { PrismaClient, TagType } from "@prisma/client";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const db = new PrismaClient();

const AUDIO = "/audio/demo.mp3";
const COVER = "/images/hero/hero-bg-1.png";

const TAGS = {
  moods: ["Epic", "Emotional", "Elegant", "Atmospheric", "Dark", "Uplifting", "Warm"],
  uses: ["TV", "Film", "Advertising", "Trailers", "Series", "Games"],
  catalog: ["Cinematic", "Orchestral", "Ambient", "Electronic"],
};

const seedTracks = [
  {
    id: "seed-001",
    title: "Golden Horizon (Seed Demo)",
    artist: "Lynx Music Collective",
    moods: ["Epic", "Emotional", "Elegant"],
    uses: ["TV", "Film"],
    categories: ["Cinematic", "Orchestral"],
  },
  {
    id: "seed-002",
    title: "Golden Horizon (Edit 60s)",
    artist: "Lynx Music Collective",
    moods: ["Epic"],
    uses: ["Trailers"],
    categories: ["Cinematic"],
  },
  {
    id: "seed-003",
    title: "Golden Horizon (Edit 30s)",
    artist: "Lynx Music Collective",
    moods: ["Elegant"],
    uses: ["Advertising", "Games"],
    categories: ["Electronic"],
  },
  {
    id: "seed-004",
    title: "Nocturne in Blue",
    artist: "Lynx Music Collective",
    moods: ["Atmospheric", "Dark"],
    uses: ["Film", "Series"],
    categories: ["Ambient", "Orchestral"],
  },
  {
    id: "seed-005",
    title: "Sunlit Trails",
    artist: "Lynx Music Collective",
    moods: ["Uplifting", "Warm"],
    uses: ["Advertising", "TV"],
    categories: ["Cinematic", "Electronic"],
  },
];

function slugify(str: string) {
  return str.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

async function main() {
  if (process.env.RESET_CONFIRM !== "YES") {
    throw new Error(
      "Protección activa: define RESET_CONFIRM=YES para permitir el reset. " +
      "Ejemplo: RESET_CONFIRM=YES npm run db:seed:reset"
    );
  }

  // 1) Limpiar en orden para respetar FK
  await db.playlistTrack.deleteMany({});
  await db.trackTag.deleteMany({});
  await db.track.deleteMany({});
  await db.tag.deleteMany({});
  await db.playlist.deleteMany({});

  // 2) Crear tags base
  const tagData = [
    ...TAGS.moods.map((name) => ({ name, slug: slugify(name), type: TagType.MOOD })),
    ...TAGS.uses.map((name) => ({ name, slug: slugify(name), type: TagType.USE })),
    ...TAGS.catalog.map((name) => ({ name, slug: slugify(name), type: TagType.CATALOG })),
  ];

  await db.tag.createMany({ data: tagData, skipDuplicates: true });

  const allTags = await db.tag.findMany({ select: { id: true, name: true, type: true } });
  const tagMap = new Map(allTags.map((t) => [`${t.type}:${t.name}`, t.id]));

  // 3) Crear tracks y asignar tags
  for (const seed of seedTracks) {
    await db.track.create({
      data: {
        id: seed.id,
        title: seed.title,
        artist: seed.artist,
        audioUrl: AUDIO,
        coverUrl: COVER,
        master: "ODR Records (One-Stop)",
        publishingSplit: "100% Lynx Music Collective",
        licenseType: "NON_EXCLUSIVE",
        exclusiveTerritories: ["WORLDWIDE"],
        restrictions: [],
        assetKey: "external:///audio/demo.mp3",
        assetMime: "audio/mpeg",
        assetSize: 0,
      },
    });

    const trackTagData: { trackId: string; tagId: string }[] = [];

    for (const name of seed.moods) {
      const tagId = tagMap.get(`MOOD:${name}`);
      if (tagId) trackTagData.push({ trackId: seed.id, tagId });
    }
    for (const name of seed.uses) {
      const tagId = tagMap.get(`USE:${name}`);
      if (tagId) trackTagData.push({ trackId: seed.id, tagId });
    }
    for (const name of seed.categories) {
      const tagId = tagMap.get(`CATALOG:${name}`);
      if (tagId) trackTagData.push({ trackId: seed.id, tagId });
    }

    if (trackTagData.length > 0) {
      await db.trackTag.createMany({ data: trackTagData, skipDuplicates: true });
    }
  }

  // 4) Crear playlist principal del catálogo
  const playlist = await db.playlist.create({
    data: {
      name: "ODR Catalog",
      slug: "odr-catalog",
      publicId: "odr-catalog-main",
      description: "Catálogo principal de ODR Records.",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      isMainCatalog: true,
      embedEnabled: true,
    },
    select: { id: true },
  });

  // 5) Vincular todos los tracks a la playlist principal
  await db.playlistTrack.createMany({
    data: seedTracks.map((t, i) => ({
      playlistId: playlist.id,
      trackId: t.id,
      sortOrder: i + 1,
    })),
    skipDuplicates: true,
  });

  console.log("✅ Reset completado: 5 tracks, tags base, playlist principal creada.");
}

main()
  .catch(async (e) => {
    console.error("❌ Reset error:", e);
    await db.$disconnect();
    process.exit(1);
  })
  .then(async () => {
    await db.$disconnect();
  });
