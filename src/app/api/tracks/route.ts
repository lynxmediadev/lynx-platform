// src/app/api/tracks/route.ts
/**
 * API de Tracks (App Router)
 *
 * Ruta:
 *   - POST /api/tracks  → crear track a partir de un payload JSON
 *   - GET  /api/tracks  → listar tracks (uso general/admin)
 *
 * Peras y manzanas:
 * - POST se usa desde el flujo de ingest (AdminTrackIngestPage):
 *     • Recibe título, artista, audioUrl (via `audio.url`),
 *       moods, uses, coverUrl.
 *     • AHORA también recibe:
 *         - assetKey: clave interna del objeto en R2/S3
 *         - assetMime: MIME del archivo subido (ej: audio/wav)
 *         - assetSize: tamaño en bytes
 * - Guardamos esos campos en la tabla Track para poder:
 *     • Construir URLs públicas (getS3PublicUrl) cuando haga falta.
 *     • Borrar físicamente el asset en R2 usando assetKey.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { TagType } from "@prisma/client";
import {
  APP_SESSION_COOKIE,
  getSessionUserFromCookie,
} from "@/lib/account-auth/session";
import { getRequestAuthUser } from "@/lib/account-auth/request-auth";
import { slugify } from "@/lib/slugify";
import { syncTrackTagsByType } from "@/server/tags/syncTrackTagsByType";
import { db } from "@/server/db";

const TRACK_TYPE_VALUES = [
  "INSTRUMENTAL",
  "VOCAL",
  "VOCAL_INSTRUMENTAL",
  "OTHER",
] as const;
const PRICING_TIER_VALUES = ["LOW", "MID", "HIGH", "BESPOKE"] as const;
const LICENSE_TYPE_VALUES = [
  "NON_EXCLUSIVE",
  "EXCLUSIVE",
  "LIMITED_EXCLUSIVE",
  "BUYOUT",
] as const;
const VERSION_KIND_VALUES = [
  "FULL",
  "CUTDOWN",
  "ALT_MIX",
  "INSTRUMENTAL",
  "VOCAL",
  "OTHER",
] as const;
const STEM_GROUP_VALUES = [
  "INSTRUMENT",
  "VOCAL",
  "FX",
  "PERCUSSION",
  "OTHER",
] as const;
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

/**
 * Schema del payload entrante para crear track.
 *
 * NOTA:
 * - `audio.url` representa la URL pública del audio (R2 u otra).
 * - `assetKey` / `assetMime` / `assetSize` son opcionales, pero cuando
 *   el audio viene de R2 es MUY recomendable enviarlos.
 */
const incomingTrackSchema = z.object({
  title: z.string().min(1, "El Título es obligatorio"),
  artist: z.string().min(1, "El Artista es obligatorio"),

  audio: z
    .object({
      url: z.string().url().optional().nullable(),
    })
    .optional()
    .nullable(),

  coverUrl: z.string().url().optional().nullable(),

  moods: z.array(z.string()).optional(),
  uses: z.array(z.string()).optional(),

  durationSec: z.number().optional(),
  restrictions: z.array(z.string()).optional(),

  // Opcional: waveform base64 (no lo usas hoy en ingest, pero lo dejamos)
  waveform: z.string().optional(),

  // Metadata musical / creativa
  bpm: z.coerce.number().nonnegative().optional(),
  key: z.string().optional(),
  trackType: trackTypeSchema.optional(),
  genres: z.array(z.string()).optional(),
  subgenres: z.array(z.string()).optional(),

  // NUEVO: metadatos del asset en R2/S3
  assetKey: z.string().optional(),
  assetMime: z.string().optional(),
  assetSize: z.number().int().nonnegative().optional(),

  // Rights / sync
  licenseType: licenseTypeSchema.optional(),
  mediaBuy: z.string().optional(),
  oneStop: z.boolean().optional(),
  clearedForSync: z.boolean().optional(),
  exclusiveTerritories: z.array(z.string()).optional(),
  exclusiveTermMonths: z.coerce.number().int().nonnegative().optional(),
  restrictedTerritories: z.array(z.string()).optional(),
  restrictedIndustries: z.array(z.string()).optional(),
  restrictedPlatforms: z.array(z.string()).optional(),
  restrictedBrands: z.array(z.string()).optional(),

  // Pricing / presupuesto
  pricingTier: pricingTierSchema.optional(),
  budgetMin: z.coerce.number().int().nonnegative().optional(),
  budgetMax: z.coerce.number().int().nonnegative().optional(),
  budgetCurrency: currencySchema.optional(),

  // Versiones / stems / publishing
  versions: z.array(versionSchema).optional(),
  stems: z.array(stemSchema).optional(),
  publishingShares: z.array(publishingShareSchema).optional(),
});

/**
 * Normaliza el payload de entrada a algo que Prisma entienda bien.
 */
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

function normalizeVersions(
  values: z.infer<typeof versionSchema>[] | undefined,
) {
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

function normalizeIncoming(input: z.infer<typeof incomingTrackSchema>) {
  const title = input.title.trim();
  const artist = input.artist.trim();

  const audioUrl = input.audio?.url?.toString().trim() || null;

  const coverUrl = (input.coverUrl ?? "").toString().trim() || null;

  const moods = (input.moods ?? []).map((m) => m.trim()).filter(Boolean);
  const uses = (input.uses ?? []).map((u) => u.trim()).filter(Boolean);

  const durationSec =
    typeof input.durationSec === "number" ? input.durationSec : null;

  const restrictions = (input.restrictions ?? [])
    .map((r) => r.trim())
    .filter(Boolean);

  // Waveform opcional en base64 → Buffer
  let waveform: Buffer | null = null;
  if (input.waveform && input.waveform.trim().length > 0) {
    try {
      waveform = Buffer.from(input.waveform.trim(), "base64");
    } catch (err) {
      console.warn(
        "[api/tracks] waveform base64 inválido; se ignora el campo.",
        err,
      );
    }
  }

  // NUEVO: metadatos de asset en R2/S3
  const assetKey = (input.assetKey ?? "").toString().trim() || "";

  const assetMime = (input.assetMime ?? "").toString().trim() || "";

  const assetSize =
    typeof input.assetSize === "number" && input.assetSize >= 0
      ? input.assetSize
      : 0;

  const bpm =
    typeof input.bpm === "number" && Number.isFinite(input.bpm)
      ? input.bpm
      : null;
  const key = normalizeText(input.key);
  const trackType = input.trackType ?? null;
  const genres = normalizeStringArray(input.genres);
  const subgenres = normalizeStringArray(input.subgenres);

  const licenseType = input.licenseType ?? null;
  const mediaBuy = normalizeText(input.mediaBuy);
  const oneStop = typeof input.oneStop === "boolean" ? input.oneStop : null;
  const clearedForSync =
    typeof input.clearedForSync === "boolean" ? input.clearedForSync : null;
  const exclusiveTerritories = normalizeStringArray(
    input.exclusiveTerritories,
    true,
  );
  const exclusiveTermMonths = normalizeNullableInt(input.exclusiveTermMonths);
  const restrictedTerritories = normalizeStringArray(
    input.restrictedTerritories,
    true,
  );
  const restrictedIndustries = normalizeStringArray(input.restrictedIndustries);
  const restrictedPlatforms = normalizeStringArray(input.restrictedPlatforms);
  const restrictedBrands = normalizeStringArray(input.restrictedBrands);

  const pricingTier = input.pricingTier ?? null;
  const budgetMin = normalizeNullableInt(input.budgetMin);
  const budgetMax = normalizeNullableInt(input.budgetMax);
  const budgetCurrency = input.budgetCurrency ?? null;

  const versions = normalizeVersions(input.versions);
  const stems = normalizeStems(input.stems);
  const publishingShares = normalizePublishingShares(input.publishingShares);

  return {
    title,
    artist,
    audioUrl,
    coverUrl,
    moods,
    uses,
    durationSec,
    restrictions,
    waveform,
    assetKey,
    assetMime,
    assetSize,
    bpm,
    key,
    trackType,
    genres,
    subgenres,
    licenseType,
    mediaBuy,
    oneStop,
    clearedForSync,
    exclusiveTerritories,
    exclusiveTermMonths,
    restrictedTerritories,
    restrictedIndustries,
    restrictedPlatforms,
    restrictedBrands,
    pricingTier,
    budgetMin,
    budgetMax,
    budgetCurrency,
    versions,
    stems,
    publishingShares,
  };
}

async function resolveOwnerUserIdForCreate(params: {
  authUser: Awaited<ReturnType<typeof getRequestAuthUser>>;
  sessionUserId: string | undefined;
}) {
  if (params.sessionUserId) return params.sessionUserId;
  if (!params.authUser) return null;
  if (params.authUser.id) return params.authUser.id;

  // Fallback temporal para sesiones legacy admin.
  if (params.authUser.role === "ADMIN" || params.authUser.role === "STAFF") {
    const bootstrapEmail = (
      process.env.AUTH_BOOTSTRAP_ADMIN_EMAIL ?? "admin@lynx.local"
    )
      .trim()
      .toLowerCase();
    if (!bootstrapEmail) return null;
    const bootstrapAdmin = await db.user.findUnique({
      where: { email: bootstrapEmail },
      select: { id: true },
    });
    return bootstrapAdmin?.id ?? null;
  }

  return null;
}

/**
 * POST /api/tracks
 * Crea un track nuevo.
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await getRequestAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const cookieStore = await cookies();
    const sessionUser = await getSessionUserFromCookie(
      cookieStore.get(APP_SESSION_COOKIE)?.value,
    );
    const ownerUserId = await resolveOwnerUserIdForCreate({
      authUser,
      sessionUserId: sessionUser?.id,
    });
    if (!ownerUserId) {
      return NextResponse.json(
        { ok: false, error: "No owner available for track creation" },
        { status: 500 },
      );
    }

    const json = await req.json();
    const parsed = incomingTrackSchema.safeParse(json);

    if (!parsed.success) {
      console.error("[api/tracks:POST] payload inválido:", parsed.error);
      return NextResponse.json(
        {
          ok: false,
          error: "Payload inválido",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = normalizeIncoming(parsed.data);

    const created = await db.track.create({
      data: {
        ownerUserId,
        title: data.title,
        artist: data.artist,
        audioUrl: data.audioUrl ?? "",
        coverUrl: data.coverUrl ?? "",
        durationSec: data.durationSec ?? undefined,
        restrictions: data.restrictions,
        waveform: data.waveform as any,
        bpm: data.bpm ?? undefined,
        key: data.key ?? undefined,
        trackType: data.trackType ?? undefined,
        genres: data.genres,
        subgenres: data.subgenres,
        licenseType: data.licenseType ?? undefined,
        mediaBuy: data.mediaBuy ?? undefined,
        oneStop: data.oneStop ?? undefined,
        clearedForSync: data.clearedForSync ?? undefined,
        exclusiveTerritories: data.exclusiveTerritories,
        exclusiveTermMonths: data.exclusiveTermMonths ?? undefined,
        restrictedTerritories: data.restrictedTerritories,
        restrictedIndustries: data.restrictedIndustries,
        restrictedPlatforms: data.restrictedPlatforms,
        restrictedBrands: data.restrictedBrands,
        pricingTier: data.pricingTier ?? undefined,
        budgetMin: data.budgetMin ?? undefined,
        budgetMax: data.budgetMax ?? undefined,
        budgetCurrency: data.budgetCurrency ?? undefined,

        // NUEVO: metadatos del asset en R2
        assetKey: data.assetKey,
        assetMime: data.assetMime,
        assetSize: data.assetSize,

        publishingShares: data.publishingShares.length
          ? { create: data.publishingShares }
          : undefined,
        versions: data.versions.length ? { create: data.versions } : undefined,
        stems: data.stems.length ? { create: data.stems } : undefined,
      },
    });

    if (data.moods.length) {
      await syncTrackTagsByType({
        trackId: created.id,
        type: TagType.MOOD,
        inputs: data.moods.map((name) => ({
          slug: slugify(name),
          name: name.toUpperCase(),
        })),
      });
    }

    if (data.uses.length) {
      await syncTrackTagsByType({
        trackId: created.id,
        type: TagType.USE,
        inputs: data.uses.map((name) => ({
          slug: slugify(name),
          name: name.toUpperCase(),
        })),
      });
    }

    return NextResponse.json(
      {
        ok: true,
        track: {
          id: created.id,
          title: created.title,
          artist: created.artist,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[api/tracks:POST] error inesperado:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno al crear track" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/tracks
 * Listado simple de tracks (puede servir para debugging o vistas futuras).
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await getRequestAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view");

    const moods = searchParams
      .getAll("mood")
      .map((m) => m.trim())
      .filter(Boolean);
    const uses = searchParams
      .getAll("use")
      .map((u) => u.trim())
      .filter(Boolean);
    const artist = searchParams.get("artist")?.trim() ?? "";
    const q = searchParams.get("q")?.trim() ?? "";

    const limitRaw = Number(searchParams.get("limit") ?? "20");
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(Math.trunc(limitRaw), 1), 100)
      : 20;

    const cursorRaw = searchParams.get("cursor");
    const offset =
      cursorRaw && Number.isFinite(Number(cursorRaw))
        ? Math.max(0, Math.trunc(Number(cursorRaw)))
        : 0;

    const orderParam = searchParams.get("order");
    const dirParam = searchParams.get("dir");
    const order =
      orderParam === "title" ||
      orderParam === "artist" ||
      orderParam === "createdAt"
        ? orderParam
        : "createdAt";
    const dir = dirParam === "asc" || dirParam === "desc" ? dirParam : "desc";

    const filters: any[] = [];
    if (authUser?.role === "CREATOR" && authUser.id) {
      filters.push({ ownerUserId: authUser.id });
    }
    if (moods.length) {
      const moodSlugs = moods.map((m) => slugify(m)).filter(Boolean);
      if (moodSlugs.length) {
        filters.push({
          tags: {
            some: {
              tag: {
                type: TagType.MOOD,
                slug: { in: moodSlugs },
              },
            },
          },
        });
      }
    }
    if (uses.length) {
      const useSlugs = uses.map((u) => slugify(u)).filter(Boolean);
      if (useSlugs.length) {
        filters.push({
          tags: {
            some: {
              tag: {
                type: TagType.USE,
                slug: { in: useSlugs },
              },
            },
          },
        });
      }
    }
    if (artist)
      filters.push({
        artist: { contains: artist, mode: "insensitive" as const },
      });
    if (q) {
      filters.push({
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { artist: { contains: q, mode: "insensitive" as const } },
        ],
      });
    }

    const where = filters.length ? { AND: filters } : undefined;

    if (view === "list") {
      const [items, totalCount] = await Promise.all([
        db.track.findMany({
          where,
          orderBy: { [order]: dir },
          skip: offset,
          take: limit,
          select: {
            id: true,
            title: true,
            artist: true,
            coverUrl: true,
            tags: {
              where: { tag: { type: { in: [TagType.MOOD, TagType.USE] } } },
              select: {
                tag: {
                  select: {
                    name: true,
                    type: true,
                  },
                },
              },
            },
          },
        }),
        db.track.count({ where }),
      ]);

      const nextOffset = offset + items.length;
      const nextCursor = nextOffset < totalCount ? String(nextOffset) : null;

      const mappedItems = items.map((item) => {
        const moods = item.tags
          .filter((t) => t.tag.type === TagType.MOOD)
          .map((t) => t.tag.name);
        const uses = item.tags
          .filter((t) => t.tag.type === TagType.USE)
          .map((t) => t.tag.name);
        return {
          id: item.id,
          title: item.title,
          artist: item.artist,
          coverUrl: item.coverUrl,
          moods,
          uses,
        };
      });

      return NextResponse.json(
        { items: mappedItems, nextCursor, totalCount },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const tracks = await db.track.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      { ok: true, tracks },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[api/tracks:GET] error inesperado:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno al listar tracks" },
      { status: 500 },
    );
  }
}
