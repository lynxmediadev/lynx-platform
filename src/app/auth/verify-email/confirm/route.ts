import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findValidEmailVerificationToken } from "@/lib/account-auth/verify-email";
import { allowsLegacyAuth } from "@/lib/account-auth/mode";

function redirectUrl(req: NextRequest, path: string) {
  const url = new URL(path, req.url);
  if (url.hostname === "0.0.0.0") {
    url.hostname = "localhost";
  }
  return url;
}

function postVerifyDestination(role: "ADMIN" | "STAFF" | "CREATOR" | "CLIENT") {
  if (role === "CREATOR") return "/creator";
  if (role === "CLIENT") return "/";
  return "/admin";
}

export async function GET(req: NextRequest) {
  if (!allowsLegacyAuth()) {
    return NextResponse.redirect(
      redirectUrl(req, "/auth/verify-email?err=invalid"),
      { status: 303 },
    );
  }
  const token = req.nextUrl.searchParams.get("token")?.trim() ?? "";
  if (!token) {
    return NextResponse.redirect(
      redirectUrl(req, "/auth/verify-email?err=invalid"),
      { status: 303 },
    );
  }

  const verification = await findValidEmailVerificationToken(token);
  if (!verification || verification.user.status !== "ACTIVE") {
    return NextResponse.redirect(
      redirectUrl(req, "/auth/verify-email?err=invalid"),
      { status: 303 },
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verification.userId },
      data: {
        emailVerifiedAt: verification.user.emailVerifiedAt ?? new Date(),
      },
      select: { id: true },
    }),
    prisma.emailVerificationToken.updateMany({
      where: { userId: verification.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.redirect(
    redirectUrl(req, postVerifyDestination(verification.user.role)),
    { status: 303 },
  );
}
