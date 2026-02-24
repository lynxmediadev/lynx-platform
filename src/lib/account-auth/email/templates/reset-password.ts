import { formatExpiry, shellTemplate } from "@/lib/account-auth/email/templates/shared";

type BuildResetEmailInput = {
  resetUrl: string;
  expiresAt: Date;
};

export function buildResetPasswordEmail(input: BuildResetEmailInput) {
  const expires = formatExpiry(input.expiresAt);
  const subject = "Restablecer password · ODR Records";
  const intro = "Recibimos una solicitud para restablecer tu password.";

  const html = shellTemplate({
    title: "Restablecer password",
    intro,
    ctaLabel: "Cambiar password",
    ctaUrl: input.resetUrl,
    footerLines: [
      `Este enlace expira: ${expires}`,
      "Si no solicitaste este cambio, ignora este correo.",
    ],
  });

  const text = [
    "Restablecer password · ODR Records",
    "",
    intro,
    `Este enlace expira: ${expires}`,
    "",
    `Cambiar password: ${input.resetUrl}`,
    "",
    "Si no solicitaste este cambio, ignora este correo.",
  ].join("\n");

  return { subject, html, text };
}

