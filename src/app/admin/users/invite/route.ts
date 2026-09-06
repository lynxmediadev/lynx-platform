import { NextRequest, NextResponse } from "next/server";
import { createInvite, normalizeBaseUrl } from "@/lib/account-auth/invite";
import {
  getAuthEmailProviderName,
  shouldExposeEmailDebugLinks,
} from "@/lib/account-auth/email";
import { sendInviteEmail } from "@/lib/account-auth/email/service";
import {
  requireRouteAdmin,
  safeRouteRedirect,
} from "@/lib/account-auth/route-guards";
import { allowsSupabaseAuth } from "@/lib/account-auth/mode";
import { inviteWithSupabase } from "@/lib/account-auth/supabase-invite";

function parseRole(value: string) {
  const normalized = value.trim().toUpperCase();
  if (
    normalized === "ADMIN" ||
    normalized === "STAFF" ||
    normalized === "CREATOR" ||
    normalized === "CLIENT"
  ) {
    return normalized;
  }
  return "CREATOR";
}

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/admin/users")) return "/admin/users";
  return value;
}

export async function POST(req: NextRequest) {
  const admin = await requireRouteAdmin();
  if (!admin) {
    return NextResponse.redirect(safeRouteRedirect(req, "/admin/login?err=1"), {
      status: 303,
    });
  }

  const formData = await req.formData();
  const returnTo = safeReturnTo(
    (formData.get("returnTo")?.toString() ?? "").trim(),
  );
  const email = (formData.get("email")?.toString() ?? "").trim();
  const role = parseRole((formData.get("role")?.toString() ?? "").trim());
  const expiresDays = Number(formData.get("expiresDays")?.toString() ?? "7");

  try {
    if (allowsSupabaseAuth()) {
      const baseUrl = normalizeBaseUrl(
        process.env.APP_BASE_URL || req.nextUrl.origin,
      );
      const callback = new URL("/auth/callback", baseUrl);
      callback.searchParams.set("next", "/auth/register?supabase=1");
      const invite = await inviteWithSupabase({
        email,
        role,
        redirectTo: callback.toString(),
      });
      const separator = returnTo.includes("?") ? "&" : "?";
      return NextResponse.redirect(
        safeRouteRedirect(
          req,
          `${returnTo}${separator}ok=invite_created&email=${encodeURIComponent(invite.email)}`,
        ),
        { status: 303 },
      );
    }

    const invite = await createInvite({ email, role, expiresDays });
    const baseUrl = normalizeBaseUrl(
      process.env.APP_BASE_URL || req.nextUrl.origin,
    );
    const link = `${baseUrl}/auth/register?token=${invite.token}`;
    await sendInviteEmail({
      to: invite.email,
      registerUrl: link,
      role: invite.role,
      expiresAt: invite.expiresAt,
    });
    const separator = returnTo.includes("?") ? "&" : "?";
    const debugLink =
      shouldExposeEmailDebugLinks() && getAuthEmailProviderName() === "console"
        ? link
        : "";
    const to = safeRouteRedirect(
      req,
      `${returnTo}${separator}ok=invite_created&email=${encodeURIComponent(invite.email)}${
        debugLink ? `&link=${encodeURIComponent(debugLink)}` : ""
      }`,
    );
    return NextResponse.redirect(to, { status: 303 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invite_failed";
    const separator = returnTo.includes("?") ? "&" : "?";
    return NextResponse.redirect(
      safeRouteRedirect(
        req,
        `${returnTo}${separator}err=${encodeURIComponent(message)}`,
      ),
      { status: 303 },
    );
  }
}
