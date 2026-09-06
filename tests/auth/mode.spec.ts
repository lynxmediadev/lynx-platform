import { afterEach, describe, expect, it } from "vitest";
import {
  allowsLegacyAuth,
  allowsSupabaseAuth,
  parseAuthMode,
} from "../../src/lib/account-auth/mode";

describe("auth mode", () => {
  const previous = process.env.AUTH_MODE;

  afterEach(() => {
    if (previous === undefined) delete process.env.AUTH_MODE;
    else process.env.AUTH_MODE = previous;
  });

  it("defaults to legacy to preserve local compatibility", () => {
    expect(parseAuthMode(undefined)).toBe("legacy");
  });

  it.each(["legacy", "hybrid", "supabase"] as const)("accepts %s", (mode) => {
    expect(parseAuthMode(mode)).toBe(mode);
  });

  it("rejects an unknown mode", () => {
    expect(() => parseAuthMode("anything")).toThrow(/AUTH_MODE/);
  });

  it("enables only the expected providers", () => {
    expect(allowsLegacyAuth("legacy")).toBe(true);
    expect(allowsSupabaseAuth("legacy")).toBe(false);
    expect(allowsLegacyAuth("hybrid")).toBe(true);
    expect(allowsSupabaseAuth("hybrid")).toBe(true);
    expect(allowsLegacyAuth("supabase")).toBe(false);
    expect(allowsSupabaseAuth("supabase")).toBe(true);
  });
});
