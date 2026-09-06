import "server-only";
import crypto from "node:crypto";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureDefaultAllTracksPlaylistForUser } from "@/lib/playlists/service";

type CreateInviteInput = {
  email: string;
  role?: UserRole;
  expiresDays?: number;
};

function hashToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

function sanitizeInviteInput(input: CreateInviteInput) {
  const email = normalizeEmail(input.email);
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    throw new Error("Invalid email");
  }

  const role = input.role ?? "CREATOR";
  const expiresDays = Math.max(1, Math.min(Number(input.expiresDays ?? 7), 30));

  return {
    email,
    role,
    expiresDays,
  };
}

export function normalizeBaseUrl(raw: string | undefined) {
  const fallback = "http://localhost:3004";
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

export async function createInvite(input: CreateInviteInput) {
  const normalized = sanitizeInviteInput(input);
  const placeholderPasswordHash = `invited$${crypto.randomBytes(16).toString("hex")}`;

  const invitedUser = await prisma.user.upsert({
    where: { email: normalized.email },
    update: {
      role: normalized.role,
      status: "INVITED",
      emailVerifiedAt: null,
    },
    create: {
      email: normalized.email,
      role: normalized.role,
      status: "INVITED",
      passwordHash: placeholderPasswordHash,
      name: null,
    },
    select: { id: true, email: true, role: true },
  });

  await ensureDefaultAllTracksPlaylistForUser({
    userId: invitedUser.id,
    role: invitedUser.role,
  });

  const rawToken = crypto.randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + normalized.expiresDays * 24 * 60 * 60 * 1000);

  await prisma.inviteToken.create({
    data: {
      userId: invitedUser.id,
      email: invitedUser.email,
      tokenHash: hashToken(rawToken),
      expiresAt,
    },
  });

  return {
    email: invitedUser.email,
    role: invitedUser.role,
    token: rawToken,
    expiresAt,
  };
}
