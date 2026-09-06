import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  getAuthEmailProviderName,
  shouldExposeEmailDebugLinks,
} from "@/lib/account-auth/email";
import { sendVerifyEmail } from "@/lib/account-auth/email/service";
import { normalizeBaseUrl } from "@/lib/account-auth/invite";
import { hashPassword } from "@/lib/account-auth/password";
import { consumeRateLimit } from "@/lib/account-auth/rate-limit";
import { createUserSession } from "@/lib/account-auth/session";
import { verifyTurnstile } from "@/lib/account-auth/turnstile";
import { createEmailVerificationTokenForUser } from "@/lib/account-auth/verify-email";
import { ensureDefaultAllTracksPlaylistForUser } from "@/lib/playlists/service";
import { prisma } from "@/lib/prisma";
import { allowsLegacyAuth, allowsSupabaseAuth } from "@/lib/account-auth/mode";
import { resolveSupabaseAppUser } from "@/lib/account-auth/supabase-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function parseInviteToken(raw: string) {
  return raw.trim();
}

function registerErrorUrl(baseUrl: string, err: string, token: string) {
  const url = new URL(`/auth/register?err=${encodeURIComponent(err)}`, baseUrl);
  if (url.hostname === "0.0.0.0") {
    url.hostname = "localhost";
  }
  if (token) url.searchParams.set("token", token);
  return url;
}

function fingerprintFromRequest(req: NextRequest, email: string) {
  const ip =
    req.headers.get("x-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    "unknown-ip";
  const ua = req.headers.get("user-agent") ?? "unknown-ua";
  return `${ip}|${ua}|${email.trim().toLowerCase()}`;
}

function redirectUrl(req: NextRequest, path: string) {
  const url = new URL(path, req.url);
  if (url.hostname === "0.0.0.0") {
    url.hostname = "localhost";
  }
  return url;
}

function postRegisterDestination(
  role: "ADMIN" | "STAFF" | "CREATOR" | "CLIENT",
) {
  if (role === "CREATOR") return "/creator/tracks";
  if (role === "CLIENT") return "/";
  return "/admin/tracks";
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const name = (formData.get("name")?.toString() ?? "").trim();
  const emailInput = (formData.get("email")?.toString() ?? "")
    .trim()
    .toLowerCase();
  const password = (formData.get("password")?.toString() ?? "").trim();
  const supabaseFlow = (formData.get("supabase")?.toString() ?? "") === "1";
  const inviteTokenRaw = parseInviteToken(
    formData.get("token")?.toString() ?? "",
  );
  const turnstileToken = (
    formData.get("cf-turnstile-response")?.toString() ?? ""
  ).trim();

  const captcha = await verifyTurnstile({
    token: turnstileToken,
    remoteIp:
      req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "",
  });
  if (!captcha.ok) {
    return NextResponse.redirect(
      registerErrorUrl(req.url, "captcha", inviteTokenRaw),
      { status: 303 },
    );
  }

  if (!name || !password || (!supabaseFlow && !inviteTokenRaw)) {
    return NextResponse.redirect(
      registerErrorUrl(req.url, "missing", inviteTokenRaw),
      { status: 303 },
    );
  }

  const throttle = await consumeRateLimit({
    action: "register",
    fingerprint: fingerprintFromRequest(req, emailInput || "unknown"),
    maxAttempts: 6,
    windowMs: 1000 * 60 * 15,
    blockMs: 1000 * 60 * 15,
  });
  if (!throttle.allowed) {
    return NextResponse.redirect(
      registerErrorUrl(req.url, "rate_limited", inviteTokenRaw),
      { status: 303 },
    );
  }

  if (password.length < 8) {
    return NextResponse.redirect(
      registerErrorUrl(req.url, "password", inviteTokenRaw),
      { status: 303 },
    );
  }

  if (supabaseFlow && allowsSupabaseAuth()) {
    const client = await createSupabaseServerClient();
    const { data } = client
      ? await client.auth.getUser()
      : { data: { user: null } };
    const appUser = data.user ? await resolveSupabaseAppUser(data.user) : null;
    if (!client || !data.user || !appUser || appUser.status !== "INVITED") {
      return NextResponse.redirect(registerErrorUrl(req.url, "invite", ""), {
        status: 303,
      });
    }
    const { error } = await client.auth.updateUser({
      password,
      data: { display_name: name },
    });
    if (error) {
      return NextResponse.redirect(registerErrorUrl(req.url, "password", ""), {
        status: 303,
      });
    }
    const user = await prisma.user.update({
      where: { id: appUser.id },
      data: {
        name,
        passwordHash: null,
        status: "ACTIVE",
        emailVerifiedAt: appUser.emailVerifiedAt ?? new Date(),
        lastLoginAt: new Date(),
      },
      select: { id: true, role: true },
    });
    await ensureDefaultAllTracksPlaylistForUser({
      userId: user.id,
      role: user.role,
      userName: name,
    });
    return NextResponse.redirect(
      redirectUrl(req, postRegisterDestination(user.role)),
      {
        status: 303,
      },
    );
  }

  if (!allowsLegacyAuth()) {
    return NextResponse.redirect(
      registerErrorUrl(req.url, "invite", inviteTokenRaw),
      { status: 303 },
    );
  }

  const invite = await prisma.inviteToken.findFirst({
    where: {
      tokenHash: hashToken(inviteTokenRaw),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      email: true,
      userId: true,
    },
  });

  if (!invite) {
    return NextResponse.redirect(
      registerErrorUrl(req.url, "invite", inviteTokenRaw),
      { status: 303 },
    );
  }
  const inviteEmail = invite.email.toLowerCase();
  const email = emailInput || inviteEmail;
  if (email !== inviteEmail) {
    return NextResponse.redirect(
      registerErrorUrl(req.url, "email", inviteTokenRaw),
      { status: 303 },
    );
  }

  const invitedUser = await prisma.user.findUnique({
    where: { id: invite.userId },
    select: { id: true, email: true, status: true, role: true },
  });

  if (!invitedUser || invitedUser.email.toLowerCase() !== inviteEmail) {
    return NextResponse.redirect(
      registerErrorUrl(req.url, "invite", inviteTokenRaw),
      { status: 303 },
    );
  }

  if (invitedUser.status !== "INVITED") {
    return NextResponse.redirect(
      registerErrorUrl(req.url, "exists", inviteTokenRaw),
      { status: 303 },
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.update({
    where: { id: invitedUser.id },
    data: {
      name,
      passwordHash,
      status: "ACTIVE",
      emailVerifiedAt: null,
    },
    select: { id: true, role: true },
  });

  await prisma.inviteToken.update({
    where: { id: invite.id },
    data: { usedAt: new Date() },
  });

  await ensureDefaultAllTracksPlaylistForUser({
    userId: user.id,
    role: user.role,
    userName: name,
  });

  await createUserSession({
    userId: user.id,
    role: user.role,
    ip: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  const verifyToken = await createEmailVerificationTokenForUser({
    userId: user.id,
    requestedIp:
      req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip"),
  });
  let verifySent = Boolean(verifyToken);
  if (verifyToken) {
    const baseUrl = normalizeBaseUrl(
      process.env.APP_BASE_URL || req.nextUrl.origin,
    );
    const verifyUrl = `${baseUrl}/auth/verify-email/confirm?token=${encodeURIComponent(
      verifyToken.rawToken,
    )}`;
    try {
      await sendVerifyEmail({
        to: verifyToken.email,
        verifyUrl,
        expiresAt: verifyToken.expiresAt,
      });
    } catch (error) {
      verifySent = false;
      console.error("[auth:register] verify_email_send_failed", {
        provider: getAuthEmailProviderName(),
        userId: user.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (verifyToken) {
    const verifyDebug =
      shouldExposeEmailDebugLinks() && getAuthEmailProviderName() === "console"
        ? `&debugLink=${encodeURIComponent(
            `${normalizeBaseUrl(process.env.APP_BASE_URL || req.nextUrl.origin)}/auth/verify-email/confirm?token=${encodeURIComponent(
              verifyToken.rawToken,
            )}`,
          )}`
        : "";
    const resultQuery = verifySent ? "ok=sent" : "err=send_failed";
    return NextResponse.redirect(
      redirectUrl(req, `/auth/verify-email?${resultQuery}${verifyDebug}`),
      { status: 303 },
    );
  }

  return NextResponse.redirect(
    redirectUrl(req, postRegisterDestination(user.role)),
    {
      status: 303,
    },
  );
}
