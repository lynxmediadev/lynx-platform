import "server-only";

import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import {
  allowsLegacyAuth,
  allowsSupabaseAuth,
  getAuthMode,
} from "@/lib/account-auth/mode";
import {
  APP_SESSION_COOKIE,
  getSessionUserFromCookie,
} from "@/lib/account-auth/session";
import { getActiveSupabaseAppUser } from "@/lib/account-auth/supabase-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseUserFromRequest } from "@/lib/supabase/request";

export async function getAuthenticatedAppUser() {
  const mode = getAuthMode();
  if (allowsSupabaseAuth(mode)) {
    const client = await createSupabaseServerClient();
    if (client) {
      const { data, error } = await client.auth.getUser();
      if (!error && data.user) {
        const user = await getActiveSupabaseAppUser(data.user);
        if (user) return user;
      }
    }
    if (!allowsLegacyAuth(mode)) return null;
  }

  const cookieStore = await cookies();
  return getSessionUserFromCookie(cookieStore.get(APP_SESSION_COOKIE)?.value);
}

export async function getAuthenticatedRequestUser(request: NextRequest) {
  const mode = getAuthMode();
  if (allowsSupabaseAuth(mode)) {
    const supabaseUser = await getSupabaseUserFromRequest(request);
    if (supabaseUser) {
      const user = await getActiveSupabaseAppUser(supabaseUser);
      if (user) return user;
    }
    if (!allowsLegacyAuth(mode)) return null;
  }

  return getSessionUserFromCookie(
    request.cookies.get(APP_SESSION_COOKIE)?.value,
  );
}
