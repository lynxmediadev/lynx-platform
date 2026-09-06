import { findValidPasswordResetToken } from "@/lib/account-auth/reset";
import { AuthTurnstileField } from "@/components/auth/AuthTurnstileField";
import { allowsSupabaseAuth } from "@/lib/account-auth/mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ResetPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = (await searchParams) ?? {};
  const token = firstValue(params.token).trim();
  const err = firstValue(params.err);
  const validToken = token ? await findValidPasswordResetToken(token) : null;
  const supabaseClient = allowsSupabaseAuth()
    ? await createSupabaseServerClient()
    : null;
  const { data: supabaseData } = supabaseClient
    ? await supabaseClient.auth.getUser()
    : { data: { user: null } };
  const canReset = Boolean(validToken || supabaseData.user);

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Nueva password</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Define una nueva password para tu cuenta.
      </p>

      <form
        method="POST"
        action="/auth/reset-password/submit"
        className="border-border bg-card space-y-4 rounded-2xl border p-6"
      >
        <input type="hidden" name="token" value={token} />

        {supabaseData.user ? (
          <p className="text-muted-foreground text-xs">
            Cuenta: {supabaseData.user.email}
          </p>
        ) : canReset ? (
          <p className="text-muted-foreground text-xs">
            Cuenta: {validToken?.user.email}
          </p>
        ) : (
          <p className="text-destructive text-xs">
            El enlace de recuperación es inválido, usado o expiró.
          </p>
        )}

        <div>
          <label className="text-muted-foreground mb-1 block text-xs uppercase">
            Password nueva
          </label>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="border-border bg-muted focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 outline-none focus-visible:ring-2"
          />
        </div>
        <div>
          <label className="text-muted-foreground mb-1 block text-xs uppercase">
            Repetir password
          </label>
          <input
            type="password"
            name="passwordConfirm"
            required
            minLength={8}
            autoComplete="new-password"
            className="border-border bg-muted focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 outline-none focus-visible:ring-2"
          />
        </div>

        {err === "mismatch" ? (
          <p className="text-destructive text-xs">
            Las passwords no coinciden.
          </p>
        ) : null}
        {err === "password" ? (
          <p className="text-destructive text-xs">
            La password debe tener al menos 8 caracteres.
          </p>
        ) : null}
        {err === "invalid" ? (
          <p className="text-destructive text-xs">
            El token no es válido o ya expiró.
          </p>
        ) : null}
        {err === "rate_limited" ? (
          <p className="text-destructive text-xs">
            Demasiados intentos. Espera unos minutos antes de volver a intentar.
          </p>
        ) : null}
        {err === "captcha" ? (
          <p className="text-destructive text-xs">
            Valida el captcha para continuar.
          </p>
        ) : null}

        <AuthTurnstileField />
        <button
          disabled={!canReset}
          className="border-border bg-muted hover:bg-accent focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 text-sm focus-visible:ring-2 disabled:opacity-50"
        >
          Guardar password
        </button>
      </form>
    </main>
  );
}
