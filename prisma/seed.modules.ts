import { config as loadEnv } from "dotenv";
import {
  ContractStatus,
  Currency,
  PlaylistStatus,
  PlaylistVisibility,
  PrismaClient,
  ServiceCategory,
  ServiceOfferStatus,
  SoundKitStatus,
} from "@prisma/client";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const db = new PrismaClient();

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function pick<T>(values: T[]) {
  return values[Math.floor(Math.random() * values.length)];
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPublicId(prefix = "pl") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

const PLAYLIST_SEEDS = [
  "Sync Highlights",
  "Trailer Cuts",
  "Documentary Atmospheres",
  "TV Drama Cues",
  "Game Action Pack",
  "Indie Film Moods",
  "Ad Campaign Essentials",
  "Cinematic Pulse",
  "Underscore Collection",
  "Modern Hybrid Textures",
];

const SOUND_KIT_SEEDS = [
  "Cinematic Drums Kit",
  "Organic Percussion Kit",
  "Synth Motion Kit",
  "Ambient Design Kit",
  "Trailer Braams Kit",
  "Vocal Chops Kit",
  "Guitars Toolkit",
  "Lo-Fi Texture Kit",
  "Arpeggio Toolkit",
  "Transitions FX Kit",
  "Risers & Impacts Kit",
  "Minimal Pulse Kit",
];

const SERVICE_SEEDS: Array<{
  name: string;
  category: ServiceCategory;
  priceFrom: number;
  priceTo: number;
  turnaroundDays: number;
}> = [
  { name: "Mix & Master Single", category: "MIX_MASTER", priceFrom: 120, priceTo: 240, turnaroundDays: 5 },
  { name: "Mix & Master EP", category: "MIX_MASTER", priceFrom: 450, priceTo: 900, turnaroundDays: 14 },
  { name: "Full Production Track", category: "PRODUCTION", priceFrom: 800, priceTo: 1800, turnaroundDays: 21 },
  { name: "Custom Composition 60s", category: "COMPOSITION", priceFrom: 600, priceTo: 1400, turnaroundDays: 12 },
  { name: "Custom Composition 30s", category: "COMPOSITION", priceFrom: 400, priceTo: 900, turnaroundDays: 10 },
  { name: "Brand Sound Design Pack", category: "SOUND_DESIGN", priceFrom: 350, priceTo: 950, turnaroundDays: 9 },
  { name: "Podcast Audio Polish", category: "MIX_MASTER", priceFrom: 90, priceTo: 200, turnaroundDays: 3 },
  { name: "Live Session Cleanup", category: "OTHER", priceFrom: 180, priceTo: 500, turnaroundDays: 4 },
];

async function ensureTracks() {
  const existing = await db.track.findMany({
    select: { id: true, title: true, artist: true },
    take: 30,
    orderBy: { createdAt: "desc" },
  });

  if (existing.length > 0) return existing;

  const base = await db.track.createManyAndReturn({
    data: Array.from({ length: 12 }).map((_, idx) => ({
      title: `Module Track ${idx + 1}`,
      artist: "Lynx Lab",
      audioUrl: "/audio/demo.mp3",
      coverUrl: "/images/hero/hero-bg-1.png",
      assetKey: "external:///audio/demo.mp3",
      assetMime: "audio/mpeg",
      assetSize: 0,
    })),
    select: { id: true, title: true, artist: true },
  });

  return base;
}

async function seedPlaylists(trackIds: string[]) {
  for (let i = 0; i < PLAYLIST_SEEDS.length; i += 1) {
    const name = PLAYLIST_SEEDS[i]!;
    const slug = slugify(name);
    const statusPool: PlaylistStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
    const visibilityPool: PlaylistVisibility[] = ["PRIVATE", "INTERNAL", "PUBLIC"];

    const playlist = await db.playlist.upsert({
      where: { slug },
      update: {
        name,
        description: `${name} · selección curada para administración.`,
        status: statusPool[i % statusPool.length]!,
        visibility: visibilityPool[i % visibilityPool.length]!,
        featured: i % 4 === 0,
        sortOrder: i + 1,
      },
      create: {
        name,
        slug,
        publicId: randomPublicId(),
        description: `${name} · selección curada para administración.`,
        status: statusPool[i % statusPool.length]!,
        visibility: visibilityPool[i % visibilityPool.length]!,
        coverUrl: "/images/hero/hero-bg-1.png",
        featured: i % 4 === 0,
        sortOrder: i + 1,
      },
      select: { id: true },
    });

    await db.playlistTrack.deleteMany({ where: { playlistId: playlist.id } });
    const count = randInt(3, Math.min(8, trackIds.length));
    const shuffled = [...trackIds].sort(() => Math.random() - 0.5).slice(0, count);
    for (let t = 0; t < shuffled.length; t += 1) {
      await db.playlistTrack.create({
        data: {
          playlistId: playlist.id,
          trackId: shuffled[t]!,
          sortOrder: t + 1,
        },
      });
    }
  }
}

async function seedSoundKits() {
  for (let i = 0; i < SOUND_KIT_SEEDS.length; i += 1) {
    const name = SOUND_KIT_SEEDS[i]!;
    const slug = slugify(name);
    const statusPool: SoundKitStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
    const currencyPool: Currency[] = ["USD", "EUR", "CLP"];
    await db.soundKit.upsert({
      where: { slug },
      update: {
        name,
        description: `${name} · pack de samples/fx para catálogo.`,
        status: statusPool[i % statusPool.length]!,
        price: (i + 1) * 35,
        currency: currencyPool[i % currencyPool.length]!,
        featured: i % 3 === 0,
        sortOrder: i + 1,
      },
      create: {
        name,
        slug,
        description: `${name} · pack de samples/fx para catálogo.`,
        status: statusPool[i % statusPool.length]!,
        price: (i + 1) * 35,
        currency: currencyPool[i % currencyPool.length]!,
        coverUrl: "/images/hero/hero-bg-1.png",
        previewUrl: "/audio/demo.mp3",
        featured: i % 3 === 0,
        sortOrder: i + 1,
      },
    });
  }
}

async function seedServices() {
  for (let i = 0; i < SERVICE_SEEDS.length; i += 1) {
    const svc = SERVICE_SEEDS[i]!;
    const slug = slugify(svc.name);
    const statusPool: ServiceOfferStatus[] = ["ACTIVE", "PAUSED", "ARCHIVED"];
    await db.serviceOffer.upsert({
      where: { slug },
      update: {
        name: svc.name,
        category: svc.category,
        status: statusPool[i % statusPool.length]!,
        description: `${svc.name} · servicio operativo para clientes.`,
        priceFrom: svc.priceFrom,
        priceTo: svc.priceTo,
        currency: "USD",
        turnaroundDays: svc.turnaroundDays,
        featured: i % 3 === 0,
        sortOrder: i + 1,
      },
      create: {
        name: svc.name,
        slug,
        category: svc.category,
        status: statusPool[i % statusPool.length]!,
        description: `${svc.name} · servicio operativo para clientes.`,
        priceFrom: svc.priceFrom,
        priceTo: svc.priceTo,
        currency: "USD",
        turnaroundDays: svc.turnaroundDays,
        featured: i % 3 === 0,
        sortOrder: i + 1,
      },
    });
  }
}

async function seedContracts(trackRefs: Array<{ id: string; title: string | null }>) {
  const today = new Date();
  const statusPool: ContractStatus[] = ["DRAFT", "SENT", "NEGOTIATION", "SIGNED", "EXPIRED", "CANCELED"];

  for (let i = 1; i <= 15; i += 1) {
    const code = `LYNX-${today.getFullYear()}-${String(i).padStart(4, "0")}`;
    const status = statusPool[i % statusPool.length]!;
    const track = pick(trackRefs);
    const title = track?.title ? `Contrato ${track.title}` : `Contrato ${i}`;
    const startsAt = addDays(today, -randInt(5, 60));
    const endsAt = addDays(startsAt, randInt(30, 365));

    await db.contractRecord.upsert({
      where: { contractNumber: code },
      update: {
        title,
        counterpartyName: `Counterparty ${i}`,
        counterpartyEmail: `counterparty${i}@example.com`,
        status,
        amount: randInt(300, 5000),
        currency: i % 2 === 0 ? "USD" : "EUR",
        startsAt,
        endsAt,
        signedAt: status === "SIGNED" ? addDays(startsAt, randInt(1, 15)) : null,
        notes: `Contrato seed ${i}`,
        trackId: track?.id ?? null,
        requestId: null,
        fileUrl: null,
      },
      create: {
        contractNumber: code,
        title,
        counterpartyName: `Counterparty ${i}`,
        counterpartyEmail: `counterparty${i}@example.com`,
        status,
        amount: randInt(300, 5000),
        currency: i % 2 === 0 ? "USD" : "EUR",
        startsAt,
        endsAt,
        signedAt: status === "SIGNED" ? addDays(startsAt, randInt(1, 15)) : null,
        notes: `Contrato seed ${i}`,
        trackId: track?.id ?? null,
        requestId: null,
        fileUrl: null,
      },
    });
  }
}

async function main() {
  const tracks = await ensureTracks();
  const trackIds = tracks.map((t) => t.id);

  await seedPlaylists(trackIds);
  await seedSoundKits();
  await seedServices();
  await seedContracts(tracks.map((t) => ({ id: t.id, title: t.title })));

  console.log("✅ Modules seed completed (playlists/sound-kits/services/contracts).");
}

void main()
  .catch(async (error) => {
    console.error("❌ Modules seed error:", error);
    await db.$disconnect();
    process.exit(1);
  })
  .then(async () => {
    await db.$disconnect();
  });
