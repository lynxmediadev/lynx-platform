// ================================================
// File: src/app/api/tracks/[id]/route.ts
// Título: API Track por ID con fallback a demo
// Descripción: Intenta BD y, si falla o no existe, retorna un demo.
// Qué hace: Garantiza que /player/api-demo no se rompa.
// Peras y manzanas: “Si no está en la libreta, te muestro la muestra.”
// ================================================
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { getTrackById as getDemo } from "@/mocks/track-store";
import { canAccessTrackByRole, getRequestAuthUser } from "@/lib/account-auth/request-auth";
import { getRouteUser } from "@/lib/account-auth/route-guards";

const TRACK_TYPE_VALUES = ["INSTRUMENTAL", "VOCAL", "VOCAL_INSTRUMENTAL", "OTHER"] as const;
const PRICING_TIER_VALUES = ["LOW", "MID", "HIGH", "BESPOKE"] as const;
const LICENSE_TYPE_VALUES = ["NON_EXCLUSIVE", "EXCLUSIVE", "LIMITED_EXCLUSIVE", "BUYOUT"] as const;
const VERSION_KIND_VALUES = ["FULL", "CUTDOWN", "ALT_MIX", "INSTRUMENTAL", "VOCAL", "OTHER"] as const;
const STEM_GROUP_VALUES = ["INSTRUMENT", "VOCAL", "FX", "PERCUSSION", "OTHER"] as const;
const CURRENCY_VALUES = ["CLP", "USD", "EUR"] as const;

const trackTypeSchema = z.enum(TRACK_TYPE_VALUES);
const pricingTierSchema = z.enum(PRICING_TIER_VALUES);
const licenseTypeSchema = z.enum(LICENSE_TYPE_VALUES);
const versionKindSchema = z.enum(VERSION_KIND_VALUES);
const stemGroupSchema = z.enum(STEM_GROUP_VALUES);
const currencySchema = z.enum(CURRENCY_VALUES);

const versionSchema = z.object({
  label: z.string().min(1),
  durationSec: z.coerce.number().int().nonnegative().optional(),
  kind: versionKindSchema.optional(),
  audioUrl: z.string().url().optional(),
  assetKey: z.string().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

const stemSchema = z.object({
  name: z.string().min(1),
  group: stemGroupSchema.optional(),
  durationSec: z.coerce.number().int().nonnegative().optional(),
  audioUrl: z.string().url().optional(),
  assetKey: z.string().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

const publishingShareSchema = z.object({
  role: z.enum(["WRITER", "PUBLISHER"]),
  name: z.string().min(1),
  pro: z.string().optional(),
  caeNumber: z.string().optional(),
  ipiNumber: z.string().optional(),
  sharePct: z.coerce.number().int().min(0).max(100).optional(),
});

const trackMetaUpdateSchema = z
  .object({
    licenseType: licenseTypeSchema.optional(),
    mediaBuy: z.string().optional(),
    bpm: z.coerce.number().nonnegative().optional(),
    key: z.string().optional(),
    trackType: trackTypeSchema.optional(),
    genres: z.array(z.string()).optional(),
    subgenres: z.array(z.string()).optional(),
    oneStop: z.boolean().optional(),
    clearedForSync: z.boolean().optional(),
    exclusiveTerritories: z.array(z.string()).optional(),
    exclusiveTermMonths: z.coerce.number().int().nonnegative().optional(),
    restrictedTerritories: z.array(z.string()).optional(),
    restrictedIndustries: z.array(z.string()).optional(),
    restrictedPlatforms: z.array(z.string()).optional(),
    restrictedBrands: z.array(z.string()).optional(),
    pricingTier: pricingTierSchema.optional(),
    budgetMin: z.coerce.number().int().nonnegative().optional(),
    budgetMax: z.coerce.number().int().nonnegative().optional(),
    budgetCurrency: currencySchema.optional(),
    versions: z.array(versionSchema).optional(),
    stems: z.array(stemSchema).optional(),
    publishingShares: z.array(publishingShareSchema).optional(),
  })
  .strict();

function mapDb(row: any) {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    audioUrl: row.audioUrl,
    coverUrl: row.coverUrl ?? undefined,
    bpm: row.bpm ?? undefined,
    key: row.key ?? undefined,
    trackType: row.trackType ?? undefined,
    genres: row.genres ?? [],
    subgenres: row.subgenres ?? [],
    versions: Array.isArray(row.versions)
      ? row.versions.map((version: any) => ({
          label: version.label,
          durationSec: version.durationSec ?? undefined,
          kind: version.kind ?? undefined,
          audioUrl: version.audioUrl ?? undefined,
          assetKey: version.assetKey ?? undefined,
          sortOrder: version.sortOrder ?? undefined,
        }))
      : [],
    stems: Array.isArray(row.stems)
      ? row.stems.map((stem: any) => ({
          name: stem.name,
          group: stem.group ?? undefined,
          durationSec: stem.durationSec ?? undefined,
          audioUrl: stem.audioUrl ?? undefined,
          assetKey: stem.assetKey ?? undefined,
          sortOrder: stem.sortOrder ?? undefined,
        }))
      : [],
    publishingShares: Array.isArray(row.publishingShares)
      ? row.publishingShares.map((share: any) => ({
          role: share.role,
          name: share.name,
          pro: share.pro ?? undefined,
          caeNumber: share.caeNumber ?? undefined,
          ipiNumber: share.ipiNumber ?? undefined,
          sharePct: share.sharePct ?? undefined,
        }))
      : [],
  moods: row.moods ?? [],
  uses: row.uses ?? [],
    identifiers: { isrc: row.isrc ?? undefined, iswc: row.iswc ?? undefined, upc: row.upc ?? undefined },
    rights: {
      master: row.master ?? undefined,
      publishingSplit: row.publishingSplit ?? undefined,
      licenseType: row.licenseType ?? undefined,
      mediaBuy: row.mediaBuy ?? undefined,
      mfn: row.mfn ?? undefined,
      oneStop: row.oneStop ?? undefined,
      clearedForSync: row.clearedForSync ?? undefined,
      exclusiveTerritories: row.exclusiveTerritories ?? [],
      exclusiveTermMonths: row.exclusiveTermMonths ?? undefined,
      restrictedTerritories: row.restrictedTerritories ?? [],
      restrictedIndustries: row.restrictedIndustries ?? [],
      restrictedPlatforms: row.restrictedPlatforms ?? [],
      restrictedBrands: row.restrictedBrands ?? [],
      pricingTier: row.pricingTier ?? undefined,
      budgetMin: row.budgetMin ?? undefined,
      budgetMax: row.budgetMax ?? undefined,
      budgetCurrency: row.budgetCurrency ?? undefined,
      restrictions: row.restrictions ?? [],
      contentID: {
        enrolled: row.contentIdEnrolled ?? undefined,
        admin: row.contentIdAdmin ?? undefined,
        whitelist: row.contentIdWhitelist ?? undefined,
      },
    },
  };
}

// Campos seguros para el público — sin datos financieros ni de derechos internos
function mapPublic(row: any) {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    audioUrl: row.audioUrl,
    coverUrl: row.coverUrl ?? undefined,
    bpm: row.bpm ?? undefined,
    key: row.key ?? undefined,
    trackType: row.trackType ?? undefined,
    genres: row.genres ?? [],
    subgenres: row.subgenres ?? [],
    durationSec: row.durationSec ?? undefined,
    moods: row.moods ?? [],
    uses: row.uses ?? [],
    versions: Array.isArray(row.versions)
      ? row.versions.map((v: any) => ({
          label: v.label,
          durationSec: v.durationSec ?? undefined,
          kind: v.kind ?? undefined,
          sortOrder: v.sortOrder ?? undefined,
        }))
      : [],
    stems: Array.isArray(row.stems)
      ? row.stems.map((s: any) => ({
          name: s.name,
          group: s.group ?? undefined,
          durationSec: s.durationSec ?? undefined,
          sortOrder: s.sortOrder ?? undefined,
        }))
      : [],
  };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authUser = await getRouteUser();
  const isPrivileged = !!authUser && (authUser.role === "ADMIN" || authUser.role === "STAFF");

  try {
    const row = await db.track.findUnique({
      where: { id },
      include: {
        versions: true,
        stems: true,
        publishingShares: isPrivileged,
      },
    });
    if (row) {
      const payload = isPrivileged ? mapDb(row) : mapPublic(row);
      return NextResponse.json(payload, { status: 200, headers: { "Cache-Control": "no-store" } });
    }
  } catch (e) {
    console.error("[GET /api/tracks/:id] DB error:", e);
  }

  const demo = getDemo(id);
  if (demo) return NextResponse.json(demo, { status: 200, headers: { "Cache-Control": "no-store" } });

  return NextResponse.json({ error: "TRACK_NOT_FOUND", id }, { status: 404 });
}

function normalizeText(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeStringArray(values: string[] | undefined, uppercase = false) {
  if (!Array.isArray(values)) return [];
  const normalized = values
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => (uppercase ? value.toUpperCase() : value));
  return Array.from(new Set(normalized));
}

function normalizeNullableInt(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? Math.trunc(raw) : null;
  }
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function normalizeVersions(values: z.infer<typeof versionSchema>[] | undefined) {
  if (!Array.isArray(values)) return [];
  return values
    .map((version) => ({
      label: version.label.trim(),
      durationSec: normalizeNullableInt(version.durationSec),
      kind: version.kind ?? null,
      audioUrl: normalizeText(version.audioUrl),
      assetKey: normalizeText(version.assetKey),
      sortOrder: normalizeNullableInt(version.sortOrder),
    }))
    .filter((version) => version.label.length > 0);
}

function normalizeStems(values: z.infer<typeof stemSchema>[] | undefined) {
  if (!Array.isArray(values)) return [];
  return values
    .map((stem) => ({
      name: stem.name.trim(),
      group: stem.group ?? null,
      durationSec: normalizeNullableInt(stem.durationSec),
      audioUrl: normalizeText(stem.audioUrl),
      assetKey: normalizeText(stem.assetKey),
      sortOrder: normalizeNullableInt(stem.sortOrder),
    }))
    .filter((stem) => stem.name.length > 0);
}

function normalizePublishingShares(
  values: z.infer<typeof publishingShareSchema>[] | undefined,
) {
  if (!Array.isArray(values)) return [];
  return values
    .map((share) => ({
      role: share.role,
      name: share.name.trim(),
      pro: normalizeText(share.pro),
      caeNumber: normalizeText(share.caeNumber),
      ipiNumber: normalizeText(share.ipiNumber),
      sharePct: normalizeNullableInt(share.sharePct),
    }))
    .filter((share) => share.name.length > 0);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getRequestAuthUser(req);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const allowed = await canAccessTrackByRole(user, id);
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const json = await req.json();
    const parsed = trackMetaUpdateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Payload inválido", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (typeof input.licenseType !== "undefined") {
      updateData.licenseType = input.licenseType ?? null;
    }
    if (typeof input.mediaBuy !== "undefined") {
      updateData.mediaBuy = normalizeText(input.mediaBuy);
    }
    if (typeof input.bpm !== "undefined") {
      updateData.bpm =
        typeof input.bpm === "number" && Number.isFinite(input.bpm) ? input.bpm : null;
    }
    if (typeof input.key !== "undefined") updateData.key = normalizeText(input.key);
    if (typeof input.trackType !== "undefined") updateData.trackType = input.trackType ?? null;
    if (typeof input.genres !== "undefined") updateData.genres = normalizeStringArray(input.genres);
    if (typeof input.subgenres !== "undefined") updateData.subgenres = normalizeStringArray(input.subgenres);
    if (typeof input.oneStop !== "undefined") updateData.oneStop = input.oneStop;
    if (typeof input.clearedForSync !== "undefined") {
      updateData.clearedForSync = input.clearedForSync;
    }
    if (typeof input.exclusiveTerritories !== "undefined") {
      updateData.exclusiveTerritories = normalizeStringArray(input.exclusiveTerritories, true);
    }
    if (typeof input.exclusiveTermMonths !== "undefined") {
      updateData.exclusiveTermMonths = normalizeNullableInt(input.exclusiveTermMonths);
    }
    if (typeof input.restrictedTerritories !== "undefined") {
      updateData.restrictedTerritories = normalizeStringArray(input.restrictedTerritories, true);
    }
    if (typeof input.restrictedIndustries !== "undefined") {
      updateData.restrictedIndustries = normalizeStringArray(input.restrictedIndustries);
    }
    if (typeof input.restrictedPlatforms !== "undefined") {
      updateData.restrictedPlatforms = normalizeStringArray(input.restrictedPlatforms);
    }
    if (typeof input.restrictedBrands !== "undefined") {
      updateData.restrictedBrands = normalizeStringArray(input.restrictedBrands);
    }
    if (typeof input.pricingTier !== "undefined") updateData.pricingTier = input.pricingTier ?? null;
    if (typeof input.budgetMin !== "undefined") updateData.budgetMin = normalizeNullableInt(input.budgetMin);
    if (typeof input.budgetMax !== "undefined") updateData.budgetMax = normalizeNullableInt(input.budgetMax);
    if (typeof input.budgetCurrency !== "undefined") {
      updateData.budgetCurrency = input.budgetCurrency ?? null;
    }

    const versions = normalizeVersions(input.versions);
    const stems = normalizeStems(input.stems);
    const publishingShares = normalizePublishingShares(input.publishingShares);

    await db.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx.track.update({
          where: { id },
          data: updateData,
        });
      }

      if (typeof input.versions !== "undefined") {
        await tx.trackVersion.deleteMany({ where: { trackId: id } });
        if (versions.length) {
          await tx.trackVersion.createMany({
            data: versions.map((version) => ({
              trackId: id,
              label: version.label,
              durationSec: version.durationSec ?? null,
              kind: version.kind ?? null,
              audioUrl: version.audioUrl ?? null,
              assetKey: version.assetKey ?? null,
              sortOrder: version.sortOrder ?? null,
            })),
          });
        }
      }

      if (typeof input.stems !== "undefined") {
        await tx.trackStem.deleteMany({ where: { trackId: id } });
        if (stems.length) {
          await tx.trackStem.createMany({
            data: stems.map((stem) => ({
              trackId: id,
              name: stem.name,
              group: stem.group ?? null,
              durationSec: stem.durationSec ?? null,
              audioUrl: stem.audioUrl ?? null,
              assetKey: stem.assetKey ?? null,
              sortOrder: stem.sortOrder ?? null,
            })),
          });
        }
      }

      if (typeof input.publishingShares !== "undefined") {
        await tx.publishingShare.deleteMany({ where: { trackId: id } });
        if (publishingShares.length) {
          await tx.publishingShare.createMany({
            data: publishingShares.map((share) => ({
              trackId: id,
              role: share.role,
              name: share.name,
              pro: share.pro ?? null,
              caeNumber: share.caeNumber ?? null,
              ipiNumber: share.ipiNumber ?? null,
              sharePct: share.sharePct ?? null,
            })),
          });
        }
      }
    });

    return NextResponse.json({ ok: true, id }, { status: 200 });
  } catch (err) {
    console.error("[PATCH /api/tracks/:id] error inesperado:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno al actualizar track" },
      { status: 500 },
    );
  }
}
