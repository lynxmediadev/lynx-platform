/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/lib/audio/paths.ts                                            │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Propósito                                                                  │
 * │ Resolver rutas a ffprobe/ffmpeg para Windows/Mac/Linux, respetando rutas   │
 * │ configuradas y binarios instalados. Ofrece funciones get* idempotentes.    │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import * as fs from "node:fs";
import { createRequire } from "node:module";

// `require` is not defined when this module is loaded by the standalone TS worker.
// Keep CommonJS loading for the static binary packages, but make it explicit and
// compatible with both Next's server runtime and tsx/Node ESM.
const moduleRequire = createRequire(import.meta.url);

function stripQuotes(p?: string | null) {
  if (!p) return p ?? "";
  return p.replace(/^"(.*)"$/, "$1").trim();
}
function exists(p?: string | null) {
  if (!p) return false;
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}
function isExecutable(p?: string | null) {
  if (!p) return false;
  if (process.platform === "win32") return exists(p);
  try {
    fs.accessSync(p, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
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
    const fixed = stripQuotes(c);
    if (exists(fixed) && ensureExecutable(fixed)) return fixed;
  }
  return fallbackCmd;
}

export function getFfprobePath() {
  let modulePath: string | undefined;
  try {
    modulePath = moduleRequire("ffprobe-static").path as string;
  } catch {
    // Usa el binario del PATH como fallback.
  }
  return pick([process.env.FFPROBE_PATH, modulePath], "ffprobe");
}

export function getFfmpegPath() {
  let modulePath: string | undefined;
  try {
    modulePath = moduleRequire("ffmpeg-static") as unknown as string;
  } catch {
    // Usa el binario del PATH como fallback.
  }
  return pick([process.env.FFMPEG_PATH, modulePath], "ffmpeg");
}

// Exportar “por compatibilidad”
export const ffprobePath = getFfprobePath();
export const ffmpegPath = getFfmpegPath();
