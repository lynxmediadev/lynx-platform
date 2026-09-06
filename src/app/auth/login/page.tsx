import { AuthTurnstileField } from "@/components/auth/AuthTurnstileField";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function AuthLoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const err = firstValue(params.err);
  const next = firstValue(params.next);

  const message =
    err === "missing"
      ? "Completa email y password."
      : err === "invalid"
        ? "Credenciales inválidas."
        : err === "unverified"
          ? "Debes verificar tu email antes de iniciar sesión."
          : err === "config"
            ? "Supabase Auth aún no está configurado. Usa AUTH_MODE=legacy hasta completar las llaves."
            : err === "callback"
              ? "El enlace de acceso es inválido o expiró. Solicita uno nuevo."
              : err === "unauthorized"
                ? "La cuenta no está habilitada para esta aplicación."
                : err === "rate_limited"
                  ? "Demasiados intentos. Espera un momento e inténtalo nuevamente."
                  : undefined;
  const okMessage = firstValue(params.ok);

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Iniciar sesión</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Accede con tu cuenta para administrar tu catálogo.
      </p>

      <form
        method="POST"
        action="/auth/login/submit"
        className="border-border bg-card space-y-4 rounded-2xl border p-6"
      >
        <input type="hidden" name="next" value={next} />
        <div>
          <label className="text-muted-foreground mb-1 block text-xs uppercase">
            Email
          </label>
          <input
            type="email"
            name="email"
            required
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
            required
            autoComplete="current-password"
            className="border-border bg-muted focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 outline-none focus-visible:ring-2"
          />
        </div>
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
        {okMessage === "password_reset" ? (
          <p className="text-xs text-emerald-600">
            Password actualizada. Ya puedes iniciar sesión.
          </p>
        ) : null}
        <AuthTurnstileField />
        <button className="border-border bg-muted hover:bg-accent focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 text-sm focus-visible:ring-2">
          Entrar
        </button>
      </form>

      <div className="text-muted-foreground mt-4 space-y-1 text-xs">
        <p>
          Registro por invitación: usa el enlace de invitación recibido para
          crear cuenta.
        </p>
        <p>
          ¿Olvidaste tu password?{" "}
          <a href="/auth/forgot-password" className="underline">
            Restablecer password
          </a>
        </p>
      </div>
    </main>
  );
}
