// src/lib/csrf.ts
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ csrf.ts — Token CSRF "self-contained" (HMAC)                                │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - issueCsrfToken(): crea token firmado (base64url) con iat + random.        │
 * │ - verifyCsrfToken(token): valida firma y expira tras `maxAgeMs`.            │
 * │ - NO usa cookie: basta incluir el token en un <input type="hidden">.        │
 * │   (Para formularios públicos sin sesión es suficiente y simple).           │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import crypto from "node:crypto";

const DEFAULT_TTL_MS = 2 * 60 * 60 * 1000; // 2h

function getSecret() {
  const s = process.env.CSRF_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[csrf] CSRF_SECRET must contain at least 32 characters in production");
    }
    console.warn("[csrf] CSRF_SECRET no definido o muy corto. Usa `openssl rand -base64 32`.");
    return "dev-insecure-secret-change-me";
  }
  return s;
}

export function issueCsrfToken(): string {
  const secret = getSecret();
  const iat = Date.now();
  const rand = crypto.randomBytes(16).toString("hex");
  const payload = `${iat}.${rand}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const full = `${payload}.${sig}`;
  return Buffer.from(full, "utf8").toString("base64url");
}

export function verifyCsrfToken(token: string, maxAgeMs = DEFAULT_TTL_MS): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [iatStr, rand, sig] = decoded.split(".");
    const iat = Number(iatStr);
    if (!Number.isFinite(iat) || !rand || !sig) return false;
    if (Date.now() - iat > maxAgeMs) return false;

    const secret = getSecret();
    const expected = crypto.createHmac("sha256", secret).update(`${iat}.${rand}`).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}
