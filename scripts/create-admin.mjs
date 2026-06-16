/**
 * Bootstrap: crea un usuario admin en la BD si no existe.
 * Uso: node scripts/create-admin.mjs
 *
 * Lee EMAIL y PASSWORD desde las variables de entorno
 * AUTH_BOOTSTRAP_ADMIN_EMAIL y AUTH_BOOTSTRAP_ADMIN_PASSWORD (de .env.local),
 * o usa los valores hardcodeados como fallback.
 */
import { createRequire } from "module";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ── Cargar .env.local manualmente ─────────────────────────────────────────────
const envPath = resolve(process.cwd(), ".env.local");
try {
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  console.warn("No se encontró .env.local — usando variables de entorno del shell.");
}

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");

// ── Config ─────────────────────────────────────────────────────────────────────
const EMAIL    = (process.env.AUTH_BOOTSTRAP_ADMIN_EMAIL    ?? "admin@lynx.local").trim().toLowerCase();
const PASSWORD = (process.env.AUTH_BOOTSTRAP_ADMIN_PASSWORD ?? "").trim();
const NAME     = "Admin";
const ROLE     = "ADMIN";

const SCRYPT_N      = 1 << 14; // 16384 — mitad del default del server; sigue siendo fuerte
const SCRYPT_R      = 8;
const SCRYPT_P      = 1;
const SCRYPT_KEYLEN = 64;

function toBase64Url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hashPassword(raw) {
  const pwd = raw.trim();
  if (pwd.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
  const salt = crypto.randomBytes(16);
  const derived = await new Promise((resolve, reject) => {
    crypto.scrypt(pwd, salt, SCRYPT_KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P }, (err, key) => {
      if (err) reject(err); else resolve(key);
    });
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${toBase64Url(salt)}$${toBase64Url(derived)}`;
}

async function main() {
  if (!PASSWORD) {
    console.error("ERROR: Define AUTH_BOOTSTRAP_ADMIN_PASSWORD en .env.local (mínimo 8 caracteres).");
    process.exit(1);
  }

  const db = new PrismaClient();
  try {
    const existing = await db.user.findUnique({ where: { email: EMAIL } });
    if (existing) {
      console.log(`✓ El usuario ${EMAIL} ya existe (rol: ${existing.role}).`);
      return;
    }

    const passwordHash = await hashPassword(PASSWORD);
    const user = await db.user.create({
      data: {
        email: EMAIL,
        name: NAME,
        role: ROLE,
        status: "ACTIVE",
        passwordHash,
        emailVerifiedAt: new Date(),
      },
      select: { id: true, email: true, role: true },
    });

    console.log(`✓ Usuario admin creado:`);
    console.log(`  ID:    ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Rol:   ${user.role}`);
    console.log(`\nIngresa en /admin/login con ese email y la contraseña definida en AUTH_BOOTSTRAP_ADMIN_PASSWORD.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
