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
  params: Promise<{ slotId: string }>;
};

const createCampaignSchema = z.object({
  name: z.string().trim().min(2).max(120),
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

  const { slotId } = await context.params;

  const campaigns = await prisma.bannerPromotion.findMany({
    where: {
      slotId,
    },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      status: true,
      priority: true,
      isActive: true,
      startsAt: true,
      endsAt: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { items: true },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    items: campaigns.map((campaign) => ({
      ...campaign,
      itemCount: campaign._count.items,
    })),
  });
}

export async function POST(req: NextRequest, context: RouteContext) {
  const user = await getRouteUser();
  if (!user || !canManageShowcase(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { slotId } = await context.params;
  const payload = await req.json().catch(() => null);
  const parsed = createCampaignSchema.safeParse(payload);
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

  const status = parsed.data.status ?? PromotionCampaignStatus.DRAFT;

  try {
    const created = await prisma.$transaction(async (tx) => {
      const slot = await tx.promotionSlot.findUnique({
        where: { id: slotId },
        select: { id: true, key: true },
      });
      if (!slot) {
        throw new Error("SLOT_NOT_FOUND");
      }

      const row = await tx.bannerPromotion.create({
        data: {
          name: parsed.data.name,
          slotId: slot.id,
          status,
          isActive: isLiveStatus(status),
          priority: clampCampaignPriority(parsed.data.priority),
          startsAt,
          endsAt,
          notes: normalizeOptionalText(parsed.data.notes),
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
          createdAt: true,
          updatedAt: true,
        },
      });

      if (isLiveStatus(status)) {
        await tx.bannerPromotion.updateMany({
          where: {
            slotId: slot.id,
            id: { not: row.id },
            status: PromotionCampaignStatus.LIVE,
          },
          data: {
            status: PromotionCampaignStatus.PAUSED,
            isActive: false,
          },
        });
      }

      return {
        campaign: row,
        slot,
      };
    });

    revalidatePath("/admin/showcase");
    revalidatePath(`/admin/showcase/slots/${slotId}`);
    revalidatePath(`/admin/showcase/campaigns/${created.campaign.id}`);
    if (created.slot.key === "catalog.hero.main") {
      revalidatePath("/catalog");
    }

    return NextResponse.json({ ok: true, item: created.campaign }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "SLOT_NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "Slot no encontrado" }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    console.error("[api/admin/showcase/slots/:slotId/campaigns][POST] error", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
