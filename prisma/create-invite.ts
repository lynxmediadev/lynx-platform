import { config as loadEnv } from "dotenv";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const db = new PrismaClient();

function hashToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function normalizeBaseUrl(raw: string | undefined) {
  const fallback = "http://localhost:3000";
  const value = (raw ?? "").trim();
  if (!value) return fallback;
  try {
    const parsed = new URL(value);
    if (parsed.hostname === "0.0.0.0") {
      parsed.hostname = "localhost";
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

async function main() {
  const email = (process.env.INVITE_EMAIL ?? "").trim().toLowerCase();
  const roleRaw = (process.env.INVITE_ROLE ?? "CREATOR").trim().toUpperCase();
  const role =
    roleRaw === "ADMIN" ||
    roleRaw === "STAFF" ||
    roleRaw === "CREATOR" ||
    roleRaw === "CLIENT"
      ? roleRaw
      : "CREATOR";
  const expiresDays = Math.max(1, Number(process.env.INVITE_EXPIRES_DAYS ?? "7"));

  if (!email) {
    throw new Error("Missing INVITE_EMAIL env");
  }

  const placeholderPasswordHash = `invited$${crypto.randomBytes(16).toString("hex")}`;
  const user = await db.user.upsert({
    where: { email },
    update: {
      role: role as any,
      status: "INVITED",
      emailVerifiedAt: null,
    },
    create: {
      email,
      passwordHash: placeholderPasswordHash,
      role: role as any,
      status: "INVITED",
      name: null,
    },
    select: { id: true, email: true, role: true },
  });

  const rawToken = crypto.randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000);

  await db.inviteToken.create({
    data: {
      userId: user.id,
      email: user.email,
      tokenHash: hashToken(rawToken),
      expiresAt,
    },
  });

  const registerUrl = `${normalizeBaseUrl(process.env.APP_BASE_URL)}/auth/register?token=${rawToken}`;
  console.log("Invite created:", {
    email: user.email,
    role: user.role,
    expiresAt: expiresAt.toISOString(),
    token: rawToken,
    registerUrl,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
