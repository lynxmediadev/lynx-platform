import { NextResponse } from "next/server";
import { resolveShowcaseSlidesWithMeta } from "@/lib/banner-promotions/service";

export async function GET() {
  try {
    const resolved = await resolveShowcaseSlidesWithMeta({ slotKey: "catalog.hero.main" });
    return NextResponse.json(
      {
        ok: true,
        slotKey: resolved.slotKey,
        slotId: resolved.slotId,
        slides: resolved.slides,
        activePromotionId: resolved.activePromotionId,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[api/catalog/hero-slides] error", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
