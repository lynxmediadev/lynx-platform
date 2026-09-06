import "server-only";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

const appUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  emailVerifiedAt: true,
} as const;

export type AppAuthUser = NonNullable<
  Awaited<ReturnType<typeof resolveSupabaseAppUser>>
>;

function confirmedAt(user: SupabaseUser) {
  const raw = user.email_confirmed_at ?? user.confirmed_at;
  return raw ? new Date(raw) : null;
}

export async function resolveSupabaseAppUser(user: SupabaseUser) {
  const verifiedAt = confirmedAt(user);
  const email = user.email?.trim().toLowerCase();
  if (!verifiedAt || !email) return null;

  const linked = await prisma.user.findUnique({
    where: { supabaseAuthUserId: user.id },
    select: appUserSelect,
  });
  if (linked) {
    if (!linked.emailVerifiedAt) {
      return prisma.user.update({
        where: { id: linked.id },
        data: { emailVerifiedAt: verifiedAt, authLinkedAt: new Date() },
        select: appUserSelect,
      });
    }
    return linked;
  }

  const candidate = await prisma.user.findUnique({
    where: { email },
    select: { ...appUserSelect, supabaseAuthUserId: true },
  });
  if (!candidate || candidate.supabaseAuthUserId) return null;

  await prisma.user.updateMany({
    where: { id: candidate.id, supabaseAuthUserId: null },
    data: {
      supabaseAuthUserId: user.id,
      authLinkedAt: new Date(),
      emailVerifiedAt: candidate.emailVerifiedAt ?? verifiedAt,
    },
  });

  return prisma.user.findUnique({
    where: { supabaseAuthUserId: user.id },
    select: appUserSelect,
  });
}

export async function getActiveSupabaseAppUser(user: SupabaseUser) {
  const appUser = await resolveSupabaseAppUser(user);
  return appUser?.status === "ACTIVE" ? appUser : null;
}
