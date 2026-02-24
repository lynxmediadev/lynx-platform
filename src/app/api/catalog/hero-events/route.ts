import { NextResponse } from "next/server";
import { BannerPlacement } from "@prisma/client";
import { z } from "zod";
import { trackBannerPromotionEvent } from "@/lib/banner-promotions/service";

const schema = z.object({
  placement: z.nativeEnum(BannerPlacement),
  itemId: z.string().trim().min(1).optional().nullable(),
  eventType: z.enum(["VIEW", "CLICK_CTA", "CLICK_PLAY"]),
  sessionId: z.string().trim().min(1).max(120).optional().nullable(),
  path: z.string().trim().max(500).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => null);
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const userAgent = req.headers.get("user-agent");
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? null;

    await trackBannerPromotionEvent({
      placement: parsed.data.placement,
      itemId: parsed.data.itemId ?? null,
      eventType: parsed.data.eventType,
      sessionId: parsed.data.sessionId ?? null,
      path: parsed.data.path ?? null,
      userAgent,
      ip,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/catalog/hero-events] error", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
