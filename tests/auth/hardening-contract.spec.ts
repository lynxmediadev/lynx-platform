import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("phase 1 hardening contract", () => {
  it("keeps the Prisma migration additive", async () => {
    const migration = await readFile(
      resolve(
        root,
        "prisma/migrations/20260906160000_add_supabase_auth_link/migration.sql",
      ),
      "utf8",
    );
    expect(migration).toContain('ADD COLUMN "supabaseAuthUserId" UUID');
    expect(migration).not.toMatch(/DROP\s+(TABLE|COLUMN)/i);
  });

  it.each([
    "src/app/admin/licensing/[id]/assignee/route.ts",
    "src/app/admin/licensing/[id]/follow-up/route.ts",
    "src/app/admin/licensing/[id]/internal-notes/route.ts",
    "src/app/admin/licensing/[id]/priority/route.ts",
    "src/app/admin/licensing/[id]/status/route.ts",
    "src/app/admin/licensing/export/route.ts",
  ])("protects %s inside the handler", async (path) => {
    const source = await readFile(resolve(root, path), "utf8");
    expect(source).toContain("requireRouteAdminOrStaff");
  });

  it("keeps legacy admin API access available only outside strict Supabase mode", async () => {
    const source = await readFile(
      resolve(root, "src/lib/account-auth/route-guards.ts"),
      "utf8",
    );
    expect(source).toContain("if (!allowsLegacyAuth()) return null");
    expect(source).toMatch(
      /export async function getRouteUser\(\)[\s\S]*return getLegacyRouteAdmin\(\)/,
    );
  });

  it("keeps provisioning explicit and idempotent for linked identities", async () => {
    const source = await readFile(
      resolve(root, "prisma/provision.supabase-auth.ts"),
      "utf8",
    );
    expect(source).toContain("--apply requires at least one explicit --email");
    expect(source).toContain("getUserById");
    expect(source).toContain("already_linked");
  });

  it("exchanges the Supabase PKCE callback before resolving the Prisma profile", async () => {
    const source = await readFile(
      resolve(root, "src/app/auth/callback/route.ts"),
      "utf8",
    );
    expect(source).toContain("exchangeCodeForSession");
    expect(source).toContain("resolveSupabaseAppUser");
    expect(source).toContain('appUser.status === "SUSPENDED"');
  });

  it("never exposes the service-role key as a public variable", async () => {
    const example = await readFile(resolve(root, ".env.example"), "utf8");
    expect(example).toContain("SUPABASE_SERVICE_ROLE_KEY=");
    expect(example).not.toContain("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
  });
});
