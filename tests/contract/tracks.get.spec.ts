/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: Test de contrato GET /api/tracks (list view)                        │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                   │
 * │ - Llama al endpoint real (server dev)                                       │
 * │ - Valida shape básico y paginación sin solapes                               │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                           │
 * │ - Terminal A: `npm run dev`                                                 │
 * │ - Terminal B: `npm test`                                                    │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import { describe, it, expect } from "vitest";

// Robust BASE to avoid inputs like "//api/..." when BASE_URL is unset or malformed.
const BASE = (() => {
  const raw = process.env.BASE_URL?.trim();
  if (!raw) return "http://localhost:3004";
  if (raw.startsWith("http")) return raw;
  if (raw.startsWith("/")) return "http://localhost:3004";
  if (raw.startsWith("//")) return "http://localhost:3004";
  return raw;
})();
const CONTRACT_COOKIE = process.env.CONTRACT_COOKIE?.trim() ?? "";
const authenticatedIt = CONTRACT_COOKIE ? it : it.skip;
const authHeaders: Record<string, string> = { accept: "application/json" };
if (CONTRACT_COOKIE) authHeaders.cookie = CONTRACT_COOKIE;
type Item = {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string | null;
  moods: string[];
  uses: string[];
};
type Resp = { items: Item[]; nextCursor: string | null; totalCount: number };

describe("GET /api/tracks (list)", () => {
  it("rechaza solicitudes sin sesión", async () => {
    const res = await fetch(`${BASE}/api/tracks?limit=1&view=list`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    expect(res.status).toBe(401);
  });

  authenticatedIt("primera página válida", async () => {
    const res = await fetch(`${BASE}/api/tracks?limit=3&view=list`, {
      headers: authHeaders,
      cache: "no-store",
    });
    expect(res.ok).toBe(true);
    const json = (await res.json()) as Resp;
    expect(Array.isArray(json.items)).toBe(true);
    expect(json.totalCount).toBeGreaterThanOrEqual(0);
  });

  authenticatedIt("paginación no repite IDs", async () => {
    const r1 = await fetch(
      `${BASE}/api/tracks?limit=2&view=list&order=createdAt&dir=desc`,
      {
        headers: authHeaders,
      },
    );
    const p1 = (await r1.json()) as Resp;
    if (p1.nextCursor) {
      const r2 = await fetch(
        `${BASE}/api/tracks?limit=2&view=list&order=createdAt&dir=desc&cursor=${p1.nextCursor}`,
        {
          headers: authHeaders,
        },
      );
      const p2 = (await r2.json()) as Resp;
      const s1 = new Set(p1.items.map((i) => i.id));
      expect(p2.items.some((i) => s1.has(i.id))).toBe(false);
    } else {
      expect(p1.nextCursor).toBeNull();
    }
  });
});
