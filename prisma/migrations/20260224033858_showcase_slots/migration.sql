-- CreateEnum
CREATE TYPE "PromotionSlotFormat" AS ENUM ('HERO', 'SLIDER', 'STRIP', 'GRID', 'BANNER');

-- CreateEnum
CREATE TYPE "PromotionCampaignStatus" AS ENUM ('DRAFT', 'LIVE', 'PAUSED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "BannerPromotion" ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "slotId" TEXT,
ADD COLUMN     "status" "PromotionCampaignStatus" NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "placement" DROP NOT NULL;

ALTER TABLE "BannerPromotion" ALTER COLUMN "isActive" SET DEFAULT false;

-- CreateTable
CREATE TABLE "PromotionSlot" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" "PromotionSlotFormat" NOT NULL DEFAULT 'HERO',
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,

    CONSTRAINT "PromotionSlot_pkey" PRIMARY KEY ("id")
);

-- Seed default slot for current /catalog hero
INSERT INTO "PromotionSlot" ("id", "updatedAt", "key", "name", "format", "description", "isEnabled")
VALUES (
    'slot_catalog_hero_main',
    CURRENT_TIMESTAMP,
    'catalog.hero.main',
    'Catalog Hero Main',
    'HERO',
    'Hero principal del catalogo publico',
    true
)
ON CONFLICT ("id") DO NOTHING;

-- Backfill campaign relation + new status model
UPDATE "BannerPromotion"
SET "slotId" = 'slot_catalog_hero_main'
WHERE "slotId" IS NULL
  AND "placement" = 'CATALOG_HERO';

UPDATE "BannerPromotion"
SET "status" = CASE
  WHEN "isActive" = true THEN 'LIVE'::"PromotionCampaignStatus"
  ELSE 'DRAFT'::"PromotionCampaignStatus"
END;

-- Keep only one LIVE campaign per slot (most recent by startsAt/updatedAt)
WITH ranked AS (
  SELECT
    "id",
    "slotId",
    ROW_NUMBER() OVER (
      PARTITION BY "slotId"
      ORDER BY COALESCE("startsAt", to_timestamp(0)) DESC, "updatedAt" DESC
    ) AS "rn"
  FROM "BannerPromotion"
  WHERE "slotId" IS NOT NULL
    AND "status" = 'LIVE'::"PromotionCampaignStatus"
)
UPDATE "BannerPromotion" bp
SET
  "status" = 'PAUSED'::"PromotionCampaignStatus",
  "isActive" = false
FROM ranked r
WHERE bp."id" = r."id"
  AND r."rn" > 1;

UPDATE "BannerPromotion"
SET "isActive" = CASE WHEN "status" = 'LIVE'::"PromotionCampaignStatus" THEN true ELSE false END;

-- CreateIndex
CREATE UNIQUE INDEX "PromotionSlot_key_key" ON "PromotionSlot"("key");

-- CreateIndex
CREATE INDEX "PromotionSlot_isEnabled_updatedAt_idx" ON "PromotionSlot"("isEnabled", "updatedAt");

-- CreateIndex
CREATE INDEX "PromotionSlot_format_updatedAt_idx" ON "PromotionSlot"("format", "updatedAt");

-- CreateIndex
CREATE INDEX "BannerPromotion_slotId_status_startsAt_endsAt_updatedAt_idx" ON "BannerPromotion"("slotId", "status", "startsAt", "endsAt", "updatedAt");

-- CreateIndex
CREATE INDEX "BannerPromotion_slotId_priority_updatedAt_idx" ON "BannerPromotion"("slotId", "priority", "updatedAt");

-- Enforce one LIVE campaign per slot at DB level
CREATE UNIQUE INDEX "BannerPromotion_one_live_per_slot_idx"
ON "BannerPromotion"("slotId")
WHERE "status" = 'LIVE'::"PromotionCampaignStatus"
  AND "slotId" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "BannerPromotion" ADD CONSTRAINT "BannerPromotion_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "PromotionSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
