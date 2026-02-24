import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { BannerTargetType, Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getRouteUser } from "@/lib/account-auth/route-guards";
import { canManageShowcase, parseDateOrNull } from "@/lib/showcase/admin-shared";

type RouteContext = {
  params: Promise<{ id: string; itemId: string }>;
};

const patchItemSchema = z.object({
  targetType: z.nativeEnum(BannerTargetType).optional(),
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

export async function PATCH(req: NextRequest, context: RouteContext) {
  const user = await getRouteUser();
  if (!user || !canManageShowcase(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id, itemId } = await context.params;
  const payload = await req.json().catch(() => null);
  const parsed = patchItemSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const startsAt = parsed.data.startsAt !== undefined ? parseDateOrNull(parsed.data.startsAt) : undefined;
  const endsAt = parsed.data.endsAt !== undefined ? parseDateOrNull(parsed.data.endsAt) : undefined;

  if (startsAt !== undefined && endsAt !== undefined && startsAt && endsAt && endsAt < startsAt) {
    return NextResponse.json(
      { ok: false, error: "endsAt no puede ser anterior a startsAt" },
      { status: 400 },
    );
  }

  try {
    const currentItem = await prisma.bannerPromotionItem.findFirst({
      where: { id: itemId, promotionId: id },
      select: {
        targetType: true,
        targetId: true,
        ctaHrefOverride: true,
        imageUrlOverride: true,
      },
    });

    if (!currentItem) {
      return NextResponse.json({ ok: false, error: "Item no encontrado" }, { status: 404 });
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

    const nextTargetType = parsed.data.targetType ?? currentItem.targetType;
    const nextTargetId = parsed.data.targetId !== undefined
      ? normalizeOptionalText(parsed.data.targetId)
      : currentItem.targetId;
    const nextCtaHref = parsed.data.ctaHrefOverride !== undefined
      ? normalizeOptionalText(parsed.data.ctaHrefOverride)
      : currentItem.ctaHrefOverride;
    const nextImageUrl = parsed.data.imageUrlOverride !== undefined
      ? normalizeOptionalText(parsed.data.imageUrlOverride)
      : currentItem.imageUrlOverride;

    const validationError = validateItemPayload({
      targetType: nextTargetType,
      targetId: nextTargetId,
      ctaHrefOverride: nextCtaHref,
      imageUrlOverride: nextImageUrl,
    });

    if (validationError) {
      return NextResponse.json({ ok: false, error: validationError }, { status: 400 });
    }

    const updated = await prisma.bannerPromotionItem.updateMany({
      where: { id: itemId, promotionId: id },
      data: {
        ...(parsed.data.targetType !== undefined ? { targetType: parsed.data.targetType } : {}),
        ...(parsed.data.targetId !== undefined ? { targetId: nextTargetId } : {}),
        ...(parsed.data.titleOverride !== undefined
          ? { titleOverride: normalizeOptionalText(parsed.data.titleOverride) }
          : {}),
        ...(parsed.data.subtitleOverride !== undefined
          ? { subtitleOverride: normalizeOptionalText(parsed.data.subtitleOverride) }
          : {}),
        ...(parsed.data.imageUrlOverride !== undefined ? { imageUrlOverride: nextImageUrl } : {}),
        ...(parsed.data.ctaLabel !== undefined
          ? { ctaLabel: normalizeOptionalText(parsed.data.ctaLabel) }
          : {}),
        ...(parsed.data.ctaHrefOverride !== undefined ? { ctaHrefOverride: nextCtaHref } : {}),
        ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
        ...(parsed.data.isEnabled !== undefined ? { isEnabled: parsed.data.isEnabled } : {}),
        ...(startsAt !== undefined ? { startsAt } : {}),
        ...(endsAt !== undefined ? { endsAt } : {}),
        ...(parsed.data.durationMs !== undefined ? { durationMs: parsed.data.durationMs } : {}),
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ ok: false, error: "Item no encontrado" }, { status: 404 });
    }

    const item = await prisma.bannerPromotionItem.findUnique({
      where: { id: itemId },
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

    return NextResponse.json({ ok: true, item });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    console.error("[api/admin/showcase/campaigns/:id/items/:itemId][PATCH] error", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const user = await getRouteUser();
  if (!user || !canManageShowcase(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id, itemId } = await context.params;

  try {
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

    const removed = await prisma.bannerPromotionItem.deleteMany({
      where: { id: itemId, promotionId: id },
    });

    if (removed.count === 0) {
      return NextResponse.json({ ok: false, error: "Item no encontrado" }, { status: 404 });
    }

    revalidatePath("/admin/showcase");
    if (campaign.slotId) {
      revalidatePath(`/admin/showcase/slots/${campaign.slotId}`);
    }
    revalidatePath(`/admin/showcase/campaigns/${campaign.id}`);
    if (campaign.slot?.key === "catalog.hero.main") {
      revalidatePath("/catalog");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    console.error("[api/admin/showcase/campaigns/:id/items/:itemId][DELETE] error", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
