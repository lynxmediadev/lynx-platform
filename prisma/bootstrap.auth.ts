import { config as loadEnv } from "dotenv";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const db = new PrismaClient();

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

function scrypt(password: string, salt: Buffer, keylen: number) {
  return new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      keylen,
      { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: 128 * 1024 * 1024 },
      (err, key) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(key as Buffer);
      },
    );
  });
}

async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const derived = await scrypt(password.trim(), salt, 64);
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${toBase64Url(salt)}$${toBase64Url(derived)}`;
}

async function main() {
  const email = (
    process.env.AUTH_BOOTSTRAP_ADMIN_EMAIL ??
    process.env.ADMIN_BOOTSTRAP_EMAIL ??
    "admin@lynx.local"
  )
    .trim()
    .toLowerCase();
  const password = (
    process.env.AUTH_BOOTSTRAP_ADMIN_PASSWORD ??
    process.env.ADMIN_PASS ??
    process.env.ADMIN_ACCESS_KEY ??
    ""
  ).trim();

  if (!password) {
    console.log("Skip bootstrap auth: set AUTH_BOOTSTRAP_ADMIN_PASSWORD (or ADMIN_PASS fallback).");
    return;
  }

  const passwordHash = await hashPassword(password);
  const admin = await db.user.upsert({
    where: { email },
    update: {
      role: "ADMIN",
      status: "ACTIVE",
      passwordHash,
      emailVerifiedAt: new Date(),
    },
    create: {
      email,
      name: "Admin",
      role: "ADMIN",
      status: "ACTIVE",
      passwordHash,
      emailVerifiedAt: new Date(),
    },
    select: { id: true, email: true },
  });

  const updatedTracks = await db.track.updateMany({
    where: { ownerUserId: null },
    data: { ownerUserId: admin.id },
  });

  const updatedLicensing = await db.licensingRequest.updateMany({
    where: { ownerUserId: null },
    data: { ownerUserId: admin.id },
  });

  console.log("Auth bootstrap complete", {
    adminEmail: admin.email,
    backfilledTracks: updatedTracks.count,
    backfilledLicensingRequests: updatedLicensing.count,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
