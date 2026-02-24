import { formatExpiry, shellTemplate } from "@/lib/account-auth/email/templates/shared";

type BuildVerifyEmailInput = {
  verifyUrl: string;
  expiresAt: Date;
};

export function buildVerifyEmail(input: BuildVerifyEmailInput) {
  const expires = formatExpiry(input.expiresAt);
  const subject = "Verifica tu email · ODR Records";
  const intro = "Confirma tu email para completar la seguridad de tu cuenta.";

  const html = shellTemplate({
    title: "Verificar email",
    intro,
    ctaLabel: "Verificar email",
    ctaUrl: input.verifyUrl,
    footerLines: [
      `Este enlace expira: ${expires}`,
      "Si no solicitaste esta acción, ignora este correo.",
    ],
  });

  const text = [
    "Verifica tu email · ODR Records",
    "",
    intro,
    `Este enlace expira: ${expires}`,
    "",
    `Verificar email: ${input.verifyUrl}`,
    "",
    "Si no solicitaste esta acción, ignora este correo.",
  ].join("\n");

  return { subject, html, text };
}

