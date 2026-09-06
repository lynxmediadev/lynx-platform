import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export async function createSupabaseServerClient() {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  const cookieStore = await cookies();
  return createServerClient(config.url, config.publishableKey, {
    auth: { flowType: "pkce" },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components no pueden escribir cookies. El proxy refresca la sesión.
        }
      },
    },
  });
}

export async function requireSupabaseServerClient() {
  const client = await createSupabaseServerClient();
  if (!client) {
    throw new Error(
      "Supabase Auth is enabled but NEXT_PUBLIC_SUPABASE_URL or publishable key is missing",
    );
  }
  return client;
}
