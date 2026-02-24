import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma, PromotionCampaignStatus } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getRouteUser } from "@/lib/account-auth/route-guards";
import {
  canManageShowcase,
  clampCampaignPriority,
  isLiveStatus,
  normalizeOptionalText,
  parseDateOrNull,
} from "@/lib/showcase/admin-shared";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const patchCampaignSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  status: z.nativeEnum(PromotionCampaignStatus).optional(),
  priority: z.number().int().min(-9999).max(9999).optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export async function GET(_req: NextRequest, context: RouteContext) {
  const user = await getRouteUser();
  if (!user || !canManageShowcase(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const campaign = await prisma.bannerPromotion.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      status: true,
      priority: true,
      isActive: true,
      startsAt: true,
      endsAt: true,
      notes: true,
      updatedAt: true,
      slot: {
        select: {
          id: true,
          key: true,
          name: true,
          format: true,
          isEnabled: true,
        },
      },
      items: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
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
      },
    },
  });

  if (!campaign || !campaign.slot) {
    return NextResponse.json({ ok: false, error: "Campaña no encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    item: {
      ...campaign,
      startsAt: campaign.startsAt?.toISOString() ?? null,
      endsAt: campaign.endsAt?.toISOString() ?? null,
      updatedAt: campaign.updatedAt.toISOString(),
      items: campaign.items.map((slide) => ({
        ...slide,
        startsAt: slide.startsAt?.toISOString() ?? null,
        endsAt: slide.endsAt?.toISOString() ?? null,
        updatedAt: slide.updatedAt.toISOString(),
      })),
    },
  });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const user = await getRouteUser();
  if (!user || !canManageShowcase(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const payload = await req.json().catch(() => null);
  const parsed = patchCampaignSchema.safeParse(payload);
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
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.bannerPromotion.findUnique({
        where: { id },
        select: {
          id: true,
          slotId: true,
          status: true,
          startsAt: true,
          endsAt: true,
          slot: {
            select: {
              id: true,
              key: true,
            },
          },
        },
      });

      if (!current) {
        throw new Error("NOT_FOUND");
      }

      const nextStatus = parsed.data.status ?? current.status;
      const nextStartsAt = startsAt === undefined ? current.startsAt : startsAt;
      const nextEndsAt = endsAt === undefined ? current.endsAt : endsAt;

      if (nextStartsAt && nextEndsAt && nextEndsAt < nextStartsAt) {
        throw new Error("INVALID_DATES");
      }

      const row = await tx.bannerPromotion.update({
        where: { id },
        data: {
          ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
          ...(parsed.data.status !== undefined
            ? {
                status: parsed.data.status,
                isActive: isLiveStatus(parsed.data.status),
              }
            : {}),
          ...(parsed.data.priority !== undefined
            ? { priority: clampCampaignPriority(parsed.data.priority) }
            : {}),
          ...(startsAt !== undefined ? { startsAt } : {}),
          ...(endsAt !== undefined ? { endsAt } : {}),
          ...(parsed.data.notes !== undefined
            ? { notes: normalizeOptionalText(parsed.data.notes) }
            : {}),
        },
        select: {
          id: true,
          name: true,
          slotId: true,
          status: true,
          priority: true,
          isActive: true,
          startsAt: true,
          endsAt: true,
          notes: true,
          updatedAt: true,
          slot: {
            select: {
              id: true,
              key: true,
            },
          },
        },
      });

      if (isLiveStatus(nextStatus) && row.slotId) {
        await tx.bannerPromotion.updateMany({
          where: {
            slotId: row.slotId,
            id: { not: row.id },
            status: PromotionCampaignStatus.LIVE,
          },
          data: {
            status: PromotionCampaignStatus.PAUSED,
            isActive: false,
          },
        });
      }

      return row;
    });

    revalidatePath("/admin/showcase");
    if (result.slotId) {
      revalidatePath(`/admin/showcase/slots/${result.slotId}`);
    }
    revalidatePath(`/admin/showcase/campaigns/${result.id}`);

    if (result.slot?.key === "catalog.hero.main") {
      revalidatePath("/catalog");
    }

    return NextResponse.json({ ok: true, item: result });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "Campaña no encontrada" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "INVALID_DATES") {
      return NextResponse.json(
        { ok: false, error: "endsAt no puede ser anterior a startsAt" },
        { status: 400 },
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    console.error("[api/admin/showcase/campaigns/:id][PATCH] error", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const user = await getRouteUser();
  if (!user || !canManageShowcase(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const removed = await prisma.bannerPromotion.delete({
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

    revalidatePath("/admin/showcase");
    if (removed.slotId) {
      revalidatePath(`/admin/showcase/slots/${removed.slotId}`);
    }

    if (removed.slot?.key === "catalog.hero.main") {
      revalidatePath("/catalog");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ ok: false, error: "Campaña no encontrada" }, { status: 404 });
      }
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    console.error("[api/admin/showcase/campaigns/:id][DELETE] error", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
