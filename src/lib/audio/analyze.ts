/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: src/lib/audio/analyze.ts                                            │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Descarga el audio a /tmp (fetch + arrayBuffer).                           │
 * │ - ffprobe → duration, sampleRate, channels, bitrate.                        │
 * │ - ebur128 (EBU R128) → I, LRA, LRA low/high, True Peak.                     │
 * │ - Fallback loudnorm (JSON) si ebur128 luce inválido.                        │
 * │ - Waveform → decodifica a PCM mono 8 kHz y resume a 256 puntos (Float32).   │
 * │ - Guarda todo en Prisma (incluye waveform como Bytes).                      │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ 1) Este módulo NO toca assetKey/MIME/Size (eso es C3/normalize).            │
 * │ 2) Requiere runtime nodejs por FS/child_process.                            │
 * │ 3) Si falla una parte no crítica, devolvemos warning pero OK 200.           │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import { db } from "@/server/db";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { promises as fsp } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  measureEbuLoudnessFromLocalPath,
  probeLoudnormFromLocalPath,
} from "./lufs";
import { preflightAudioUrl, resolveAudioUrl } from "./audio-url";
import { getFfprobePath, getFfmpegPath } from "./paths"; // ← FIX: nombres reales

type ProbeResult = {
  durationSec: number | null;
  sampleRateHz: number | null;
  channels: number | null;
  bitrateKbps: number | null;
  raw?: string;
};

/** Descarga la URL pública a un archivo temporal. */
async function downloadToTemp(url: string, extGuess = "mp3"): Promise<string> {
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`Failed to download: ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const base = url.split("?")[0] ?? url;
  const match = base.match(/\.([a-z0-9]+)$/i);
  const ext = (match?.[1] ?? extGuess).toLowerCase();
  const tmp = join(tmpdir(), `lynx-${randomUUID()}.${ext}`);
  await fsp.writeFile(tmp, buf);
  return tmp;
}

/** Ejecuta ffprobe y devuelve métricas “básicas” del stream de audio. */
function runFfprobeJson(filePath: string): Promise<ProbeResult> {
  return new Promise((resolve, reject) => {
    const bin = getFfprobePath(); // ← FIX: tu helper real
    const args = [
      "-v",
      "error",
      "-of",
      "json",
      "-show_format",
      "-show_streams",
      filePath,
    ];
    const child = spawn(bin, args);
    let out = "";
    let err = "";

    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));

    child.on("error", (e) => {
      reject(
        Object.assign(new Error(`ffprobe spawn failed: ${e.message}`), {
          ffprobePath: bin,
          stdoutPreview: out.slice(0, 600),
          stderrPreview: err.slice(0, 600),
        }),
      );
    });

    child.on("close", () => {
      try {
        const json = JSON.parse(out);
        const stream =
          (json.streams || []).find((s: any) => s.codec_type === "audio") ?? {};
        const fmt = json.format ?? {};
        const durationSec = stream.duration
          ? Number(stream.duration)
          : fmt.duration
            ? Number(fmt.duration)
            : null;
        const sampleRateHz = stream.sample_rate
          ? Number(stream.sample_rate)
          : null;
        const channels = stream.channels ? Number(stream.channels) : null;
        const bitrateKbps = stream.bit_rate
          ? Math.round(Number(stream.bit_rate) / 1000)
          : fmt.bit_rate
            ? Math.round(Number(fmt.bit_rate) / 1000)
            : null;

        resolve({ durationSec, sampleRateHz, channels, bitrateKbps, raw: out });
      } catch (e: any) {
        reject(
          Object.assign(new Error(`ffprobe parse failed: ${e.message}`), {
            ffprobePath: bin,
            stdoutPreview: out.slice(0, 600),
            stderrPreview: err.slice(0, 600),
          }),
        );
      }
    });
  });
}

/**
 * Decodifica a PCM s16le mono, 8 kHz, y resume a `points` picos absolutos.
 * Devuelve Buffer de Float32Array (Bytes para Prisma).
 */
async function computeWaveformBytes(
  filePath: string,
  points = 256,
): Promise<{ bytes: Buffer; pointCount: number }> {
  const ffmpeg = getFfmpegPath(); // ← FIX
  const args = [
    "-hide_banner",
    "-nostats",
    "-i",
    filePath,
    "-ac",
    "1", // mono
    "-ar",
    "8000", // 8 kHz (ligero)
    "-f",
    "s16le", // PCM 16-bit LE
    "-", // stdout
  ];

  return await new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, args);
    const chunks: Buffer[] = [];
    let err = "";

    child.stdout.on("data", (d) => chunks.push(Buffer.from(d)));
    child.stderr.on("data", (d) => {
      err += d.toString();
    });
    child.on("error", (e) =>
      reject(new Error(`ffmpeg waveform spawn failed: ${e.message}`)),
    );

    child.on("close", () => {
      try {
        const pcm = Buffer.concat(chunks);
        const samples = new Int16Array(Math.floor(pcm.length / 2));
        for (let i = 0; i < samples.length; i++)
          samples[i] = pcm.readInt16LE(i * 2);

        const window = Math.max(1, Math.floor(samples.length / points));
        const out = new Float32Array(points);
        for (let i = 0; i < points; i++) {
          const start = i * window;
          const end = i + 1 === points ? samples.length : (i + 1) * window;
          let peak = 0;
          for (let j = start; j < end; j++) {
            const v = Math.abs(samples[j] ?? 0);
            if (v > peak) peak = v;
          }
          out[i] = peak / 32768.0; // normaliza 0..1
        }
        resolve({ bytes: Buffer.from(out.buffer), pointCount: points });
      } catch (e: any) {
        reject(
          new Error(
            `waveform build failed: ${e.message}\n${err.slice(0, 600)}`,
          ),
        );
      }
    });
  });
}

/** Sanity-check para decidir si un set ebur128 es creíble. */
function isEbu128Sane(
  i: number | null,
  lra: number | null,
  tp: number | null,
): boolean {
  if (i == null || i <= -60 || i >= -1) return false; // I típico [-60..-5]
  if (lra == null || lra < 0.1 || lra > 35) return false; // LRA positivo y razonable
  if (tp == null || tp < -40 || tp > 6) return false; // True Peak razonable
  return true;
}

/** Punto de entrada principal: analiza y guarda los resultados en la fila Track. */
export async function analyzeTrackById(id: string): Promise<{
  updated: any;
  warnings: string[];
  debug?: any;
}> {
  const track = await db.track.findUnique({
    where: { id },
    include: {
      assets: {
        where: { type: "PREVIEW", access: "PUBLIC", status: "VERIFIED" },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });
  if (!track) throw new Error("Track not found");
  const { resolvePublicTrackAudio } = await import("@/lib/storage/public-track-audio");
  const sourceAudioUrl = resolvePublicTrackAudio(track);
  if (!sourceAudioUrl) throw new Error("Track has no public preview");

  const warnings: string[] = [];
  const debug: any = {};
  let tmpFile: string | null = null;
  const resolvedAudioUrl = resolveAudioUrl(sourceAudioUrl);

  try {
    await preflightAudioUrl(resolvedAudioUrl);
    // 0) Descargar a /tmp
    tmpFile = await downloadToTemp(resolvedAudioUrl);

    // 1) ffprobe
    let durationSec: number | null = null;
    let sampleRateHz: number | null = null;
    let channels: number | null = null;
    let bitrateKbps: number | null = null;

    try {
      const meta = await runFfprobeJson(tmpFile);
      debug.ffprobe = {
        code: 0,
        stdoutPreview: meta.raw?.slice(0, 600) ?? "",
        stderrPreview: "",
      };
      durationSec = meta.durationSec;
      sampleRateHz = meta.sampleRateHz;
      channels = meta.channels;
      bitrateKbps = meta.bitrateKbps;
    } catch (e: any) {
      warnings.push("ffprobe failed");
      debug.ffprobe = {
        error: e.message,
        ffprobePath: e.ffprobePath,
        stdoutPreview: e.stdoutPreview,
        stderrPreview: e.stderrPreview,
      };
    }

    // 2) ebur128 → fallback loudnorm si luce inválido
    let iLufs: number | null = null;
    let lraLu: number | null = null;
    let lraLow: number | null = null;
    let lraHigh: number | null = null;
    let truePeak: number | null = null;
    let lufsSource: "ebur128" | "loudnorm" | "skipped" = "skipped";

    try {
      const ebu = await measureEbuLoudnessFromLocalPath(tmpFile);
      debug.ebur128 = {
        summaryPreview: ebu.rawSummary.slice(0, 800),
        ffmpegPath: getFfmpegPath(),
      };

      iLufs = ebu.integratedLufs;
      lraLu = ebu.loudnessRangeLu;
      lraLow = ebu.lraLowLufs;
      lraHigh = ebu.lraHighLufs;
      truePeak = ebu.truePeakDbfs;

      if (!isEbu128Sane(iLufs, lraLu, truePeak)) {
        // Fallback a loudnorm (JSON por stdout/err)
        const ln = await probeLoudnormFromLocalPath(tmpFile);
        debug.loudnorm = {
          previewJson: (ln.rawJson || "").slice(0, 800),
          source: ln.source,
        };

        if (
          ln.integratedLufs != null &&
          ln.loudnessRangeLu != null &&
          ln.truePeakDbfs != null
        ) {
          iLufs = ln.integratedLufs;
          lraLu = ln.loudnessRangeLu;
          truePeak = ln.truePeakDbfs;
          lufsSource = "loudnorm";
        } else {
          lufsSource = "skipped";
          if (!warnings.includes("lufs skipped (out-of-range)"))
            warnings.push("lufs skipped (out-of-range)");
        }
      } else {
        lufsSource = "ebur128";
      }
    } catch {
      // Si ebur128 falla duro, intentamos loudnorm directo
      try {
        const ln = await probeLoudnormFromLocalPath(tmpFile);
        debug.loudnorm = {
          previewJson: (ln.rawJson || "").slice(0, 800),
          source: ln.source,
        };

        if (
          ln.integratedLufs != null &&
          ln.loudnessRangeLu != null &&
          ln.truePeakDbfs != null
        ) {
          iLufs = ln.integratedLufs;
          lraLu = ln.loudnessRangeLu;
          truePeak = ln.truePeakDbfs;
          lufsSource = "loudnorm";
        } else {
          lufsSource = "skipped";
          warnings.push("lufs failed");
        }
      } catch {
        lufsSource = "skipped";
        warnings.push("lufs failed");
      }
    }

    // 3) Waveform → Bytes (Float32)
    let waveformBytes: Buffer | null = null;
    let waveformPoints = 0;
    try {
      const wf = await computeWaveformBytes(tmpFile, 256);
      waveformBytes = wf.bytes;
      waveformPoints = wf.pointCount;
      debug.waveform = {
        computed: true,
        points: waveformPoints,
        bytesLen: waveformBytes.length,
      };
    } catch (e: any) {
      debug.waveform = { computed: false, error: e?.message ?? "failed" };
      warnings.push("waveform failed");
    }

    // Debug extra
    debug.ffprobePath = getFfprobePath();
    debug.ffmpegPath = getFfmpegPath();
    debug.audioUrl = sourceAudioUrl;
    debug.resolvedAudioUrl = resolvedAudioUrl;
    debug.tmpFile = tmpFile;
    debug.lufsSource = lufsSource;

    // 4) Guardado en Prisma (idempotente: solo escribimos valores válidos)
    const data: any = { analysisAt: new Date() };
    if (durationSec != null) data.durationSec = durationSec;
    if (sampleRateHz != null) data.sampleRateHz = sampleRateHz;
    if (channels != null) data.channels = channels;
    if (bitrateKbps != null) data.bitrateKbps = bitrateKbps;

    if (iLufs != null) data.loudnessLufs = iLufs;
    if (lraLu != null) data.loudnessRangeLu = lraLu;
    if (lraLow != null) data.lraLowLufs = lraLow;
    if (lraHigh != null) data.lraHighLufs = lraHigh;
    if (truePeak != null) data.truePeakDbfs = truePeak;

    if (waveformBytes && waveformBytes.length > 0)
      data.waveform = { set: waveformBytes }; // Bytes

    const updated = await db.track.update({
      where: { id },
      data,
      select: {
        id: true,
        durationSec: true,
        loudnessLufs: true,
        loudnessRangeLu: true,
        lraLowLufs: true,
        lraHighLufs: true,
        truePeakDbfs: true,
        sampleRateHz: true,
        channels: true,
        bitrateKbps: true,
        analysisAt: true,
      },
    });

    return { updated, warnings, debug };
  } finally {
    // 5) Limpieza del tmp
    if (tmpFile) {
      try {
        await fsp.unlink(tmpFile);
      } catch {
        // El archivo temporal pudo haber sido eliminado por el sistema.
      }
    }
  }
}
