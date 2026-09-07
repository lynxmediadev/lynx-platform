-- FASE 2: modelo aditivo de assets. No elimina ni modifica columnas legacy.
CREATE TYPE "TrackAssetType" AS ENUM ('MASTER', 'PREVIEW', 'STEM', 'ALTERNATE', 'DELIVERABLE');
CREATE TYPE "TrackAssetAccess" AS ENUM ('PUBLIC', 'PRIVATE');
CREATE TYPE "TrackAssetStatus" AS ENUM ('PENDING', 'UPLOADED', 'VERIFIED', 'FAILED', 'MISSING');
CREATE TYPE "TrackAssetBucket" AS ENUM ('PREVIEWS', 'PRIVATE');

CREATE TABLE "TrackAsset" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "trackId" TEXT NOT NULL,
  "type" "TrackAssetType" NOT NULL,
  "access" "TrackAssetAccess" NOT NULL,
  "status" "TrackAssetStatus" NOT NULL DEFAULT 'PENDING',
  "bucket" "TrackAssetBucket" NOT NULL,
  "storageKey" TEXT NOT NULL,
  "mime" TEXT,
  "sizeBytes" BIGINT,
  "checksumSha256" TEXT,
  "uploadedAt" TIMESTAMP(3),
  "verifiedAt" TIMESTAMP(3),
  "createdByUserId" TEXT,
  CONSTRAINT "TrackAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TrackAsset_bucket_storageKey_key" ON "TrackAsset"("bucket", "storageKey");
CREATE INDEX "TrackAsset_trackId_type_status_updatedAt_idx" ON "TrackAsset"("trackId", "type", "status", "updatedAt");
CREATE INDEX "TrackAsset_createdByUserId_createdAt_idx" ON "TrackAsset"("createdByUserId", "createdAt");

ALTER TABLE "TrackAsset"
  ADD CONSTRAINT "TrackAsset_trackId_fkey"
  FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;
