import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma, PromotionCampaignStatus, PromotionSlotFormat } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getRouteUser } from "@/lib/account-auth/route-guards";
import {
  canManageShowcase,
  isValidSlotKey,
  normalizeOptionalText,
  normalizeSlotKey,
} from "@/lib/showcase/admin-shared";

type RouteContext = {
  params: Promise<{ slotId: string }>;
};

const patchSlotSchema = z.object({
  key: z.string().trim().min(3).max(80).optional(),
  name: z.string().trim().min(2).max(120).optional(),
  format: z.nativeEnum(PromotionSlotFormat).optional(),
  description: z.string().trim().max(400).optional().nullable(),
  isEnabled: z.boolean().optional(),
  settings: z.record(z.string(), z.any()).optional().nullable(),
});

export async function PATCH(req: NextRequest, context: RouteContext) {
  const user = await getRouteUser();
  if (!user || !canManageShowcase(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { slotId } = await context.params;
  const payload = await req.json().catch(() => null);
  const parsed = patchSlotSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.key !== undefined) {
    const key = normalizeSlotKey(parsed.data.key);
    if (!isValidSlotKey(key)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "slot key inválido. Usa minúsculas, números y separadores . _ - (ej: catalog.hero.main)",
        },
        { status: 400 },
      );
    }
  }

  try {
    const nextSettings =
      parsed.data.settings === undefined
        ? undefined
        : parsed.data.settings === null
          ? Prisma.DbNull
          : (parsed.data.settings as Prisma.InputJsonValue);

    const updated = await prisma.promotionSlot.update({
      where: { id: slotId },
      data: {
        ...(parsed.data.key !== undefined ? { key: normalizeSlotKey(parsed.data.key) } : {}),
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.format !== undefined ? { format: parsed.data.format } : {}),
        ...(parsed.data.description !== undefined
          ? { description: normalizeOptionalText(parsed.data.description) }
          : {}),
        ...(parsed.data.isEnabled !== undefined ? { isEnabled: parsed.data.isEnabled } : {}),
        ...(nextSettings !== undefined ? { settings: nextSettings } : {}),
      },
      select: {
        id: true,
        key: true,
        name: true,
        format: true,
        description: true,
        isEnabled: true,
        settings: true,
        updatedAt: true,
      },
    });

    revalidatePath("/admin/showcase");
    revalidatePath(`/admin/showcase/slots/${slotId}`);
    if (updated.key === "catalog.hero.main") {
      revalidatePath("/catalog");
    }

    return NextResponse.json({ ok: true, item: updated });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ ok: false, error: "Slot no encontrado" }, { status: 404 });
      }
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    console.error("[api/admin/showcase/slots/:slotId][PATCH] error", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const user = await getRouteUser();
  if (!user || !canManageShowcase(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { slotId } = await context.params;

  try {
    const slot = await prisma.promotionSlot.findUnique({
      where: { id: slotId },
      select: {
        id: true,
        key: true,
        _count: { select: { campaigns: true } },
      },
    });

    if (!slot) {
      return NextResponse.json({ ok: false, error: "Slot no encontrado" }, { status: 404 });
    }

    if (slot._count.campaigns > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "No se puede eliminar un slot con campañas. Archiva o elimina campañas primero.",
        },
        { status: 400 },
      );
    }

    await prisma.promotionSlot.delete({ where: { id: slotId } });

    revalidatePath("/admin/showcase");
    if (slot.key === "catalog.hero.main") {
      await prisma.bannerPromotion.updateMany({
        where: {
          slotId: slot.id,
          status: PromotionCampaignStatus.LIVE,
        },
        data: {
          status: PromotionCampaignStatus.PAUSED,
          isActive: false,
        },
      });
      revalidatePath("/catalog");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    console.error("[api/admin/showcase/slots/:slotId][DELETE] error", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
