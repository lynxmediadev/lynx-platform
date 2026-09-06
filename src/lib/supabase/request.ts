import { createServerClient } from "@supabase/ssr";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export type SupabaseProxySession = {
  response: NextResponse;
  user: SupabaseUser | null;
};

export async function refreshSupabaseProxySession(
  request: NextRequest,
): Promise<SupabaseProxySession> {
  const config = getSupabasePublicConfig();
  let response = NextResponse.next({ request });
  if (!config) return { response, user: null };

  const client = createServerClient(config.url, config.publishableKey, {
    auth: { flowType: "pkce" },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet)
          request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data, error } = await client.auth.getUser();
  return { response, user: error ? null : data.user };
}

export async function getSupabaseUserFromRequest(request: NextRequest) {
  const config = getSupabasePublicConfig();
  if (!config) return null;
  const client = createServerClient(config.url, config.publishableKey, {
    auth: { flowType: "pkce" },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll() {
        // El proxy es responsable de persistir cualquier cookie renovada.
      },
    },
  });
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user;
}

export function copySupabaseResponseCookies(
  source: NextResponse,
  target: NextResponse,
) {
  for (const cookie of source.cookies.getAll()) target.cookies.set(cookie);
  return target;
}
