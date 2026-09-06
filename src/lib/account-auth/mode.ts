export type AuthMode = "legacy" | "hybrid" | "supabase";

export function parseAuthMode(raw: string | undefined): AuthMode {
  const value = (raw ?? "legacy").trim().toLowerCase();
  if (value === "legacy" || value === "hybrid" || value === "supabase") {
    return value;
  }
  throw new Error("AUTH_MODE must be legacy, hybrid or supabase");
}

export function getAuthMode() {
  return parseAuthMode(process.env.AUTH_MODE);
}

export function allowsSupabaseAuth(mode = getAuthMode()) {
  return mode === "hybrid" || mode === "supabase";
}

export function allowsLegacyAuth(mode = getAuthMode()) {
  return mode === "legacy" || mode === "hybrid";
}
