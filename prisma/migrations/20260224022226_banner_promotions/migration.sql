-- CreateEnum
CREATE TYPE "BannerPlacement" AS ENUM ('CATALOG_HERO');

-- CreateEnum
CREATE TYPE "BannerTargetType" AS ENUM ('TRACK', 'PLAYLIST', 'SOUND_KIT', 'SERVICE_OFFER', 'ARTIST', 'EXTERNAL_URL');

-- CreateTable
CREATE TABLE "BannerPromotion" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "placement" "BannerPlacement" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "BannerPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BannerPromotionItem" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "promotionId" TEXT NOT NULL,
    "targetType" "BannerTargetType" NOT NULL,
    "targetId" TEXT,
    "titleOverride" TEXT,
    "subtitleOverride" TEXT,
    "imageUrlOverride" TEXT,
    "ctaLabel" TEXT,
    "ctaHrefOverride" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "durationMs" INTEGER NOT NULL DEFAULT 5000,

    CONSTRAINT "BannerPromotionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BannerPromotion_placement_isActive_startsAt_endsAt_updatedAt_idx" ON "BannerPromotion"("placement", "isActive", "startsAt", "endsAt", "updatedAt");

-- CreateIndex
CREATE INDEX "BannerPromotionItem_promotionId_sortOrder_idx" ON "BannerPromotionItem"("promotionId", "sortOrder");

-- CreateIndex
CREATE INDEX "BannerPromotionItem_isEnabled_startsAt_endsAt_sortOrder_idx" ON "BannerPromotionItem"("isEnabled", "startsAt", "endsAt", "sortOrder");

-- AddForeignKey
ALTER TABLE "BannerPromotionItem" ADD CONSTRAINT "BannerPromotionItem_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "BannerPromotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
