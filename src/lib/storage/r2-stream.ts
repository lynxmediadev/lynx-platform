/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: R2 stream helper (publicUrl → Readable con SDK S3)                  │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Descripción                                                                 │
 * │ Dado un `publicUrl` de Cloudflare R2 (bucket público), deduce el `Key` y    │
 * │ retorna un stream legible usando `GetObjectCommand`. Si no puede derivar    │
 * │ key o falla el SDK, hace fallback a `fetch(publicUrl)`.                      │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - publicUrlToKey(): mapea URL pública → Key del objeto en el bucket.        │
 * │ - getObjectReadableFromPublicUrl(): Readable vía SDK (preferido).           │
 * │ - getReadableEither(): SDK o fetch (fallback), siempre Node.Readable.       │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Evita problemas TLS/CDN al alimentar ffmpeg: todo se hace localmente.     │
 * │ - Para URLs externas (no-R2), fetch → Readable funciona igual.              │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import { Readable } from "node:stream";
import { getS3 } from "@/lib/storage/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";

const PUBLIC_BASE = process.env.S3_PUBLIC_BASE_URL || "";
const BUCKET = process.env.S3_BUCKET || "";

export function publicUrlToKey(url: string): string | null {
  if (!PUBLIC_BASE) return null;
  if (!url.startsWith(PUBLIC_BASE)) return null;
  const rel = url.substring(PUBLIC_BASE.length);
  const key = rel.replace(/^\/+/, "");
  return key || null;
}

export async function getObjectReadableFromPublicUrl(
  publicUrl: string,
): Promise<Readable | null> {
  const key = publicUrlToKey(publicUrl);
  if (!key || !BUCKET) return null;
  const s3 = getS3();
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const body: any = (res as any).Body; // SDK puede retornar Node.Readable o Web ReadableStream
  if (!body) return null;

  if (typeof body.pipe === "function") {
    return body as Readable; // Node.Readable
  }
  if (typeof (Readable as any).fromWeb === "function" && body.getReader) {
    return (Readable as any).fromWeb(body);
  }
  return null;
}

export async function getReadableEither(
  publicUrl: string,
): Promise<Readable | null> {
  // 1) Preferimos R2 (SDK)
  const s3Readable = await getObjectReadableFromPublicUrl(publicUrl).catch(
    () => null,
  );
  if (s3Readable) return s3Readable;

  // 2) Fallback: fetch directo
  try {
    const res = await fetch(publicUrl);
    if (!res.ok || !res.body) return null;
    // @ts-expect-error Node y DOM usan tipos distintos para ReadableStream.
    return Readable.fromWeb(res.body);
  } catch {
    return null;
  }
}
