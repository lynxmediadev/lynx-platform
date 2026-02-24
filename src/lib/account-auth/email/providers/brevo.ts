import "server-only";
import { ENV } from "@/lib/env";
import type { AuthEmailPayload, EmailProvider, EmailSendResult } from "@/lib/account-auth/email/types";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

type BrevoSuccessResponse = {
  messageId?: string;
  messageIds?: string[];
};

export class BrevoEmailProvider implements EmailProvider {
  readonly id = "brevo";

  constructor(
    private readonly apiKey: string,
    private readonly fromEmail: string,
  ) {}

  static fromEnv() {
    const apiKey = (ENV.BREVO_API_KEY() ?? "").trim();
    const fromEmail = (ENV.AUTH_EMAIL_FROM() ?? "").trim();
    if (!apiKey || !fromEmail) return null;
    return new BrevoEmailProvider(apiKey, fromEmail);
  }

  async send(payload: AuthEmailPayload): Promise<EmailSendResult> {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      try {
        const response = await fetch(BREVO_API_URL, {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            "api-key": this.apiKey,
          },
          body: JSON.stringify({
            sender: {
              email: this.fromEmail,
              name: "ODR Records",
            },
            to: [{ email: payload.to }],
            subject: payload.subject,
            htmlContent: payload.html,
            textContent: payload.text,
            tags: [`auth_${payload.kind}`],
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = await response.text();
          if (attempt < 2 && RETRYABLE_STATUS.has(response.status)) {
            await new Promise((resolve) => setTimeout(resolve, 250));
            continue;
          }
          throw new Error(`brevo_http_${response.status}:${body.slice(0, 400)}`);
        }

        const json = (await response.json().catch(() => ({}))) as BrevoSuccessResponse;
        const messageId = json.messageId ?? json.messageIds?.[0];
        return { provider: this.id, messageId };
      } catch (error) {
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 250));
          continue;
        }
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new Error("brevo_unknown_failure");
  }
}
