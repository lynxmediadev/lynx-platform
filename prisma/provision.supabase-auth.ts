import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import {
  createClient,
  type SupabaseClient,
  type User as SupabaseUser,
} from "@supabase/supabase-js";

dotenv.config({ path: process.env.ENV_FILE || ".env.local", quiet: true });

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const apply = args.includes("--apply");

function selectedEmails() {
  const selected: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index] ?? "";
    if (value.startsWith("--email="))
      selected.push(value.slice("--email=".length));
    if (value === "--email" && args[index + 1])
      selected.push(args[index + 1] ?? "");
  }
  return [
    ...new Set(
      selected.map((email) => email.trim().toLowerCase()).filter(Boolean),
    ),
  ];
}

function required(name: string) {
  const value = (process.env[name] ?? "").trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function findAuthUserByEmail(
  client: SupabaseClient,
  email: string,
): Promise<SupabaseUser | null> {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({
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

async function main() {
  const emails = selectedEmails();
  const candidates = await prisma.user.findMany({
    where: emails.length
      ? { email: { in: emails, mode: "insensitive" } }
      : { status: { not: "SUSPENDED" } },
    orderBy: { email: "asc" },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      supabaseAuthUserId: true,
    },
  });

  if (!apply) {
    console.log("DRY RUN: no se enviaron correos ni se modificaron usuarios.");
    for (const user of candidates) {
      console.log(
        `${user.email}\t${user.role}\t${user.status}\t${user.supabaseAuthUserId ? "linked" : "pending"}`,
      );
    }
    console.log(
      `Candidatos: ${candidates.length}. Para aplicar, agrega --apply --email usuario@dominio.`,
    );
    return;
  }

  if (!emails.length) {
    throw new Error("--apply requires at least one explicit --email");
  }
  if (candidates.length !== emails.length) {
    const found = new Set(candidates.map((user) => user.email.toLowerCase()));
    const missing = emails.filter((email) => !found.has(email));
    throw new Error(`App users not found: ${missing.join(", ")}`);
  }

  const client = createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
  const appBaseUrl = required("APP_BASE_URL").replace(/\/$/, "");
  const callback = new URL("/auth/callback", appBaseUrl);
  callback.searchParams.set("next", "/auth/register?supabase=1");

  for (const user of candidates) {
    if (user.status === "SUSPENDED") {
      console.log(`${user.email}: skipped_suspended`);
      continue;
    }

    if (user.supabaseAuthUserId) {
      const { data, error } = await client.auth.admin.getUserById(
        user.supabaseAuthUserId,
      );
      if (error) throw error;
      if (data.user.email?.toLowerCase() !== user.email.toLowerCase()) {
        throw new Error(`Supabase identity email mismatch for ${user.email}`);
      }
      console.log(`${user.email}: already_linked`);
      continue;
    }

    let authUser = await findAuthUserByEmail(client, user.email.toLowerCase());
    if (!authUser) {
      const { data, error } = await client.auth.admin.inviteUserByEmail(
        user.email,
        {
          redirectTo: callback.toString(),
          data: { app_user_id: user.id, app_role: user.role },
        },
      );
      if (error) throw error;
      authUser = data.user;
      console.log(`${user.email}: invited`);
    } else if (authUser.email_confirmed_at) {
      const resetCallback = new URL("/auth/callback", appBaseUrl);
      resetCallback.searchParams.set("next", "/auth/reset-password");
      const { error } = await client.auth.resetPasswordForEmail(user.email, {
        redirectTo: resetCallback.toString(),
      });
      if (error) throw error;
      console.log(`${user.email}: reset_sent`);
    } else {
      const { error } = await client.auth.resend({
        type: "signup",
        email: user.email,
        options: { emailRedirectTo: callback.toString() },
      });
      if (error) throw error;
      console.log(`${user.email}: invite_resent`);
    }

    const conflicting = await prisma.user.findFirst({
      where: { supabaseAuthUserId: authUser.id, id: { not: user.id } },
      select: { id: true },
    });
    if (conflicting)
      throw new Error(`Supabase identity conflict for ${user.email}`);

    await prisma.user.update({
      where: { id: user.id },
      data: { supabaseAuthUserId: authUser.id, authLinkedAt: new Date() },
    });
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
