import "server-only";

import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveSupabaseAppUser } from "@/lib/account-auth/supabase-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LoginResult =
  | {
      ok: true;
      user: NonNullable<Awaited<ReturnType<typeof resolveSupabaseAppUser>>>;
    }
  | { ok: false; reason: "config" | "invalid" | "unverified" | "unauthorized" };

export async function signInWithSupabaseAccount(input: {
  email: string;
  password: string;
  allowedRoles?: readonly UserRole[];
}): Promise<LoginResult> {
  const client = await createSupabaseServerClient();
  if (!client) return { ok: false, reason: "config" };

  const { data, error } = await client.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error || !data.user) {
    const unverified = error?.code === "email_not_confirmed";
    return { ok: false, reason: unverified ? "unverified" : "invalid" };
  }

  const appUser = await resolveSupabaseAppUser(data.user);
  const roleAllowed =
    appUser &&
    (!input.allowedRoles || input.allowedRoles.includes(appUser.role));
  if (!appUser || appUser.status !== "ACTIVE" || !roleAllowed) {
    await client.auth.signOut();
    return { ok: false, reason: "unauthorized" };
  }

  await prisma.user.update({
    where: { id: appUser.id },
    data: { lastLoginAt: new Date() },
    select: { id: true },
  });
  return { ok: true, user: appUser };
}
