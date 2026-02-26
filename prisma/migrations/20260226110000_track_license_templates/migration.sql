-- CreateEnum
CREATE TYPE "LicenseTemplateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "LicenseTemplate" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerUserId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "LicenseTemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "priceAmount" INTEGER,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "formats" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "summaryJson" JSONB,
    "termsMatrixJson" JSONB,
    "agreementText" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "LicenseTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackLicenseAssignment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "trackId" TEXT NOT NULL,
    "licenseTemplateId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "priceOverride" INTEGER,
    "summaryOverrideJson" JSONB,
    "termsOverrideJson" JSONB,
    "agreementOverrideText" TEXT,

    CONSTRAINT "TrackLicenseAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LicenseTemplate_slug_key" ON "LicenseTemplate"("slug");

-- CreateIndex
CREATE INDEX "LicenseTemplate_status_sortOrder_updatedAt_idx" ON "LicenseTemplate"("status", "sortOrder", "updatedAt");

-- CreateIndex
CREATE INDEX "LicenseTemplate_ownerUserId_status_sortOrder_updatedAt_idx" ON "LicenseTemplate"("ownerUserId", "status", "sortOrder", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrackLicenseAssignment_trackId_licenseTemplateId_key" ON "TrackLicenseAssignment"("trackId", "licenseTemplateId");

-- CreateIndex
CREATE INDEX "TrackLicenseAssignment_trackId_isEnabled_sortOrder_idx" ON "TrackLicenseAssignment"("trackId", "isEnabled", "sortOrder");

-- CreateIndex
CREATE INDEX "TrackLicenseAssignment_licenseTemplateId_isEnabled_idx" ON "TrackLicenseAssignment"("licenseTemplateId", "isEnabled");

-- AddForeignKey
ALTER TABLE "LicenseTemplate" ADD CONSTRAINT "LicenseTemplate_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackLicenseAssignment" ADD CONSTRAINT "TrackLicenseAssignment_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackLicenseAssignment" ADD CONSTRAINT "TrackLicenseAssignment_licenseTemplateId_fkey" FOREIGN KEY ("licenseTemplateId") REFERENCES "LicenseTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
