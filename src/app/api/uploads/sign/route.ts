/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: API firma de subida (R2 · Presigned PUT)                            │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Descripción                                                                 │
 * │ Genera una URL firmada (método PUT) para subir directo a R2 desde el       │
 * │ navegador, sin pasar por el servidor.                                       │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Valida { fileName, mime, size, dir } con Zod                              │
 * │ - Construye un key estable (fecha/uuid/slug + extensión correcta)           │
 * │ - Firma un PUT con getSignedUrl (Content-Type forzado)                      │
 * │ - Devuelve { url, method: 'PUT', headers: {'Content-Type': mime},           │
 * │             publicUrl, assetKey, expiresIn }                                │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ 1) Cliente pide /api/uploads/sign                                           │
 * │ 2) Hace fetch( url, { method:'PUT', headers:{'Content-Type':mime}, body })  │
 * │ 3) Si 200/201/204 → usar publicUrl en el track                              │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getS3, getS3PublicUrl, getUploadConfig } from "@/lib/storage/s3";
import { getRequestAuthUser } from "@/lib/account-auth/request-auth";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { extension as extFromMime } from "mime-types";

export const dynamic = "force-dynamic";

const payloadSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  mime: z.string().min(3),
  size: z.number().int().positive(),
  dir: z
    .enum(["audio", "previews", "versions", "stems"])
    .optional()
    .default("audio"),
});

function slugifyBase(name: string) {
  return name
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Forzamos .mp3 si viene audio/mpeg (evita .mpga)
function ensureExt(mime: string, fileName: string) {
  const overrides: Record<string, string> = { "audio/mpeg": "mp3" };
  const byMime = overrides[mime] ?? (extFromMime(mime) || "");
  if (byMime) return `.${byMime}`;
  const m = fileName.match(/\.([a-z0-9]+)$/i);
  return m && m[1] ? `.${m[1].toLowerCase()}` : "";
}

export async function POST(req: NextRequest) {
  const user = await getRequestAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN" && user.role !== "STAFF") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cfg = getUploadConfig();
  if (!cfg.ok) {
    return NextResponse.json(
      { error: "Uploads no configurado", missing: cfg.missing },
      { status: 501 },
    );
  }

  try {
    const body = await req.json();
    const { fileName, mime, size, dir } = payloadSchema.parse(body);

    if (!cfg.allowedMimes.includes(mime)) {
      return NextResponse.json(
        { error: "MIME no permitido", allowed: cfg.allowedMimes },
        { status: 400 },
      );
    }
    if (size > cfg.maxBytes) {
      return NextResponse.json(
        { error: "Archivo excede el límite", maxBytes: cfg.maxBytes },
        { status: 400 },
      );
    }

    // key: dir/YYYY/MM/DD/uuid-base.ext
    const now = new Date();
    const yyyy = String(now.getUTCFullYear());
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(now.getUTCDate()).padStart(2, "0");
    const base = slugifyBase(fileName) || "upload";
    const ext = ensureExt(mime, fileName);
    const key = `${dir}/${yyyy}/${mm}/${dd}/${crypto.randomUUID()}-${base}${ext}`;

    const s3 = getS3();
    const cmd = new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      ContentType: mime, // IMPORTANT: lo firmamos para que el browser lo envíe igual
    });

    const url = await getSignedUrl(s3, cmd, { expiresIn: 60 });

    return NextResponse.json(
      {
        url,
        method: "PUT",
        headers: { "Content-Type": mime },
        assetKey: key,
        publicUrl: getS3PublicUrl(key),
        expiresIn: 60,
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Payload inválido", issues: err.issues },
        { status: 400 },
      );
    }
    console.error("POST /api/uploads/sign error:", err);
    return NextResponse.json(
      { error: "Error generando firma" },
      { status: 500 },
    );
  }
}
