// src/lib/env.ts
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ env.ts — Capa única para leer/validar variables de entorno                  │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Aplica trim() a todas las variables.                                      │
 * │ - Valida requeridos y entrega mensajes claros en dev/CI.                    │
 * │ - Exporta getters tipados para evitar repetir lógica en cada archivo.       │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
function must(name: string, val?: string) {
  const v = (val ?? "").trim();
  if (!v) throw new Error(`[env] Missing required env: ${name}`);
  return v;
}
function opt(_name: string, val?: string) {
  return (val ?? "").trim() || undefined;
}

export const ENV = {
  // Base de datos (Prisma)
  DATABASE_URL: () => must("DATABASE_URL", process.env.DATABASE_URL),

  // Admin auth (KEY tiene prioridad; PASS fallback)
  ADMIN_ACCESS_KEY: () => opt("ADMIN_ACCESS_KEY", process.env.ADMIN_ACCESS_KEY),
  ADMIN_PASS: () => opt("ADMIN_PASS", process.env.ADMIN_PASS),
  ADMIN_EXPECTED: () => {
    const key = ENV.ADMIN_ACCESS_KEY();
    const pass = ENV.ADMIN_PASS();
    const expected = key || pass;
    if (!expected)
      throw new Error("[env] Configure ADMIN_ACCESS_KEY or ADMIN_PASS");
    return expected;
  },

  // Nueva auth por cuentas
  AUTH_SESSION_SECRET: () =>
    opt("AUTH_SESSION_SECRET", process.env.AUTH_SESSION_SECRET) ||
    opt("ADMIN_SESSION_SECRET", process.env.ADMIN_SESSION_SECRET),
  AUTH_MODE: () => {
    const value = (
      opt("AUTH_MODE", process.env.AUTH_MODE) ?? "legacy"
    ).toLowerCase();
    if (value === "legacy" || value === "hybrid" || value === "supabase")
      return value;
    throw new Error("[env] AUTH_MODE must be legacy, hybrid or supabase");
  },
  SUPABASE_URL: () =>
    opt("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  SUPABASE_PUBLISHABLE_KEY: () =>
    opt(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
  SUPABASE_SERVICE_ROLE_KEY: () =>
    opt("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
  AUTH_BOOTSTRAP_ADMIN_EMAIL: () =>
    opt("AUTH_BOOTSTRAP_ADMIN_EMAIL", process.env.AUTH_BOOTSTRAP_ADMIN_EMAIL),
  AUTH_BOOTSTRAP_ADMIN_PASSWORD: () =>
    opt(
      "AUTH_BOOTSTRAP_ADMIN_PASSWORD",
      process.env.AUTH_BOOTSTRAP_ADMIN_PASSWORD,
    ),
  AUTH_EMAIL_PROVIDER: () =>
    (
      opt("AUTH_EMAIL_PROVIDER", process.env.AUTH_EMAIL_PROVIDER) ?? "console"
    ).toLowerCase(),
  AUTH_EMAIL_FROM: () => opt("AUTH_EMAIL_FROM", process.env.AUTH_EMAIL_FROM),
  AUTH_EMAIL_DEBUG_LINKS: () =>
    opt("AUTH_EMAIL_DEBUG_LINKS", process.env.AUTH_EMAIL_DEBUG_LINKS) === "1",
  AUTH_ENFORCE_VERIFIED_EMAIL: () =>
    opt(
      "AUTH_ENFORCE_VERIFIED_EMAIL",
      process.env.AUTH_ENFORCE_VERIFIED_EMAIL,
    ) === "1",
  BREVO_API_KEY: () => opt("BREVO_API_KEY", process.env.BREVO_API_KEY),
  TURNSTILE_ENABLED: () =>
    opt("TURNSTILE_ENABLED", process.env.TURNSTILE_ENABLED) === "1",
  TURNSTILE_SECRET_KEY: () =>
    opt("TURNSTILE_SECRET_KEY", process.env.TURNSTILE_SECRET_KEY),
  TURNSTILE_SITE_KEY: () =>
    opt(
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    ),

  // Integración Google Apps Script/Sheets (si la estás usando)
  GOOGLE_SCRIPT_URL: () =>
    opt("GOOGLE_SCRIPT_URL", process.env.GOOGLE_SCRIPT_URL),
  GOOGLE_SCRIPT_TOKEN: () =>
    opt("GOOGLE_SCRIPT_TOKEN", process.env.GOOGLE_SCRIPT_TOKEN),

  // Debug
  DEBUG_ADMIN_MW: () =>
    opt("DEBUG_ADMIN_MW", process.env.DEBUG_ADMIN_MW) === "1",
};
