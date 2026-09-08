ALTER TABLE "Track" ADD COLUMN "isDraft" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TrackAsset" ADD COLUMN "originalFilename" TEXT;
ALTER TABLE "TrackAsset" ADD COLUMN "label" TEXT;
ALTER TABLE "TrackAsset" ADD COLUMN "isCurrent" BOOLEAN NOT NULL DEFAULT false;

-- Conserva el historial y designa una versión inicial de forma determinística.
WITH ranked AS (
  SELECT id, row_number() OVER (
    PARTITION BY "trackId", type ORDER BY "updatedAt" DESC, id DESC
  ) AS rn
  FROM "TrackAsset"
  WHERE type IN ('PREVIEW', 'MASTER') AND status = 'VERIFIED'
)
UPDATE "TrackAsset" asset
SET "isCurrent" = true
FROM ranked
WHERE asset.id = ranked.id AND ranked.rn = 1;

CREATE UNIQUE INDEX "TrackAsset_one_current_preview_per_track"
  ON "TrackAsset" ("trackId") WHERE type = 'PREVIEW' AND "isCurrent" = true;
CREATE UNIQUE INDEX "TrackAsset_one_current_master_per_track"
  ON "TrackAsset" ("trackId") WHERE type = 'MASTER' AND "isCurrent" = true;
