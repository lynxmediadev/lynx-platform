import { describe, expect, it } from "vitest";
import {
  getSafeRedirectByRole,
  hasActiveRole,
} from "../../src/lib/account-auth/policy";

describe("authorization policy", () => {
  it.each([
    ["ADMIN", true],
    ["STAFF", true],
    ["CREATOR", false],
    ["CLIENT", false],
  ] as const)("checks the ADMIN/STAFF matrix for %s", (role, expected) => {
    expect(hasActiveRole({ role, status: "ACTIVE" }, ["ADMIN", "STAFF"])).toBe(
      expected,
    );
  });

  it("always rejects suspended and invited profiles", () => {
    expect(
      hasActiveRole({ role: "ADMIN", status: "SUSPENDED" }, ["ADMIN"]),
    ).toBe(false);
    expect(hasActiveRole({ role: "ADMIN", status: "INVITED" }, ["ADMIN"])).toBe(
      false,
    );
  });

  it("keeps role destinations internal and blocks protocol-relative redirects", () => {
    expect(getSafeRedirectByRole("ADMIN", "/admin/users")).toBe("/admin/users");
    expect(getSafeRedirectByRole("CREATOR", "/creator/tracks")).toBe(
      "/creator/tracks",
    );
    expect(getSafeRedirectByRole("CLIENT", "/catalog")).toBe("/catalog");
    expect(getSafeRedirectByRole("ADMIN", "//evil.example")).toBe(
      "/admin/tracks",
    );
    expect(getSafeRedirectByRole("CREATOR", "/admin/users")).toBe(
      "/creator/tracks",
    );
  });
});
