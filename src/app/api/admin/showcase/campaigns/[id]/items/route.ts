import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { BannerTargetType, Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getRouteUser } from "@/lib/account-auth/route-guards";
import { canManageShowcase, parseDateOrNull } from "@/lib/showcase/admin-shared";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const createItemSchema = z.object({
  targetType: z.nativeEnum(BannerTargetType),
  targetId: z.string().trim().max(191).optional().nullable(),
  titleOverride: z.string().trim().max(140).optional().nullable(),
  subtitleOverride: z.string().trim().max(280).optional().nullable(),
  imageUrlOverride: z.string().trim().max(2000).optional().nullable(),
  ctaLabel: z.string().trim().max(80).optional().nullable(),
  ctaHrefOverride: z.string().trim().max(2000).optional().nullable(),
  sortOrder: z.number().int().min(-9999).max(9999).optional(),
  isEnabled: z.boolean().optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  durationMs: z.number().int().min(1000).max(20000).optional(),
});

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized ? normalized : null;
}

function validateItemPayload(params: {
  targetType: BannerTargetType;
  targetId: string | null;
  ctaHrefOverride: string | null;
  imageUrlOverride: string | null;
}) {
  if (params.targetType === BannerTargetType.EXTERNAL_URL) {
    if (!params.ctaHrefOverride?.trim()) {
      return "Para EXTERNAL_URL debes definir ctaHrefOverride";
    }
    if (!params.imageUrlOverride?.trim()) {
      return "Para EXTERNAL_URL debes definir imageUrlOverride";
    }
    return null;
  }

  if (!params.targetId?.trim()) {
    return "targetId es obligatorio para este targetType";
  }
  return null;
}

export async function POST(req: NextRequest, context: RouteContext) {
  const user = await getRouteUser();
  if (!user || !canManageShowcase(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const payload = await req.json().catch(() => null);
  const parsed = createItemSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const startsAt = parseDateOrNull(parsed.data.startsAt);
  const endsAt = parseDateOrNull(parsed.data.endsAt);
  if (startsAt && endsAt && endsAt < startsAt) {
    return NextResponse.json(
      { ok: false, error: "endsAt no puede ser anterior a startsAt" },
      { status: 400 },
    );
  }

  try {
    const targetId = normalizeOptionalText(parsed.data.targetId);
    const ctaHrefOverride = normalizeOptionalText(parsed.data.ctaHrefOverride);
    const imageUrlOverride = normalizeOptionalText(parsed.data.imageUrlOverride);
    const validationError = validateItemPayload({
      targetType: parsed.data.targetType,
      targetId,
      ctaHrefOverride,
      imageUrlOverride,
    });

    if (validationError) {
      return NextResponse.json({ ok: false, error: validationError }, { status: 400 });
    }

    const campaign = await prisma.bannerPromotion.findUnique({
      where: { id },
      select: {
        id: true,
        slotId: true,
        slot: {
          select: {
            key: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ ok: false, error: "Campaña no encontrada" }, { status: 404 });
    }

    const fallbackSortOrder = await prisma.bannerPromotionItem.count({ where: { promotionId: id } });

    const created = await prisma.bannerPromotionItem.create({
      data: {
        promotionId: id,
        targetType: parsed.data.targetType,
        targetId,
        titleOverride: normalizeOptionalText(parsed.data.titleOverride),
        subtitleOverride: normalizeOptionalText(parsed.data.subtitleOverride),
        imageUrlOverride,
        ctaLabel: normalizeOptionalText(parsed.data.ctaLabel),
        ctaHrefOverride,
        sortOrder: parsed.data.sortOrder ?? fallbackSortOrder + 1,
        isEnabled: parsed.data.isEnabled ?? true,
        startsAt,
        endsAt,
        durationMs: parsed.data.durationMs ?? 5000,
      },
      select: {
        id: true,
        promotionId: true,
        targetType: true,
        targetId: true,
        titleOverride: true,
        subtitleOverride: true,
        imageUrlOverride: true,
        ctaLabel: true,
        ctaHrefOverride: true,
        sortOrder: true,
        isEnabled: true,
        startsAt: true,
        endsAt: true,
        durationMs: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    revalidatePath("/admin/showcase");
    if (campaign.slotId) {
      revalidatePath(`/admin/showcase/slots/${campaign.slotId}`);
    }
    revalidatePath(`/admin/showcase/campaigns/${campaign.id}`);
    if (campaign.slot?.key === "catalog.hero.main") {
      revalidatePath("/catalog");
    }

    return NextResponse.json({ ok: true, item: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    console.error("[api/admin/showcase/campaigns/:id/items][POST] error", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
