ddfer@DESKTOP-8TCFJ8A:~/projects/lynx-platform$ npm run dev -- --hostname 0.0.0.0 --port 3000

> lynx-media@0.1.0 dev
> next dev --hostname 0.0.0.0 --port 3000

   ▲ Next.js 15.5.12
   - Local:        http://localhost:3000
   - Network:      http://0.0.0.0:3000
   - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 1628ms
 ○ Compiling /api/catalog/hero-events ...
 ✓ Compiled /catalog in 2.7s (928 modules)
prisma:query INSERT INTO "public"."BannerPromotionEvent" ("id","createdAt","placement","itemId","eventType","sessionId","path","userAgent","ip") VALUES ($1,$2,CAST($3::text AS "public"."BannerPlacement"),$4,$5,$6,$7,$8,$9) RETURNING "public"."BannerPromotionEvent"."id", "public"."BannerPromotionEvent"."createdAt", "public"."BannerPromotionEvent"."placement"::text, "public"."BannerPromotionEvent"."itemId", "public"."BannerPromotionEvent"."eventType", "public"."BannerPromotionEvent"."sessionId", "public"."BannerPromotionEvent"."path", "public"."BannerPromotionEvent"."userAgent", "public"."BannerPromotionEvent"."ip"
 POST /api/catalog/hero-events 200 in 3466ms
prisma:query INSERT INTO "public"."BannerPromotionEvent" ("id","createdAt","placement","itemId","eventType","sessionId","path","userAgent","ip") VALUES ($1,$2,CAST($3::text AS "public"."BannerPlacement"),$4,$5,$6,$7,$8,$9) RETURNING "public"."BannerPromotionEvent"."id", "public"."BannerPromotionEvent"."createdAt", "public"."BannerPromotionEvent"."placement"::text, "public"."BannerPromotionEvent"."itemId", "public"."BannerPromotionEvent"."eventType", "public"."BannerPromotionEvent"."sessionId", "public"."BannerPromotionEvent"."path", "public"."BannerPromotionEvent"."userAgent", "public"."BannerPromotionEvent"."ip"
 POST /api/catalog/hero-events 200 in 3800ms
prisma:query SELECT "public"."Playlist"."id", "public"."Playlist"."publicId", "public"."Playlist"."slug", "public"."Playlist"."name", "public"."Playlist"."description", "public"."Playlist"."visibility"::text, "public"."Playlist"."status"::text, "public"."Playlist"."ownerUserId", "public"."Playlist"."isAutoAllTracks" FROM "public"."Playlist" WHERE "public"."Playlist"."isMainCatalog" = $1 ORDER BY "public"."Playlist"."updatedAt" DESC LIMIT $2 OFFSET $3
prisma:query SELECT "public"."PlaylistTrack"."playlistId", "public"."PlaylistTrack"."trackId" FROM "public"."PlaylistTrack" WHERE "public"."PlaylistTrack"."playlistId" = $1 ORDER BY "public"."PlaylistTrack"."sortOrder" ASC, "public"."PlaylistTrack"."createdAt" ASC LIMIT $2 OFFSET $3
prisma:query SELECT "public"."Track"."id", "public"."Track"."title", "public"."Track"."artist", "public"."Track"."genres", "public"."Track"."bpm", "public"."Track"."key", "public"."Track"."licenseType", "public"."Track"."pricingTier"::text, "public"."Track"."budgetMin", "public"."Track"."budgetMax", "public"."Track"."budgetCurrency"::text, "public"."Track"."clearedForSync", "public"."Track"."audioUrl", "public"."Track"."coverUrl", "public"."Track"."durationSec", "public"."Track"."waveform" FROM "public"."Track" WHERE "public"."Track"."id" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) OFFSET $13
prisma:query SELECT "public"."TrackTag"."trackId", "public"."TrackTag"."tagId" FROM "public"."TrackTag" LEFT JOIN "public"."Tag" AS "j0" ON ("j0"."id") = ("public"."TrackTag"."tagId") WHERE (("j0"."type" IN (CAST($1::text AS "public"."TagType"),CAST($2::text AS "public"."TagType")) AND ("j0"."id" IS NOT NULL)) AND "public"."TrackTag"."trackId" IN ($3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)) OFFSET $15
prisma:query SELECT "public"."Tag"."id", "public"."Tag"."name", "public"."Tag"."type"::text FROM "public"."Tag" WHERE "public"."Tag"."id" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28) OFFSET $29
prisma:query SELECT "public"."PromotionSlot"."id", "public"."PromotionSlot"."key", "public"."PromotionSlot"."isEnabled" FROM "public"."PromotionSlot" WHERE ("public"."PromotionSlot"."key" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query SELECT "public"."BannerPromotion"."id", "public"."BannerPromotion"."name", "public"."BannerPromotion"."startsAt", "public"."BannerPromotion"."updatedAt", "public"."BannerPromotion"."priority" FROM "public"."BannerPromotion" WHERE ("public"."BannerPromotion"."slotId" = $1 AND "public"."BannerPromotion"."status" = CAST($2::text AS "public"."PromotionCampaignStatus") AND "public"."BannerPromotion"."isActive" = $3 AND ("public"."BannerPromotion"."startsAt" IS NULL OR "public"."BannerPromotion"."startsAt" <= $4) AND ("public"."BannerPromotion"."endsAt" IS NULL OR "public"."BannerPromotion"."endsAt" >= $5)) OFFSET $6
prisma:query SELECT "public"."BannerPromotionItem"."id", "public"."BannerPromotionItem"."targetType"::text, "public"."BannerPromotionItem"."targetId", "public"."BannerPromotionItem"."titleOverride", "public"."BannerPromotionItem"."subtitleOverride", "public"."BannerPromotionItem"."imageUrlOverride", "public"."BannerPromotionItem"."ctaLabel", "public"."BannerPromotionItem"."ctaHrefOverride", "public"."BannerPromotionItem"."durationMs", "public"."BannerPromotionItem"."startsAt", "public"."BannerPromotionItem"."endsAt" FROM "public"."BannerPromotionItem" WHERE ("public"."BannerPromotionItem"."promotionId" = $1 AND "public"."BannerPromotionItem"."isEnabled" = $2 AND ("public"."BannerPromotionItem"."startsAt" IS NULL OR "public"."BannerPromotionItem"."startsAt" <= $3) AND ("public"."BannerPromotionItem"."endsAt" IS NULL OR "public"."BannerPromotionItem"."endsAt" >= $4)) ORDER BY "public"."BannerPromotionItem"."sortOrder" ASC, "public"."BannerPromotionItem"."createdAt" ASC LIMIT $5 OFFSET $6
prisma:query SELECT "public"."Track"."id", "public"."Track"."title", "public"."Track"."artist", "public"."Track"."bpm", "public"."Track"."coverUrl", "public"."Track"."audioUrl" FROM "public"."Track" WHERE "public"."Track"."id" IN ($1) OFFSET $2
 GET /catalog 200 in 4317ms
prisma:query INSERT INTO "public"."BannerPromotionEvent" ("id","createdAt","placement","itemId","eventType","sessionId","path","userAgent","ip") VALUES ($1,$2,CAST($3::text AS "public"."BannerPlacement"),$4,$5,$6,$7,$8,$9) RETURNING "public"."BannerPromotionEvent"."id", "public"."BannerPromotionEvent"."createdAt", "public"."BannerPromotionEvent"."placement"::text, "public"."BannerPromotionEvent"."itemId", "public"."BannerPromotionEvent"."eventType", "public"."BannerPromotionEvent"."sessionId", "public"."BannerPromotionEvent"."path", "public"."BannerPromotionEvent"."userAgent", "public"."BannerPromotionEvent"."ip"
 POST /api/catalog/hero-events 200 in 164ms
 ○ Compiling /track/[id] ...
 ✓ Compiled /track/[id] in 604ms (981 modules)
prisma:query SELECT "public"."Track"."id", "public"."Track"."title", "public"."Track"."artist", "public"."Track"."coverUrl", "public"."Track"."audioUrl", "public"."Track"."assetKey", "public"."Track"."durationSec", "public"."Track"."bpm", "public"."Track"."key", "public"."Track"."genres", "public"."Track"."subgenres", "public"."Track"."licenseType", "public"."Track"."pricingTier"::text, "public"."Track"."budgetMin", "public"."Track"."budgetMax", "public"."Track"."budgetCurrency"::text, "public"."Track"."oneStop", "public"."Track"."clearedForSync", "public"."Track"."mfn", "public"."Track"."restrictions", "public"."Track"."exclusiveTerritories", "public"."Track"."restrictedTerritories", "public"."Track"."restrictedIndustries", "public"."Track"."restrictedPlatforms", "public"."Track"."restrictedBrands", "public"."Track"."updatedAt", "public"."Track"."ownerUserId" FROM "public"."Track" WHERE ("public"."Track"."id" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query SELECT "public"."TrackVersion"."id", "public"."TrackVersion"."label", "public"."TrackVersion"."durationSec", "public"."TrackVersion"."kind"::text, "public"."TrackVersion"."trackId" FROM "public"."TrackVersion" WHERE "public"."TrackVersion"."trackId" IN ($1) ORDER BY "public"."TrackVersion"."sortOrder" ASC LIMIT $2 OFFSET $3
prisma:query SELECT "public"."TrackStem"."id", "public"."TrackStem"."name", "public"."TrackStem"."group"::text, "public"."TrackStem"."trackId" FROM "public"."TrackStem" WHERE "public"."TrackStem"."trackId" IN ($1) ORDER BY "public"."TrackStem"."sortOrder" ASC LIMIT $2 OFFSET $3
prisma:query SELECT "public"."TrackTag"."trackId", "public"."TrackTag"."tagId" FROM "public"."TrackTag" WHERE "public"."TrackTag"."trackId" IN ($1) OFFSET $2
prisma:query SELECT "public"."Tag"."id", "public"."Tag"."type"::text, "public"."Tag"."name", "public"."Tag"."slug" FROM "public"."Tag" WHERE "public"."Tag"."id" IN ($1,$2,$3,$4,$5,$6,$7) OFFSET $8
prisma:query SELECT "public"."TrackLicenseAssignment"."id", "public"."TrackLicenseAssignment"."isEnabled", "public"."TrackLicenseAssignment"."sortOrder", "public"."TrackLicenseAssignment"."priceOverride", "public"."TrackLicenseAssignment"."summaryOverrideJson", "public"."TrackLicenseAssignment"."termsOverrideJson", "public"."TrackLicenseAssignment"."agreementOverrideText", "public"."TrackLicenseAssignment"."licenseTemplateId", "public"."TrackLicenseAssignment"."trackId" FROM "public"."TrackLicenseAssignment" WHERE "public"."TrackLicenseAssignment"."trackId" IN ($1) ORDER BY "public"."TrackLicenseAssignment"."sortOrder" ASC, "public"."TrackLicenseAssignment"."updatedAt" DESC OFFSET $2
prisma:error 
Invalid `prisma.track.findUnique()` invocation:


The table `public.TrackLicenseAssignment` does not exist in the current database.
 ⨯ Error [PrismaClientKnownRequestError]: 
Invalid `prisma.track.findUnique()` invocation:


The table `public.TrackLicenseAssignment` does not exist in the current database.
    at async TrackPublicPage (src/app/track/[id]/page.tsx:291:17)
  289 |   const { id } = await params;
  290 |
> 291 |   const track = await db.track.findUnique({
      |                 ^
  292 |     where: { id },
  293 |     select: {
  294 |       id: true, {
  code: 'P2021',
  meta: [Object],
  clientVersion: '6.19.2',
  digest: '1665579414'
}
 GET /track/seed-003 200 in 2103ms
