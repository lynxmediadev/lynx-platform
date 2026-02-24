import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getRouteUser } from "@/lib/account-auth/route-guards";
import { canManageShowcase } from "@/lib/showcase/admin-shared";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const reorderSchema = z.object({
  itemIds: z.array(z.string().trim().min(1)).min(1).max(120),
});

export async function POST(req: NextRequest, context: RouteContext) {
  const user = await getRouteUser();
  if (!user || !canManageShowcase(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const payload = await req.json().catch(() => null);
  const parsed = reorderSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

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

    const submittedIds = parsed.data.itemIds;
    const uniqueIds = new Set(submittedIds);
    if (uniqueIds.size !== submittedIds.length) {
      return NextResponse.json({ ok: false, error: "itemIds contiene duplicados" }, { status: 400 });
    }

    const existing = await prisma.bannerPromotionItem.findMany({
      where: { promotionId: id },
      select: { id: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    const existingIds = existing.map((row) => row.id);
    if (existingIds.length !== submittedIds.length) {
      return NextResponse.json(
        { ok: false, error: "Debes enviar el listado completo de items para reorder" },
        { status: 400 },
      );
    }

    if (existingIds.some((itemId) => !uniqueIds.has(itemId))) {
      return NextResponse.json(
        { ok: false, error: "Uno o más itemIds no pertenecen a la campaña" },
        { status: 400 },
      );
    }

    await prisma.$transaction(
      submittedIds.map((itemId, index) =>
        prisma.bannerPromotionItem.updateMany({
          where: { id: itemId, promotionId: id },
          data: { sortOrder: index + 1 },
        }),
      ),
    );

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
    console.error("[api/admin/showcase/campaigns/:id/items/reorder][POST] error", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
