#!/usr/bin/env node

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", quiet: true });

const provider = (process.env.AUTH_EMAIL_PROVIDER || "console").trim().toLowerCase();
const from = (process.env.AUTH_EMAIL_FROM || "").trim();
const brevoApiKey = (process.env.BREVO_API_KEY || "").trim();
const appBaseUrl = (process.env.APP_BASE_URL || "").trim();
const turnstileEnabled = (process.env.TURNSTILE_ENABLED || "").trim() === "1";
const turnstileSecret = (process.env.TURNSTILE_SECRET_KEY || "").trim();
const turnstileSite = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "").trim();
const enforceVerifiedEmail = (process.env.AUTH_ENFORCE_VERIFIED_EMAIL || "").trim() === "1";

const errors = [];
const warnings = [];

if (!["console", "brevo"].includes(provider)) {
  errors.push(`AUTH_EMAIL_PROVIDER inválido: "${provider}". Usa "console" o "brevo".`);
}

if (provider === "brevo") {
  if (!brevoApiKey) errors.push("Falta BREVO_API_KEY con AUTH_EMAIL_PROVIDER=brevo.");
  if (!from) errors.push("Falta AUTH_EMAIL_FROM con AUTH_EMAIL_PROVIDER=brevo.");
}

if (!from) {
  warnings.push("AUTH_EMAIL_FROM está vacío. En modo console funciona, pero debes definirlo para provider real.");
}

if (!appBaseUrl) {
  warnings.push("APP_BASE_URL no está definido. Se usará el origin de la request.");
}

if (appBaseUrl && !/^https?:\/\//.test(appBaseUrl)) {
  errors.push("APP_BASE_URL debe incluir protocolo (http:// o https://).");
}

if (turnstileEnabled) {
  if (!turnstileSecret) errors.push("TURNSTILE_ENABLED=1 pero falta TURNSTILE_SECRET_KEY.");
  if (!turnstileSite) errors.push("TURNSTILE_ENABLED=1 pero falta NEXT_PUBLIC_TURNSTILE_SITE_KEY.");
}

if (enforceVerifiedEmail && provider === "console") {
  warnings.push(
    "AUTH_ENFORCE_VERIFIED_EMAIL=1 con provider console: válido para dev, pero no recomendado para prod.",
  );
}

console.log("Auth preflight");
console.log(`- AUTH_EMAIL_PROVIDER=${provider}`);
console.log(`- TURNSTILE_ENABLED=${turnstileEnabled ? "1" : "0"}`);
console.log(`- AUTH_ENFORCE_VERIFIED_EMAIL=${enforceVerifiedEmail ? "1" : "0"}`);

if (warnings.length) {
  console.log("\nWarnings:");
  for (const warning of warnings) console.log(`- ${warning}`);
}

if (errors.length) {
  console.error("\nErrors:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("\nOK: configuración mínima válida.");
