import "server-only";

import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureDefaultAllTracksPlaylistForUser } from "@/lib/playlists/service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function findAuthUserByEmail(email: string) {
  const admin = createSupabaseAdminClient();
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 100,
    });
    if (error) throw error;
    const found = data.users.find(
      (user) => user.email?.toLowerCase() === email,
    );
    if (found || data.users.length < 100) return found ?? null;
  }
  throw new Error("Supabase user search exceeded the safe pagination limit");
}

export async function inviteWithSupabase(input: {
  email: string;
  role: UserRole;
  redirectTo: string;
}) {
  const email = input.email.trim().toLowerCase();
  if (!email || !/\S+@\S+\.\S+/.test(email)) throw new Error("Invalid email");

  const previous = await prisma.user.findUnique({
    where: { email },
    select: { id: true, status: true, supabaseAuthUserId: true },
  });
  if (previous?.status === "ACTIVE") throw new Error("User is already active");

  const profile = await prisma.user.upsert({
    where: { email },
    update: { role: input.role, status: "INVITED", emailVerifiedAt: null },
    create: {
      email,
      role: input.role,
      status: "INVITED",
      passwordHash: null,
    },
    select: { id: true, email: true, role: true },
  });

  await ensureDefaultAllTracksPlaylistForUser({
    userId: profile.id,
    role: profile.role,
  });

  const admin = createSupabaseAdminClient();
  const existingAuthUser = await findAuthUserByEmail(email);
  let authUser = existingAuthUser;
  if (!authUser) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: input.redirectTo,
      data: { app_user_id: profile.id, app_role: profile.role },
    });
    if (error) throw error;
    authUser = data.user;
  } else if (!authUser.email_confirmed_at) {
    const { error } = await admin.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: input.redirectTo },
    });
    if (error) throw error;
  } else {
    const { error } = await admin.auth.resetPasswordForEmail(email, {
      redirectTo: input.redirectTo,
    });
    if (error) throw error;
  }

  await prisma.user.update({
    where: { id: profile.id },
    data: {
      supabaseAuthUserId: authUser.id,
      authLinkedAt: new Date(),
    },
  });

  return profile;
}
