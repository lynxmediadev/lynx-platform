import { config as loadEnv } from "dotenv";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const db = new PrismaClient();

function randomPublicId() {
  return crypto.randomBytes(8).toString("base64url").replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toLowerCase();
}

async function createUniquePublicId() {
  for (let i = 0; i < 10; i += 1) {
    const candidate = randomPublicId();
    const exists = await db.playlist.findUnique({
      where: { publicId: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

async function ensurePublicIds() {
  const playlists = await db.playlist.findMany({
    where: { publicId: "" },
    select: { id: true },
  });
  let fixed = 0;
  for (const playlist of playlists) {
    const publicId = await createUniquePublicId();
    await db.playlist.update({
      where: { id: playlist.id },
      data: { publicId },
    });
    fixed += 1;
  }
  return fixed;
}

async function ensureDefaultAllTracksPlaylists() {
  const users = await db.user.findMany({
    where: { role: { in: ["ADMIN", "STAFF", "CREATOR"] } },
    select: { id: true, role: true, name: true },
  });
  let created = 0;
  for (const user of users) {
    const exists = await db.playlist.findFirst({
      where: { ownerUserId: user.id, isAutoAllTracks: true },
      select: { id: true },
    });
    if (exists) continue;

    await db.playlist.create({
      data: {
        name: `All Tracks · ${user.name?.trim() || user.id.slice(-6)}`.slice(0, 120),
        slug: `all-tracks-${user.id.slice(0, 12)}`,
        publicId: await createUniquePublicId(),
        description: "Playlist automática con todos los tracks del owner.",
        status: "PUBLISHED",
        visibility: "INTERNAL",
        isAutoAllTracks: true,
        embedEnabled: true,
        ownerUserId: user.id,
      },
      select: { id: true },
    });
    created += 1;
  }
  return created;
}

async function ensureMainCatalog() {
  const current = await db.playlist.findFirst({
    where: { isMainCatalog: true },
    select: { id: true },
  });
  if (current) return { changed: false, id: current.id };

  let candidate = await db.playlist.findFirst({
    where: { status: "PUBLISHED", visibility: "PUBLIC" },
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    select: { id: true },
  });

  if (!candidate) {
    candidate = await db.playlist.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });
    if (!candidate) return { changed: false, id: null as string | null };

    await db.playlist.update({
      where: { id: candidate.id },
      data: { status: "PUBLISHED", visibility: "PUBLIC" },
    });
  }

  await db.playlist.update({
    where: { id: candidate.id },
    data: { isMainCatalog: true },
  });
  return { changed: true, id: candidate.id };
}

async function main() {
  const [publicIdsFixed, defaultCreated, mainCatalog] = await Promise.all([
    ensurePublicIds(),
    ensureDefaultAllTracksPlaylists(),
    ensureMainCatalog(),
  ]);

  console.log("Playlist backfill complete", {
    publicIdsFixed,
    defaultCreated,
    mainCatalog,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
