// src/app/admin/login/page.tsx
/**
 * /admin/login — GET: login principal por cuenta (email/password),
 * con fallback legacy por clave admin mientras dura la migración.
 */
import { AuthTurnstileField } from "@/components/auth/AuthTurnstileField";
import { allowsLegacyAuth } from "@/lib/account-auth/mode";
export const dynamic = "force-dynamic";

type AdminLoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function Page({ searchParams }: AdminLoginPageProps) {
  const params = (await searchParams) ?? {};
  const err = firstValue(params.err);
  const message =
    err === "1"
      ? "Credenciales inválidas."
      : err === "missing"
        ? "Completa email y password."
        : err === "unverified"
          ? "Debes verificar tu email antes de ingresar al panel."
          : err === "config"
            ? "Supabase Auth aún no está configurado. Usa AUTH_MODE=legacy hasta completar las llaves."
            : err === "rate_limited"
              ? "Demasiados intentos. Espera un momento e inténtalo nuevamente."
              : undefined;
  const showLegacy = allowsLegacyAuth();

  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Ingreso al panel</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Accede con tu cuenta ADMIN/STAFF.
      </p>
      <form
        method="POST"
        action="/admin/login/submit"
        className="border-border bg-card space-y-4 rounded-2xl border p-6"
      >
        <div>
          <label className="text-muted-foreground mb-1 block text-xs uppercase">
            Email
          </label>
          <input
            type="email"
            name="email"
            autoComplete="email"
            className="border-border bg-muted focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 outline-none focus-visible:ring-2"
          />
        </div>
        <div>
          <label className="text-muted-foreground mb-1 block text-xs uppercase">
            Password
          </label>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            className="border-border bg-muted focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 outline-none focus-visible:ring-2"
          />
        </div>
        {showLegacy ? (
          <div>
            <label className="text-muted-foreground mb-1 block text-xs uppercase">
              Clave legacy (temporal)
            </label>
            <input
              type="password"
              name="legacy_key"
              autoComplete="off"
              className="border-border bg-muted focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 outline-none focus-visible:ring-2"
            />
          </div>
        ) : null}
        {message ? <p className="text-destructive text-xs">{message}</p> : null}
        {err === "unverified" ? (
          <a href="/auth/verify-email" className="text-xs underline">
            Reenviar verificación
          </a>
        ) : null}
        {err === "captcha" ? (
          <p className="text-destructive text-xs">
            Valida el captcha para continuar.
          </p>
        ) : null}
        <AuthTurnstileField />
        <button className="border-border bg-muted hover:bg-accent focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 text-sm focus-visible:ring-2">
          Entrar
        </button>
      </form>
    </main>
  );
}
