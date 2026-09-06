import { NextRequest, NextResponse } from "next/server";
import {
  getAuthEmailProviderName,
  shouldExposeEmailDebugLinks,
} from "@/lib/account-auth/email";
import { sendResetPasswordEmail } from "@/lib/account-auth/email/service";
import { createPasswordResetToken } from "@/lib/account-auth/reset";
import { consumeRateLimit } from "@/lib/account-auth/rate-limit";
import { verifyTurnstile } from "@/lib/account-auth/turnstile";
import {
  allowsLegacyAuth,
  allowsSupabaseAuth,
  getAuthMode,
} from "@/lib/account-auth/mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

function redirectUrl(req: NextRequest, path: string) {
  const url = new URL(path, req.url);
  if (url.hostname === "0.0.0.0") {
    url.hostname = "localhost";
  }
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

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const email = (formData.get("email")?.toString() ?? "").trim().toLowerCase();
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
      redirectUrl(req, "/auth/forgot-password?err=captcha"),
      {
        status: 303,
      },
    );
  }

  const throttle = await consumeRateLimit({
    action: "forgot",
    fingerprint: fingerprintFromRequest(req, email || "unknown"),
    maxAttempts: 5,
    windowMs: 1000 * 60 * 15,
    blockMs: 1000 * 60 * 15,
  });

  if (!throttle.allowed) {
    return NextResponse.redirect(
      redirectUrl(req, "/auth/forgot-password?err=rate_limited"),
      {
        status: 303,
      },
    );
  }

  if (!email) {
    return NextResponse.redirect(
      redirectUrl(req, "/auth/forgot-password?ok=sent"),
      { status: 303 },
    );
  }

  const mode = getAuthMode();
  if (allowsSupabaseAuth(mode)) {
    const profile = await prisma.user.findUnique({
      where: { email },
      select: { supabaseAuthUserId: true },
    });
    if (profile?.supabaseAuthUserId || !allowsLegacyAuth(mode)) {
      const client = await createSupabaseServerClient();
      if (client) {
        const callback = new URL("/auth/callback", req.nextUrl.origin);
        callback.searchParams.set("next", "/auth/reset-password");
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: callback.toString(),
        });
        if (error) {
          console.error("[auth:forgot-password] supabase_send_failed", {
            code: error.code,
          });
        }
      }
      return NextResponse.redirect(
        redirectUrl(req, "/auth/forgot-password?ok=sent"),
        {
          status: 303,
        },
      );
    }
  }

  const reset = await createPasswordResetToken(email);
  if (!reset) {
    return NextResponse.redirect(
      redirectUrl(req, "/auth/forgot-password?ok=sent"),
      { status: 303 },
    );
  }

  const baseUrl = new URL(req.url);
  if (baseUrl.hostname === "0.0.0.0") baseUrl.hostname = "localhost";
  const resetLink = `${baseUrl.origin}/auth/reset-password?token=${encodeURIComponent(reset.rawToken)}`;
  try {
    await sendResetPasswordEmail({
      to: reset.email,
      resetUrl: resetLink,
      expiresAt: reset.expiresAt,
    });
  } catch (error) {
    console.error("[auth:forgot-password] email_send_failed", {
      provider: getAuthEmailProviderName(),
      to: reset.email,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  if (
    shouldExposeEmailDebugLinks() &&
    getAuthEmailProviderName() === "console"
  ) {
    return NextResponse.redirect(
      redirectUrl(
        req,
        `/auth/forgot-password?ok=sent&debugLink=${encodeURIComponent(resetLink)}`,
      ),
      { status: 303 },
    );
  }

  return NextResponse.redirect(
    redirectUrl(req, "/auth/forgot-password?ok=sent"),
    { status: 303 },
  );
}
