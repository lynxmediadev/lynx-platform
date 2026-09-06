import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/account-auth/password";
import { consumeRateLimit } from "@/lib/account-auth/rate-limit";
import { verifyTurnstile } from "@/lib/account-auth/turnstile";
import {
  consumePasswordResetToken,
  findValidPasswordResetToken,
} from "@/lib/account-auth/reset";
import { prisma } from "@/lib/prisma";
import {
  allowsLegacyAuth,
  allowsSupabaseAuth,
  getAuthMode,
} from "@/lib/account-auth/mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function redirectUrl(req: NextRequest, path: string) {
  const url = new URL(path, req.url);
  if (url.hostname === "0.0.0.0") {
    url.hostname = "localhost";
  }
  return url;
}

function withToken(path: string, token: string, extra?: string) {
  const url = new URL(path, "http://localhost");
  if (token) url.searchParams.set("token", token);
  if (extra) {
    const [key, value] = extra.split("=");
    if (key && value) url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

function fingerprintFromRequest(req: NextRequest, token: string) {
  const ip =
    req.headers.get("x-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    "unknown-ip";
  const ua = req.headers.get("user-agent") ?? "unknown-ua";
  return `${ip}|${ua}|${token.slice(0, 16)}`;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const token = (formData.get("token")?.toString() ?? "").trim();
  const password = (formData.get("password")?.toString() ?? "").trim();
  const passwordConfirm = (
    formData.get("passwordConfirm")?.toString() ?? ""
  ).trim();
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
      redirectUrl(req, withToken("/auth/reset-password", token, "err=captcha")),
      { status: 303 },
    );
  }

  const throttle = await consumeRateLimit({
    action: "reset",
    fingerprint: fingerprintFromRequest(req, token || "unknown"),
    maxAttempts: 6,
    windowMs: 1000 * 60 * 15,
    blockMs: 1000 * 60 * 15,
  });
  if (!throttle.allowed) {
    return NextResponse.redirect(
      redirectUrl(
        req,
        withToken("/auth/reset-password", token, "err=rate_limited"),
      ),
      { status: 303 },
    );
  }

  if (password.length < 8) {
    return NextResponse.redirect(
      redirectUrl(
        req,
        withToken("/auth/reset-password", token, "err=password"),
      ),
      { status: 303 },
    );
  }
  if (password !== passwordConfirm) {
    return NextResponse.redirect(
      redirectUrl(
        req,
        withToken("/auth/reset-password", token, "err=mismatch"),
      ),
      { status: 303 },
    );
  }

  const mode = getAuthMode();
  if (allowsSupabaseAuth(mode) && !token) {
    const client = await createSupabaseServerClient();
    if (client) {
      const { data } = await client.auth.getUser();
      if (data.user) {
        const { error } = await client.auth.updateUser({ password });
        if (!error) {
          await client.auth.signOut();
          return NextResponse.redirect(
            redirectUrl(req, "/auth/login?ok=password_reset"),
            {
              status: 303,
            },
          );
        }
      }
    }
    return NextResponse.redirect(
      redirectUrl(req, "/auth/reset-password?err=invalid"),
      {
        status: 303,
      },
    );
  }

  if (!token || !allowsLegacyAuth(mode)) {
    return NextResponse.redirect(
      redirectUrl(req, "/auth/reset-password?err=invalid"),
      { status: 303 },
    );
  }

  const resetToken = await findValidPasswordResetToken(token);
  if (!resetToken || resetToken.user.status === "SUSPENDED") {
    return NextResponse.redirect(
      redirectUrl(req, withToken("/auth/reset-password", token, "err=invalid")),
      { status: 303 },
    );
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash,
        status: "ACTIVE",
      },
    }),
    prisma.userSession.deleteMany({
      where: { userId: resetToken.userId },
    }),
  ]);

  await consumePasswordResetToken(resetToken.id);

  return NextResponse.redirect(
    redirectUrl(req, "/auth/login?ok=password_reset"),
    { status: 303 },
  );
}
