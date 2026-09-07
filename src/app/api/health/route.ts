// src/app/api/health/route.ts
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ GET /api/health — Healthcheck minimal                                      │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Devuelve { ok: true, ts } para monitoreo/QA.                              │
 * │ - No expone nada sensible.                                                  │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { ok: true, service: "lynx-web", ts: Date.now() },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
