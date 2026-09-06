import { describe, expect, it } from "vitest";
import { verifyPassword } from "../../src/lib/account-auth/password";

describe("legacy password compatibility", () => {
  it("rejects a missing legacy hash without throwing", async () => {
    await expect(verifyPassword("password123", null)).resolves.toBe(false);
  });
});
