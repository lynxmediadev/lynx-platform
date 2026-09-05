// ================================================
// File: prisma/seed.bulk.ts
// Título: Seed Acumulativo (genera N pistas nuevas)
// Descripción: Inserta N pistas dummy para pruebas de volumen/paginación.
// Qué hace: Agrega registros sin borrar los existentes.
// Peras y manzanas: “Agrego muchas fichas nuevas para probar el catálogo grande.”
// ================================================
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const db = new PrismaClient();

const MOODS = [
  "Epic",
  "Emotional",
  "Elegant",
  "Atmospheric",
  "Dark",
  "Uplifting",
  "Warm",
  "Minimal",
  "Intense",
];
const USES = [
  "TV",
  "Cine",
  "Publicidad",
  "Trailers",
  "Series",
  "Videojuegos",
  "Documental",
  "Streaming",
];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pickSome<T>(arr: T[], min = 1, max = 3): T[] {
  const n = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function titleFor(i: number): string {
  const adj = [
    "Aurora",
    "Crimson",
    "Veridian",
    "Obsidian",
    "Saffron",
    "Azure",
    "Amber",
    "Ivory",
    "Magenta",
    "Cobalt",
  ];
  const noun = [
    "Trail",
    "Sky",
    "Pulse",
    "Horizon",
    "Echo",
    "River",
    "Storm",
    "Flare",
    "Canvas",
    "Voyage",
  ];
  const a = adj[i % adj.length];
  const b = noun[(i * 7) % noun.length];
  return `${a} ${b} #${i.toString().padStart(3, "0")}`;
}

async function main() {
  // Lee el conteo: primero argv, luego env, default 25
  const argN = Number(process.argv[2]);
  const envN = Number(process.env.BULK_COUNT);
  const COUNT = Number.isFinite(argN)
    ? argN
    : Number.isFinite(envN)
      ? envN
      : 25;

  const AUDIO = "/audio/demo.mp3";
  const COVER = "/images/hero/hero-bg-1.png";

  console.log(`⏳ Generando ${COUNT} pistas dummy…`);

  for (let i = 1; i <= COUNT; i++) {
    const t = titleFor(i);
    const moods = pickSome(MOODS);
    const uses = pickSome(USES);

    // Nota: NO seteamos id -> Prisma generará cuid()
    const track = await db.track.create({
      data: {
        title: t,
        artist: "Lynx Music Collective",
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

    for (const mood of moods) {
      const tag = await db.tag.upsert({
        where: { slug: slugify(mood) },
        update: {
          name: mood.toUpperCase(),
          type: "MOOD",
        },
        create: {
          slug: slugify(mood),
          name: mood.toUpperCase(),
          type: "MOOD",
        },
        select: { id: true },
      });
      await db.trackTag.create({
        data: {
          trackId: track.id,
          tagId: tag.id,
        },
      });
    }

    for (const use of uses) {
      const tag = await db.tag.upsert({
        where: { slug: slugify(use) },
        update: {
          name: use.toUpperCase(),
          type: "USE",
        },
        create: {
          slug: slugify(use),
          name: use.toUpperCase(),
          type: "USE",
        },
        select: { id: true },
      });
      await db.trackTag.create({
        data: {
          trackId: track.id,
          tagId: tag.id,
        },
      });
    }
  }

  console.log(`✅ Bulk seed completado. Insertadas ${COUNT} pistas.`);
}

void main()
  .catch(async (e) => {
    console.error("❌ Bulk seed error:", e);
    await db.$disconnect();
    process.exit(1);
  })
  .then(async () => {
    await db.$disconnect();
  });
