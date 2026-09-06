import crypto from "node:crypto";

const SCRYPT_KEYLEN = 64;
const SCRYPT_N = 1 << 15;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

function toBase64Url(input: Buffer) {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input: string) {
  const pad = "=".repeat((4 - (input.length % 4)) % 4);
  const base64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64");
}

function scrypt(password: string, salt: Buffer, keylen: number) {
  return new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      keylen,
      {
        N: SCRYPT_N,
        r: SCRYPT_R,
        p: SCRYPT_P,
        maxmem: 128 * 1024 * 1024,
      },
      (err, derivedKey) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(derivedKey as Buffer);
      },
    );
  });
}

export async function hashPassword(rawPassword: string) {
  const password = rawPassword.trim();
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  const salt = crypto.randomBytes(16);
  const derived = await scrypt(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${toBase64Url(salt)}$${toBase64Url(derived)}`;
}

export async function verifyPassword(
  rawPassword: string,
  encodedHash: string | null | undefined,
) {
  if (!encodedHash) return false;
  if (!encodedHash.startsWith("scrypt$")) return false;

  const parts = encodedHash.split("$");
  if (parts.length !== 6) return false;

  const [algo, nRaw, rRaw, pRaw, saltB64, hashB64] = parts;
  if (algo !== "scrypt") return false;

  const n = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p))
    return false;

  const salt = fromBase64Url(saltB64 ?? "");
  const expected = fromBase64Url(hashB64 ?? "");
  if (!salt.length || !expected.length) return false;

  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(
      rawPassword.trim(),
      salt,
      expected.length,
      { N: n, r, p, maxmem: 128 * 1024 * 1024 },
      (err, key) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(key as Buffer);
      },
    );
  });

  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}
