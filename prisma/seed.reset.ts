// ================================================
// File: prisma/seed.reset.ts
// Título: Seed de Reset (destruye y recrea base mínima)
// Descripción: Elimina todos los registros de Track y re-inserta los 5 seeds base.
// Qué hace: Deja la tabla en un estado limpio y conocido.
// Peras y manzanas: “Vacío la libreta y vuelvo a copiar las cinco fichas base.”
// ================================================
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const db = new PrismaClient();

async function main() {
  // Protección: exige confirmación explícita
  if (process.env.RESET_CONFIRM !== "YES") {
    throw new Error(
      "Protección activa: define RESET_CONFIRM=YES para permitir el reset. " +
      "Ejemplo: RESET_CONFIRM=YES npm run db:seed:reset"
    );
  }

  // 1) Borrar todos los registros de Track.
  //    Nota: si tienes claves foráneas a Track, considera borrar en orden o TRUNCATE CASCADE.
  await db.track.deleteMany({});

  // 2) Volver a crear los 5 registros base (mismos del seed principal).
  const AUDIO = "/audio/demo.mp3";
  const COVER = "/images/hero/hero-bg-1.png";

  const seedRows = [
    {
      id: "seed-001",
      title: "Golden Horizon (Seed Demo)",
      artist: "Lynx Music Collective",
      audioUrl: AUDIO,
      coverUrl: COVER,
      moods: ["Epic", "Emotional", "Elegant"],
      uses: ["TV", "Cine", "Publicidad"],
      isrc: null,
      iswc: null,
      upc: null,
      master: "Lynx Media (One-Stop)",
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
      assetKey: "external:///audio/demo.mp3",
      assetMime: "audio/mpeg",
      assetSize: 0,
      durationSec: null,
      loudnessLufs: null,
    },
    {
      id: "seed-002",
      title: "Golden Horizon (Edit 60s)",
      artist: "Lynx Music Collective",
      audioUrl: AUDIO,
      coverUrl: COVER,
      moods: ["Epic"],
      uses: ["Trailers"],
      isrc: null,
      iswc: null,
      upc: null,
      master: "Lynx Media (One-Stop)",
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
      moods: ["Elegant"],
      uses: ["Publicidad","Videojuegos"],
      isrc: null,
      iswc: null,
      upc: null,
      master: "Lynx Media (One-Stop)",
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
      moods: ["Atmospheric","Dark"],
      uses: ["Cine","Series"],
      isrc: null,
      iswc: null,
      upc: null,
      master: "Lynx Media (One-Stop)",
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
      moods: ["Uplifting","Warm"],
      uses: ["Publicidad","TV"],
      isrc: null,
      iswc: null,
      upc: null,
      master: "Lynx Media (One-Stop)",
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

  for (const row of seedRows) {
    await db.track.create({ data: row });
  }

  console.log("✅ Reset completado. Tabla Track repoblada con 5 registros base.");
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
