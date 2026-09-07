import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const file = (name: string) => readFileSync(resolve(root, name), "utf8");

describe("FASE 4: contratos de portabilidad", () => {
  it("mantiene salida standalone y excluye binarios de audio del tracing web", () => {
    const config = file("next.config.js");
    expect(config).toContain('output: "standalone"');
    expect(config).toContain("outputFileTracingExcludes");
    expect(config).toContain("ffmpeg-static");
    expect(config).toContain("ffprobe-static");
  });

  it("mantiene web y worker en contenedores distintos", () => {
    const web = file("Dockerfile.web");
    const worker = file("Dockerfile.audio-worker");
    expect(web).toMatch(/CMD\s+\["node",\s*"server\.js"\]/);
    expect(web).not.toMatch(/^COPY\s+workers|^RUN[^\n]*(ffmpeg|ffprobe|prisma migrate)|^CMD[^\n]*worker/im);
    expect(worker).toContain("apt-get install");
    expect(worker).toContain("ffmpeg");
  });

  it("no marca secretos como variables públicas en el ejemplo", () => {
    const envExample = file(".env.example");
    expect(envExample).toContain("NEXT_PUBLIC_SUPABASE_URL=");
    expect(envExample).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=");
    expect(envExample).not.toMatch(/^NEXT_PUBLIC_.*(?:SECRET|PASSWORD|SERVICE_ROLE|ACCESS_KEY)/m);
  });
});
