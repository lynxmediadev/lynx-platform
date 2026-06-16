/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/lib/audio/paths.ts                                            │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Propósito                                                                  │
 * │ Resolver rutas a ffprobe/ffmpeg para Windows/Mac/Linux corrigiendo         │
 * │ prefijos \ROOT\, comillas y espacios. Ofrece funciones get* idempotentes.  │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import * as fs from "node:fs";
import * as path from "node:path";

// Permite letras, dígitos, separadores de path, guiones, puntos y espacios.
// Bloquea caracteres de shell (;, |, &, $, `, >, <, etc.).
const SAFE_PATH_RE = /^[a-zA-Z0-9/_\-. :\\]+$/;

function isSafePath(p: string): boolean {
  return SAFE_PATH_RE.test(p);
}

function stripQuotes(p?: string | null) {
  if (!p) return p ?? "";
  return p.replace(/^"(.*)"$/, "$1").trim();
}
function fixRootPrefix(p?: string | null) {
  if (!p) return p ?? "";
  let s = stripQuotes(p);
  if (/^[\\/ ]?ROOT[\\/]/i.test(s)) {
    const rel = s.replace(/^[\\/ ]?ROOT[\\/]/i, "");
    s = path.join(process.cwd(), rel);
  }
  return s;
}
function exists(p?: string | null) {
  if (!p) return false;
  try { fs.accessSync(p); return true; } catch { return false; }
}
function isExecutable(p?: string | null) {
  if (!p) return false;
  if (process.platform === "win32") return exists(p);
  try { fs.accessSync(p, fs.constants.X_OK); return true; } catch { return false; }
}
function ensureExecutable(p?: string | null) {
  if (!p) return false;
  if (isExecutable(p)) return true;
  if (process.platform === "win32") return false;
  try {
    fs.chmodSync(p, 0o755);
    return isExecutable(p);
  } catch {
    return false;
  }
}
function pick(candidates: Array<string | undefined>, fallbackCmd: string) {
  for (const c of candidates) {
    const fixed = fixRootPrefix(c);
    if (exists(fixed) && ensureExecutable(fixed)) return fixed;
  }
  return fallbackCmd;
}

function safeEnvPath(value: string | undefined, varName: string): string | undefined {
  if (!value) return undefined;
  const fixed = fixRootPrefix(value);
  if (!isSafePath(fixed)) {
    console.warn(`[audio/paths] ${varName} contains unsafe characters — ignored. Value: "${fixed}"`);
    return undefined;
  }
  return fixed;
}

export function getFfprobePath() {
  let modulePath: string | undefined;
  try { modulePath = (require("ffprobe-static").path as string); } catch {}
  const envPath = safeEnvPath(process.env.FFPROBE_PATH, "FFPROBE_PATH");
  return pick([envPath, modulePath], "ffprobe");
}

export function getFfmpegPath() {
  let modulePath: string | undefined;
  try { modulePath = (require("ffmpeg-static") as unknown as string); } catch {}
  const envPath = safeEnvPath(process.env.FFMPEG_PATH, "FFMPEG_PATH");
  return pick([envPath, modulePath], "ffmpeg");
}

// Exportar “por compatibilidad”
export const ffprobePath = getFfprobePath();
export const ffmpegPath  = getFfmpegPath();
