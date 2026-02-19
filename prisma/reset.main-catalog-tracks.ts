import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const db = new PrismaClient();

async function main() {
  const mainCatalog = await db.playlist.findFirst({
    where: { isMainCatalog: true },
    select: {
      id: true,
      name: true,
      isAutoAllTracks: true,
      ownerUserId: true,
      _count: { select: { tracks: true } },
    },
  });

  if (!mainCatalog) {
    throw new Error("No existe playlist principal (isMainCatalog=true).");
  }

  const tracks = await db.track.findMany({
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: { id: true },
  });

  await db.$transaction(async (tx) => {
    if (mainCatalog.isAutoAllTracks) {
      await tx.playlist.update({
        where: { id: mainCatalog.id },
        data: { isAutoAllTracks: false },
      });
    }

    await tx.playlistTrack.deleteMany({
      where: { playlistId: mainCatalog.id },
    });

    if (tracks.length > 0) {
      await tx.playlistTrack.createMany({
        data: tracks.map((track, index) => ({
          playlistId: mainCatalog.id,
          trackId: track.id,
          sortOrder: index + 1,
        })),
        skipDuplicates: true,
      });
    }
  });

  console.log("Main catalog reset complete", {
    playlistId: mainCatalog.id,
    playlistName: mainCatalog.name,
    previousAutoAllTracks: mainCatalog.isAutoAllTracks,
    previousTrackLinks: mainCatalog._count.tracks,
    importedTracks: tracks.length,
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
