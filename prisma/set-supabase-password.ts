import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: process.env.ENV_FILE || ".env.local", quiet: true });

const prisma = new PrismaClient();
const args = process.argv.slice(2);

function required(name: string) {
  const value = (process.env[name] ?? "").trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function selectedEmail() {
  const index = args.indexOf("--email");
  const fromSeparateArg = index >= 0 ? args[index + 1] : undefined;
  const fromInlineArg = args.find((arg) => arg.startsWith("--email="));
  const value = fromInlineArg?.slice("--email=".length) ?? fromSeparateArg;
  if (!value || args.filter((arg) => arg.startsWith("--email")).length !== 1) {
    throw new Error("Use exactly one --email address");
  }
  return value.trim().toLowerCase();
}

async function promptHidden(label: string) {
  if (!process.stdin.isTTY) {
    throw new Error("Run this command from an interactive terminal");
  }

  process.stdout.write(label);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  return new Promise<string>((resolve, reject) => {
    let value = "";
    const cleanup = () => {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    };
    const onData = (input: string) => {
      if (input === "\u0003") {
        cleanup();
        reject(new Error("Cancelled"));
        return;
      }
      if (input === "\r" || input === "\n") {
        cleanup();
        process.stdout.write("\n");
        resolve(value);
        return;
      }
      if (input === "\u007f" || input === "\b") {
        value = value.slice(0, -1);
        return;
      }
      if (/^[\x20-\x7E]+$/.test(input)) value += input;
    };
    process.stdin.on("data", onData);
  });
}

async function main() {
  const email = selectedEmail();
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      status: true,
      supabaseAuthUserId: true,
    },
  });
  if (!user || user.status !== "ACTIVE" || !user.supabaseAuthUserId) {
    throw new Error("Active linked Prisma user not found");
  }

  const password = await promptHidden("Nueva password (mínimo 8 caracteres): ");
  const confirmation = await promptHidden("Repite la password: ");
  if (password.length < 8)
    throw new Error("Password must be at least 8 characters");
  if (password !== confirmation) throw new Error("Passwords do not match");

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
  const { data, error } = await client.auth.admin.getUserById(
    user.supabaseAuthUserId,
  );
  if (error) throw error;
  if (data.user.email?.toLowerCase() !== user.email.toLowerCase()) {
    throw new Error("Supabase identity email mismatch");
  }

  const { error: updateError } = await client.auth.admin.updateUserById(
    user.supabaseAuthUserId,
    { password },
  );
  if (updateError) throw updateError;

  console.log(
    `Password updated for ${user.email}. No password was printed or stored locally.`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
