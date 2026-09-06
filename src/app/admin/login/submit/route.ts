/**
 * POST /admin/login/submit
 * 1) Login nuevo por cuenta (email/password) con rol ADMIN/STAFF.
 * 2) Fallback temporal legacy por clave de entorno.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createUserSession } from "@/lib/account-auth/session";
import {
  allowsLegacyAuth,
  allowsSupabaseAuth,
  getAuthMode,
} from "@/lib/account-auth/mode";
import { signInWithSupabaseAccount } from "@/lib/account-auth/supabase-login";
import { verifyPassword } from "@/lib/account-auth/password";
import { consumeRateLimit } from "@/lib/account-auth/rate-limit";
import { verifyTurnstile } from "@/lib/account-auth/turnstile";
import { signAdminTokenV1, sha256Hex } from "@/lib/auth";
import { ENV } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";

function parseField(formData: FormData, name: string) {
  return (formData.get(name)?.toString() ?? "").trim();
}

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
  const email = parseField(formData, "email").toLowerCase();
  const password = parseField(formData, "password");
  const legacyKey = parseField(formData, "legacy_key");
  const turnstileToken = parseField(formData, "cf-turnstile-response");

  const captcha = await verifyTurnstile({
    token: turnstileToken,
    remoteIp:
      req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "",
  });
  if (!captcha.ok) {
    return NextResponse.redirect(redirectUrl(req, "/admin/login?err=captcha"), {
      status: 303,
    });
  }

  const throttle = await consumeRateLimit({
    action: "login",
    fingerprint: fingerprintFromRequest(req, email || "legacy-admin"),
    maxAttempts: 10,
    windowMs: 1000 * 60 * 15,
    blockMs: 1000 * 60 * 15,
  });
  if (!throttle.allowed) {
    return NextResponse.redirect(
      redirectUrl(req, "/admin/login?err=rate_limited"),
      { status: 303 },
    );
  }

  const mode = getAuthMode();

  if (email && password && allowsSupabaseAuth(mode)) {
    const result = await signInWithSupabaseAccount({
      email,
      password,
      allowedRoles: ["ADMIN", "STAFF"],
    });
    if (result.ok) {
      const c = await cookies();
      for (const name of ["app_session", "admin_key", "admin_session"]) {
        c.set(name, "", {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 0,
        });
      }
      return NextResponse.redirect(redirectUrl(req, "/admin/tracks"), {
        status: 303,
      });
    }
    if (
      !allowsLegacyAuth(mode) ||
      result.reason === "config" ||
      result.reason === "unverified"
    ) {
      const reason =
        result.reason === "config"
          ? "config"
          : result.reason === "unverified"
            ? "unverified"
            : "1";
      return NextResponse.redirect(
        redirectUrl(req, `/admin/login?err=${reason}`),
        { status: 303 },
      );
    }
  }

  // 1) Login nuevo por cuenta
  if (email && password && allowsLegacyAuth(mode)) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
        status: true,
        passwordHash: true,
        emailVerifiedAt: true,
      },
    });

    const allowedRole = user?.role === "ADMIN" || user?.role === "STAFF";
    if (user && user.status === "ACTIVE" && allowedRole) {
      const ok = await verifyPassword(password, user.passwordHash);
      if (ok) {
        if (ENV.AUTH_ENFORCE_VERIFIED_EMAIL() && !user.emailVerifiedAt) {
          return NextResponse.redirect(
            redirectUrl(req, "/admin/login?err=unverified"),
            {
              status: 303,
            },
          );
        }
        await createUserSession({
          userId: user.id,
          role: user.role,
          ip: req.headers.get("x-forwarded-for") ?? undefined,
          userAgent: req.headers.get("user-agent") ?? undefined,
        });

        const c = await cookies();
        c.set("admin_key", "", {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 0,
        });
        c.set("admin_session", "", {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 0,
        });

        return NextResponse.redirect(redirectUrl(req, "/admin/tracks"), {
          status: 303,
        });
      }
    }
  }

  // 2) Fallback legacy temporal
  const ENV_PASS = (process.env.ADMIN_PASS ?? "").trim();
  const ENV_KEY = (process.env.ADMIN_ACCESS_KEY ?? "").trim();
  const SECRET =
    (process.env.ADMIN_SESSION_SECRET ?? "").trim() ||
    (process.env.AUTH_SESSION_SECRET ?? "").trim();
  const BIND_UA = (process.env.ADMIN_BIND_UA ?? "") === "1";
  const providedLegacy = legacyKey || password;

  const accepted = [ENV_KEY, ENV_PASS].filter(Boolean) as string[];
  if (
    allowsLegacyAuth(mode) &&
    SECRET &&
    providedLegacy &&
    accepted.includes(providedLegacy)
  ) {
    const now = Date.now();
    const ttlMs = 7 * 24 * 60 * 60 * 1000;
    const jti = crypto.randomBytes(16).toString("hex");
    const payload: {
      sub: "admin";
      iat: number;
      exp: number;
      jti: string;
      ua?: string;
    } = {
      sub: "admin",
      iat: now,
      exp: now + ttlMs,
      jti,
    };

    if (BIND_UA) {
      const h = await headers();
      payload.ua = sha256Hex(h.get("user-agent") || "");
    }

    const token = signAdminTokenV1(payload, SECRET);
    const c = await cookies();
    c.set("admin_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Math.floor(ttlMs / 1000),
    });
    c.set("admin_key", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return NextResponse.redirect(redirectUrl(req, "/admin/tracks"), {
      status: 303,
    });
  }

  return NextResponse.redirect(redirectUrl(req, "/admin/login?err=1"), {
    status: 303,
  });
}
