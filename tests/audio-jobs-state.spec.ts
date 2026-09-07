import { describe, expect, it } from "vitest";
import {
  AUDIO_JOB_RETRY_MAX_MS,
  failureResult,
  nextRetryAt,
  sanitizeAudioJobError,
} from "../src/lib/audio-jobs/state";

describe("FASE 3: estados puros de AudioJob", () => {
  it("reintenta antes del máximo y falla al agotarlo", () => {
    expect(failureResult(1, 3)).toBe("retry");
    expect(failureResult(2, 3)).toBe("retry");
    expect(failureResult(3, 3)).toBe("failed");
  });

  it("aplica backoff limitado", () => {
    const now = new Date("2026-09-07T00:00:00.000Z");
    expect(nextRetryAt(1, now).getTime() - now.getTime()).toBe(30_000);
    expect(nextRetryAt(2, now).getTime() - now.getTime()).toBe(60_000);
    expect(nextRetryAt(99, now).getTime() - now.getTime()).toBe(AUDIO_JOB_RETRY_MAX_MS);
  });

  it("nunca persiste URLs firmadas ni credenciales en errores", () => {
    const result = sanitizeAudioJobError(new Error("R2 https://bucket.example/a?X-Amz-Signature=secret&Credential=key failed"));
    expect(result).not.toContain("bucket.example");
    expect(result).not.toContain("secret");
    expect(result).not.toContain("key");
  });

  it("recorta la salida de procesos defectuosos", () => {
    expect(sanitizeAudioJobError("x".repeat(900))).toHaveLength(500);
  });
});
