import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchCatalogTracks } from "@/lib/catalog/fetchCatalog";
import { getClientIp } from "@/lib/antibot";

const schema = z.object({
  catalogSlug: z.string().trim().min(1).optional(),
  moods: z.array(z.string().trim().min(1)).optional(),
  uses: z.array(z.string().trim().min(1)).optional(),
  artist: z.string().trim().min(1).optional(),
  q: z.string().trim().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  includeWaveform: z.boolean().optional(),
});

const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;
const ipBuckets = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = ipBuckets.get(ip);
  if (!bucket || now - bucket.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipBuckets.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_MAX) return false;
  bucket.count++;
  return true;
}

export async function POST(req: Request) {
  const ip = getClientIp(req.headers) || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { ok: false, message: "Demasiadas solicitudes. Intente nuevamente en un minuto." },
      { status: 429 },
    );
  }

  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          message: "Payload inválido",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const tracks = await fetchCatalogTracks(parsed.data);
    return NextResponse.json({ ok: true, tracks });
  } catch (error) {
    console.error("[api/catalog/list] error", error);
    return NextResponse.json(
      { ok: false, message: "Error interno" },
      { status: 500 },
    );
  }
}
