// src/lib/auth.ts
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ auth.ts — Emisión/verificación (Node) de token de sesión admin HMAC (v1)    │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - El token es: "v1.<payloadB64url>.<sigB64url>"                             │
 * │ - payload: { sub:"admin", iat, exp, jti, ua? }                              │
 * │ - Se firma con ADMIN_SESSION_SECRET (HMAC SHA-256).                         │
 * │ - Este helper (Node crypto) se usa en Route Handlers (login/logout).        │
 * │ - En el middleware (Edge) usamos Web Crypto para validar (ver middleware).  │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import crypto from "node:crypto";

export type AdminSessionPayloadV1 = {
  sub: "admin";
  iat: number; // issued at (ms)
  exp: number; // expires at (ms)
  jti: string; // token id (random)
  ua?: string; // hash sha256 del user-agent (opcional)
};

function b64url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
export function sha256Hex(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export function signAdminTokenV1(
  payload: AdminSessionPayloadV1,
  secret: string,
) {
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = crypto.createHmac("sha256", secret).update(payloadB64).digest();
  const sigB64 = b64url(sig);
  return `v1.${payloadB64}.${sigB64}`;
}

export function verifyAdminTokenV1(
  token: string,
  secret: string,
): AdminSessionPayloadV1 | null {
  try {
    const [v, payloadB64, sigB64] = token.split(".");
    if (v !== "v1" || !payloadB64 || !sigB64) return null;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(payloadB64)
      .digest();
    const expectedB64 = b64url(expected);
    if (expectedB64.length !== sigB64.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(expectedB64), Buffer.from(sigB64)))
      return null;
    const json = Buffer.from(
      payloadB64.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8");
    const p = JSON.parse(json) as AdminSessionPayloadV1;
    if (p.sub !== "admin" || typeof p.exp !== "number" || Date.now() >= p.exp)
      return null;
    return p;
  } catch {
    return null;
  }
}
