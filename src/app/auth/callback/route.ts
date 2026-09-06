import { NextRequest, NextResponse } from "next/server";
import { resolveSupabaseAppUser } from "@/lib/account-auth/supabase-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function safeNext(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//"))
    return "/auth/panel";
  return raw;
}

function redirectUrl(req: NextRequest, path: string) {
  const url = new URL(path, req.url);
  if (url.hostname === "0.0.0.0") url.hostname = "localhost";
  return url;
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim();
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  const client = await createSupabaseServerClient();
  if (!client || !code) {
    return NextResponse.redirect(redirectUrl(req, "/auth/login?err=callback"), {
      status: 303,
    });
  }

  const { data, error } = await client.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(redirectUrl(req, "/auth/login?err=callback"), {
      status: 303,
    });
  }

  const appUser = await resolveSupabaseAppUser(data.user);
  if (!appUser || appUser.status === "SUSPENDED") {
    await client.auth.signOut();
    return NextResponse.redirect(
      redirectUrl(req, "/auth/login?err=unauthorized"),
      {
        status: 303,
      },
    );
  }

  const destination =
    appUser.status === "INVITED" ? "/auth/register?supabase=1" : next;
  return NextResponse.redirect(redirectUrl(req, destination), { status: 303 });
}
