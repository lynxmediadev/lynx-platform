// ================================================
// File: src/env.js
// Título: Validación de ENV (DB obligatoria, S3 opcional)
// Descripción: Valida DATABASE_URL/NODE_ENV; expone DIRECT_URL (migraciones).
// Qué hace: Evita caídas por ENV inválidos. S3 se valida “justo a tiempo”.
// Peras y manzanas: “Las llaves del auto (DB) siempre; las de la bodega (S3) solo si voy.”
// ================================================

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url().optional(), // para prisma migrate
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // S3 opcional (se valida cuando firmamos)
    S3_ENDPOINT: z.string().url().optional(),
    S3_REGION: z.string().optional(),
    S3_BUCKET: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    S3_PUBLIC_BASE_URL: z.string().url().optional(),
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ENDPOINT: z.string().url().optional(),
    R2_REGION: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_PREVIEWS_BUCKET: z.string().optional(),
    R2_PRIVATE_BUCKET: z.string().optional(),
    R2_PUBLIC_PREVIEW_URL: z.string().url().optional(),
    ASSET_UPLOAD_SIGNING_SECRET: z.string().min(32).optional(),
    CSRF_SECRET: z.string().min(32).optional(),
    APP_BASE_URL: z.string().url().optional(),
    APP_URL: z.string().url().optional(),
    AUTH_MODE: z.enum(["legacy", "hybrid", "supabase"]).default("legacy"),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  },

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    NODE_ENV: process.env.NODE_ENV,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_REGION: process.env.S3_REGION,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    S3_PUBLIC_BASE_URL: process.env.S3_PUBLIC_BASE_URL,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ENDPOINT: process.env.R2_ENDPOINT,
    R2_REGION: process.env.R2_REGION,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_PREVIEWS_BUCKET: process.env.R2_PREVIEWS_BUCKET,
    R2_PRIVATE_BUCKET: process.env.R2_PRIVATE_BUCKET,
    R2_PUBLIC_PREVIEW_URL: process.env.R2_PUBLIC_PREVIEW_URL,
    ASSET_UPLOAD_SIGNING_SECRET: process.env.ASSET_UPLOAD_SIGNING_SECRET,
    CSRF_SECRET: process.env.CSRF_SECRET,
    APP_BASE_URL: process.env.APP_BASE_URL,
    APP_URL: process.env.APP_URL,
    AUTH_MODE: process.env.AUTH_MODE,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});

// Helper: valida S3 solo cuando se usa
export function assertS3Env() {
  const missing = [];
  if (!env.S3_BUCKET) missing.push("S3_BUCKET");
  if (!env.S3_ACCESS_KEY_ID) missing.push("S3_ACCESS_KEY_ID");
  if (!env.S3_SECRET_ACCESS_KEY) missing.push("S3_SECRET_ACCESS_KEY");
  if (!env.S3_PUBLIC_BASE_URL) missing.push("S3_PUBLIC_BASE_URL");
  if (missing.length) {
    throw new Error(`Faltan variables S3: ${missing.join(", ")}.`);
  }
}
