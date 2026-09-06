import { NextRequest, NextResponse } from "next/server";
import {
  getAuthEmailProviderName,
  shouldExposeEmailDebugLinks,
} from "@/lib/account-auth/email";
import { sendVerifyEmail } from "@/lib/account-auth/email/service";
import { normalizeBaseUrl } from "@/lib/account-auth/invite";
import { consumeRateLimit } from "@/lib/account-auth/rate-limit";
import { getAuthenticatedAppUser } from "@/lib/account-auth/principal";
import { createEmailVerificationTokenForUser } from "@/lib/account-auth/verify-email";

function redirectUrl(req: NextRequest, path: string) {
  const url = new URL(path, req.url);
  if (url.hostname === "0.0.0.0") {
    url.hostname = "localhost";
  }
  return url;
}

function fingerprintFromRequest(req: NextRequest, userId: string) {
  const ip =
    req.headers.get("x-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    "unknown-ip";
  const ua = req.headers.get("user-agent") ?? "unknown-ua";
  return `${ip}|${ua}|${userId}`;
}

export async function POST(req: NextRequest) {
  const sessionUser = await getAuthenticatedAppUser();
  if (!sessionUser) {
    return NextResponse.redirect(
      redirectUrl(req, "/auth/login?err=unauthorized"),
      { status: 303 },
    );
  }
  const baseDestination =
    sessionUser.role === "CREATOR"
      ? "/creator/account"
      : sessionUser.role === "CLIENT"
        ? "/"
        : "/admin/account";

  if (sessionUser.emailVerifiedAt) {
    return NextResponse.redirect(
      redirectUrl(req, `${baseDestination}?ok=already`),
      { status: 303 },
    );
  }

  const throttle = await consumeRateLimit({
    action: "verify_email_send",
    fingerprint: fingerprintFromRequest(req, sessionUser.id),
    maxAttempts: 6,
    windowMs: 1000 * 60 * 15,
    blockMs: 1000 * 60 * 15,
  });
  if (!throttle.allowed) {
    return NextResponse.redirect(
      redirectUrl(req, `${baseDestination}?err=rate_limited`),
      {
        status: 303,
      },
    );
  }

  const token = await createEmailVerificationTokenForUser({
    userId: sessionUser.id,
    requestedIp:
      req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip"),
  });

  if (!token) {
    return NextResponse.redirect(
      redirectUrl(req, `${baseDestination}?err=invalid`),
      { status: 303 },
    );
  }

  const baseUrl = normalizeBaseUrl(
    process.env.APP_BASE_URL || req.nextUrl.origin,
  );
  const verifyUrl = `${baseUrl}/auth/verify-email/confirm?token=${encodeURIComponent(token.rawToken)}`;

  try {
    await sendVerifyEmail({
      to: token.email,
      verifyUrl,
      expiresAt: token.expiresAt,
    });
  } catch (error) {
    console.error("[auth:verify-email:send] provider_error", {
      provider: getAuthEmailProviderName(),
      userId: sessionUser.id,
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.redirect(
      redirectUrl(req, `${baseDestination}?err=verify_send_failed`),
      {
        status: 303,
      },
    );
  }

  const debugLink =
    shouldExposeEmailDebugLinks() && getAuthEmailProviderName() === "console"
      ? `&debugLink=${encodeURIComponent(verifyUrl)}`
      : "";

  return NextResponse.redirect(
    redirectUrl(req, `${baseDestination}?ok=verify_sent${debugLink}`),
    {
      status: 303,
    },
  );
}
