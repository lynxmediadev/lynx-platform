import { describe, expect, it } from "vitest";
import { GET } from "../src/app/api/health/route";

describe("FASE 4: healthcheck web", () => {
  it("es barato, no cacheable y no expone configuración", async () => {
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(body).toMatchObject({ ok: true, service: "lynx-web" });
    expect(typeof body.ts).toBe("number");
    expect(JSON.stringify(body)).not.toMatch(/key|secret|password|database/i);
  });
});
