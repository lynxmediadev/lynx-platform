import crypto from "node:crypto";
import prisma from "@/lib/prisma";
import { AuthTurnstileField } from "@/components/auth/AuthTurnstileField";
import { allowsSupabaseAuth, allowsLegacyAuth } from "@/lib/account-auth/mode";
import { resolveSupabaseAppUser } from "@/lib/account-auth/supabase-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RegisterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function getErrorMessage(err: string) {
  if (err === "missing") return "Completa todos los campos.";
  if (err === "password")
    return "La password debe tener al menos 8 caracteres.";
  if (err === "invite") return "El token de invitación no es válido o expiró.";
  if (err === "exists") return "Ya existe una cuenta con ese email.";
  if (err === "email") return "El email no coincide con la invitación.";
  if (err === "rate_limited")
    return "Demasiados intentos. Espera unos minutos.";
  if (err === "captcha") return "Valida el captcha para continuar.";
  return "";
}

function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export default async function AuthRegisterPage({
  searchParams,
}: RegisterPageProps) {
  const params = (await searchParams) ?? {};
  const err = firstValue(params.err);
  const token = firstValue(params.token);
  const wantsSupabase =
    firstValue(params.supabase) === "1" && allowsSupabaseAuth();
  const supabaseClient = wantsSupabase
    ? await createSupabaseServerClient()
    : null;
  const { data: supabaseData } = supabaseClient
    ? await supabaseClient.auth.getUser()
    : { data: { user: null } };
  const supabaseProfile = supabaseData.user
    ? await resolveSupabaseAppUser(supabaseData.user)
    : null;
  const hasSupabaseInvite = supabaseProfile?.status === "INVITED";
  const legacyInviteEmail =
    token && allowsLegacyAuth()
      ? ((
          await prisma.inviteToken.findFirst({
            where: {
              tokenHash: hashToken(token),
              usedAt: null,
              expiresAt: { gt: new Date() },
            },
            select: { email: true },
          })
        )?.email ?? "")
      : "";
  const inviteEmail = hasSupabaseInvite
    ? supabaseProfile.email
    : legacyInviteEmail;
  const hasValidInvite = Boolean(hasSupabaseInvite || legacyInviteEmail);

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Crear cuenta</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Registro habilitado por invitación para mantener control de accesos.
      </p>

      <form
        method="POST"
        action="/auth/register/submit"
        className="border-border bg-card space-y-4 rounded-2xl border p-6"
      >
        {hasSupabaseInvite ? (
          <input type="hidden" name="supabase" value="1" />
        ) : (
          <div>
            <label className="text-muted-foreground mb-1 block text-xs uppercase">
              Token invitación
            </label>
            <input
              type="text"
              name="token"
              required
              defaultValue={token}
              className="border-border bg-muted focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 outline-none focus-visible:ring-2"
            />
          </div>
        )}
        {(token || wantsSupabase) && !hasValidInvite ? (
          <p className="text-destructive text-xs">
            La invitación no es válida, ya fue utilizada o expiró. Genera una
            nueva.
          </p>
        ) : null}
        <div>
          <label className="text-muted-foreground mb-1 block text-xs uppercase">
            Nombre
          </label>
          <input
            type="text"
            name="name"
            required
            autoComplete="name"
            className="border-border bg-muted focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 outline-none focus-visible:ring-2"
          />
        </div>
        {hasValidInvite ? (
          <div>
            <label className="text-muted-foreground mb-1 block text-xs uppercase">
              Email invitado
            </label>
            <input
              type="email"
              value={inviteEmail}
              readOnly
              className="border-border bg-muted text-muted-foreground w-full rounded-lg border px-3 py-2.5"
            />
            <input type="hidden" name="email" value={inviteEmail} />
          </div>
        ) : (
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
        )}
        <div>
          <label className="text-muted-foreground mb-1 block text-xs uppercase">
            Password
          </label>
          <input
            type="password"
            name="password"
            required
            autoComplete="new-password"
            className="border-border bg-muted focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 outline-none focus-visible:ring-2"
          />
        </div>
        {err ? (
          <p className="text-destructive text-xs">{getErrorMessage(err)}</p>
        ) : null}
        <AuthTurnstileField />
        <button
          disabled={!hasValidInvite}
          className="border-border bg-muted hover:bg-accent focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 text-sm focus-visible:ring-2 disabled:opacity-50"
        >
          Crear cuenta
        </button>
      </form>
    </main>
  );
}
