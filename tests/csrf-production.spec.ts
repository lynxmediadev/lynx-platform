import { afterEach, describe, expect, it } from "vitest";
import { issueCsrfToken, verifyCsrfToken } from "../src/lib/csrf";

const originalNodeEnv = process.env.NODE_ENV;
const originalSecret = process.env.CSRF_SECRET;
const mutableEnv = process.env as Record<string, string | undefined>;

afterEach(() => {
  if (originalNodeEnv === undefined) delete mutableEnv.NODE_ENV;
  else mutableEnv.NODE_ENV = originalNodeEnv;
  if (originalSecret === undefined) delete mutableEnv.CSRF_SECRET;
  else mutableEnv.CSRF_SECRET = originalSecret;
});

describe("FASE 4: CSRF de producción", () => {
  it("rechaza el fallback de desarrollo cuando falta el secreto en producción", () => {
    mutableEnv.NODE_ENV = "production";
    delete mutableEnv.CSRF_SECRET;
    expect(() => issueCsrfToken()).toThrow(/CSRF_SECRET/);
  });

  it("firma y verifica cuando existe un secreto suficiente", () => {
    mutableEnv.NODE_ENV = "production";
    mutableEnv.CSRF_SECRET = "test-csrf-secret-with-enough-length-123456";
    expect(verifyCsrfToken(issueCsrfToken())).toBe(true);
  });

  it("rechaza secretos de producción menores a 32 caracteres", () => {
    mutableEnv.NODE_ENV = "production";
    mutableEnv.CSRF_SECRET = "short-production-secret";
    expect(() => issueCsrfToken()).toThrow(/32 characters/);
  });
});
