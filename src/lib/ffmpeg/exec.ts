/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: FFmpeg/FFprobe exec helpers (Windows-friendly)                      │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Descripción                                                                 │
 * │ Ejecuta ffmpeg/ffprobe capturando salida de manera segura en Windows.       │
 * │ Añade `runStderr()` para comandos que sólo necesitan stderr (p.ej. ebur128) │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - getFfmpegPath(), getFfprobePath()                                         │
 * │ - run(): captura stdout+stderr (por defecto)                                │
 * │ - runStderr(): ignora stdout y sólo captura stderr (evita backpressure)     │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - ebur128/loudnorm imprimen métricas en stderr/JSON; no necesitamos stdout. │
 * │ - Ignorar stdout evita bloqueos por tuberías grandes en Windows.            │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
// ffprobe-static usa export = { path }
const ffprobeStatic = require("ffprobe-static") as { path: string };

export function getFfmpegPath() {
  return ffmpegPath as string;
}
export function getFfprobePath() {
  return ffprobeStatic.path as string;
}

export function run(
  cmd: string,
  args: string[],
  { timeoutMs = 60_000 }: { timeoutMs?: number } = {},
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    const t = setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {
        /* El proceso ya terminó. */
      }
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", reject);
    child.on("close", (code) => {
      clearTimeout(t);
      resolve({ code, stdout, stderr });
    });
  });
}

/** Igual a run(), pero ignora stdout (evita backpressure). Captura sólo stderr. */
export function runStderr(
  cmd: string,
  args: string[],
  { timeoutMs = 60_000 }: { timeoutMs?: number } = {},
): Promise<{ code: number | null; stderr: string }> {
  return new Promise((resolve, reject) => {
    // stdout -> ignore; sólo capturamos stderr
    const child = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";

    const t = setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {
        /* El proceso ya terminó. */
      }
    }, timeoutMs);

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", reject);
    child.on("close", (code) => {
      clearTimeout(t);
      resolve({ code, stderr });
    });
  });
}
