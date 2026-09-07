-- FASE 3: cola durable PostgreSQL para procesamiento local de audio.
CREATE TYPE "AudioJobType" AS ENUM ('PROCESS_ASSET');
CREATE TYPE "AudioJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

CREATE TABLE "AudioJob" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "trackId" TEXT NOT NULL,
  "assetId" TEXT,
  "jobType" "AudioJobType" NOT NULL DEFAULT 'PROCESS_ASSET',
  "status" "AudioJobStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "lockedAt" TIMESTAMP(3),
  "lockedBy" TEXT,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  CONSTRAINT "AudioJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AudioJob_idempotencyKey_key" ON "AudioJob"("idempotencyKey");
CREATE INDEX "AudioJob_status_availableAt_createdAt_idx" ON "AudioJob"("status", "availableAt", "createdAt");
CREATE INDEX "AudioJob_trackId_status_updatedAt_idx" ON "AudioJob"("trackId", "status", "updatedAt");
CREATE INDEX "AudioJob_assetId_status_idx" ON "AudioJob"("assetId", "status");
CREATE INDEX "AudioJob_lockedAt_idx" ON "AudioJob"("lockedAt");

ALTER TABLE "AudioJob" ADD CONSTRAINT "AudioJob_trackId_fkey"
  FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AudioJob" ADD CONSTRAINT "AudioJob_assetId_fkey"
  FOREIGN KEY ("assetId") REFERENCES "TrackAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
