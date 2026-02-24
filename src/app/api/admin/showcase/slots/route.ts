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

const createSlotSchema = z.object({
  key: z.string().trim().min(3).max(80),
  name: z.string().trim().min(2).max(120),
  format: z.nativeEnum(PromotionSlotFormat).optional(),
  description: z.string().trim().max(400).optional().nullable(),
  isEnabled: z.boolean().optional(),
  settings: z.record(z.string(), z.any()).optional().nullable(),
});

export async function GET(req: NextRequest) {
  const user = await getRouteUser();
  if (!user || !canManageShowcase(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();

  const slots = await prisma.promotionSlot.findMany({
    where: q
      ? {
          OR: [
            { key: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      key: true,
      name: true,
      format: true,
      description: true,
      isEnabled: true,
      settings: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          campaigns: true,
        },
      },
      campaigns: {
        where: {
          status: PromotionCampaignStatus.LIVE,
          isActive: true,
        },
        orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
        take: 1,
        select: {
          id: true,
          name: true,
          status: true,
          priority: true,
          startsAt: true,
          endsAt: true,
          updatedAt: true,
        },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    items: slots.map((slot) => ({
      ...slot,
      campaignCount: slot._count.campaigns,
      liveCampaign: slot.campaigns[0] ?? null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getRouteUser();
  if (!user || !canManageShowcase(user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const parsed = createSlotSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const slotKey = normalizeSlotKey(parsed.data.key);
  if (!isValidSlotKey(slotKey)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "slot key inválido. Usa minúsculas, números y separadores . _ - (ej: catalog.hero.main)",
      },
      { status: 400 },
    );
  }

  try {
    const created = await prisma.promotionSlot.create({
      data: {
        key: slotKey,
        name: parsed.data.name,
        format: parsed.data.format ?? PromotionSlotFormat.HERO,
        description: normalizeOptionalText(parsed.data.description),
        isEnabled: parsed.data.isEnabled ?? true,
        settings: parsed.data.settings ?? undefined,
      },
      select: {
        id: true,
        key: true,
        name: true,
        format: true,
        description: true,
        isEnabled: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    revalidatePath("/admin/showcase");
    return NextResponse.json({ ok: true, item: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    console.error("[api/admin/showcase/slots][POST] error", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
