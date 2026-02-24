import { NextResponse } from "next/server";
import { resolveShowcaseSlidesWithMeta } from "@/lib/banner-promotions/service";

type RouteContext = {
  params: Promise<{ slotKey: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { slotKey } = await context.params;
    const cleanSlotKey = slotKey.trim();
    if (!cleanSlotKey) {
      return NextResponse.json({ ok: false, error: "slotKey is required" }, { status: 400 });
    }

    const resolved = await resolveShowcaseSlidesWithMeta({ slotKey: cleanSlotKey, limit: 30 });

    return NextResponse.json(
      {
        ok: true,
        slotKey: resolved.slotKey,
        slotId: resolved.slotId,
        activePromotionId: resolved.activePromotionId,
        slides: resolved.slides,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[api/showcase/slots/:slotKey] error", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
