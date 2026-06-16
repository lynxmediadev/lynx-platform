// src/app/api/debug/ffmpeg/route.ts
/**
 * Debug FFMPEG desde el runtime de Next.js (dev).
 *
 * Peras y manzanas:
 * - Permite verificar si el proceso de Node que corre Next
 *   realmente puede ejecutar `ffmpeg -version`.
 * - NO toca ninguna lógica de tu endpoint de análisis.
 * - Si hay problema de PATH u otra cosa, nos lo dice en JSON
 *   sin tirar un uncaughtException.
 */

import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getFfmpegPath, getFfprobePath } from "@/lib/audio/paths";

export const runtime = "nodejs"; // aseguramos entorno Node, no Edge

const execFileAsync = promisify(execFile);

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  try {
    const ffmpegPath = getFfmpegPath();
    const ffprobePath = getFfprobePath();
    const { stdout } = await execFileAsync(ffmpegPath, ["-version"]);

    return NextResponse.json({
      ok: true,
      where: "Next.js runtime",
      ffmpegVersion: stdout.split("\n")[0] ?? stdout,
      sample: stdout.slice(0, 500),
      ffmpegPath,
      ffprobePath,
      path: process.env.PATH ?? null,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: String(err?.message ?? err),
        code: err?.code ?? null,
        syscall: err?.syscall ?? null,
        pathTried: getFfmpegPath(),
        pathEnv: process.env.PATH ?? null,
      },
      { status: 500 },
    );
  }
}
