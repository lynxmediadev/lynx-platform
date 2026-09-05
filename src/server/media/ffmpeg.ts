// src/server/media/ffmpeg.ts
// Utilidades FFmpeg/FFprobe + helpers de análisis y waveform.
// Node-only (no se usa en el cliente).

import { execa } from "execa";
import { Readable } from "node:stream";

// Resuelve rutas de binarios desde .env o desde instaladores locales
export async function resolveBins() {
  const envFFMPEG = process.env.FFMPEG_PATH?.trim();
  const envFFPROBE = process.env.FFPROBE_PATH?.trim();

  const ffmpeg = envFFMPEG && envFFMPEG.length > 0 ? envFFMPEG : "ffmpeg";
  const ffprobe = envFFPROBE && envFFPROBE.length > 0 ? envFFPROBE : "ffprobe";

  // sanity check
  const okFfmpeg = await checkBin(ffmpeg);
  const okFfprobe = await checkBin(ffprobe);

  if (!okFfmpeg || !okFfprobe) {
    throw new Error(
      `Binarios no disponibles: ${!okFfmpeg ? `ffmpeg NO (intentado: ${ffmpeg})` : ""} ${
        !okFfprobe ? `ffprobe NO (intentado: ${ffprobe})` : ""
      }`.trim(),
    );
  }

  return { ffmpeg, ffprobe } as const;
}

async function checkBin(bin: string) {
  try {
    await execa(bin, ["-version"]);
    return true;
  } catch {
    return false;
  }
}

// Extrae metadatos básicos con ffprobe
export async function probeAudio(ffprobe: string, url: string) {
  const { stdout } = await execa(ffprobe, [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    url,
  ]);
  const info = JSON.parse(stdout);
  // Buscamos stream de audio principal
  const a =
    (info.streams || []).find((s: any) => s.codec_type === "audio") || {};
  const fmt = info.format || {};
  const durationSec = Number.parseFloat(fmt.duration || a.duration || "0") || 0;

  // bitrate (kbps)
  let bitrateKbps = 0;
  if (fmt.bit_rate) bitrateKbps = Math.round(Number(fmt.bit_rate) / 1000);
  else if (a.bit_rate) bitrateKbps = Math.round(Number(a.bit_rate) / 1000);

  return {
    durationSec,
    sampleRateHz: Number(a.sample_rate || 0) || 0,
    channels: Number(a.channels || 0) || 0,
    bitrateKbps,
  };
}

// Mide loudness con loudnorm (I/LRA/TP) en una pasada
export async function measureLoudness(ffmpeg: string, url: string) {
  // imprimimos json sin escribir archivo (-f null -)
  const args = [
    "-hide_banner",
    "-nostats",
    "-i",
    url,
    "-filter_complex",
    "loudnorm=I=-16:TP=-1:LRA=11:print_format=json",
    "-f",
    "null",
    "-",
  ];
  const { stderr } = await execa(ffmpeg, args, { all: true });
  // ffmpeg escribe el JSON de loudnorm en stderr
  const txt = stderr?.toString() || "";
  const jsonStart = txt.indexOf("{");
  const jsonEnd = txt.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    return {
      loudnessLufs: null as number | null,
      loudnessRangeLu: null,
      truePeakDbfs: null,
    };
  }
  const json = txt.substring(jsonStart, jsonEnd + 1);
  const data = JSON.parse(json);
  const loudnessLufs = toNumberOrNull(data.input_i);
  const loudnessRangeLu = toNumberOrNull(data.input_lra);
  const truePeakDbfs = toNumberOrNull(data.input_tp);
  return { loudnessLufs, loudnessRangeLu, truePeakDbfs };
}

function toNumberOrNull(x: any) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

// Genera waveform [0..1] con 256 muestras aprox. usando s16le por pipe
export async function buildWaveform256(ffmpeg: string, url: string) {
  // 1) downmix mono, 2) 8kHz, 3) 16-bit signed PCM, 4) enviamos a stdout
  const args = [
    "-hide_banner",
    "-nostats",
    "-i",
    url,
    "-ac",
    "1",
    "-ar",
    "8000",
    "-f",
    "s16le",
    "pipe:1",
  ];
  const proc = execa(ffmpeg, args, { stdout: "pipe" });

  const chunks: Buffer[] = [];
  if (!proc.stdout) throw new Error("No stdout from ffmpeg");
  for await (const c of Readable.from(proc.stdout))
    chunks.push(Buffer.from(c as Buffer));
  await proc; // Throw si fallo

  const pcm = Buffer.concat(chunks); // 16-bit little-endian
  const samples = pcm.length / 2;
  const view = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);

  // downsample a 256 bins (peak abs)
  const bins = 256;
  const step = Math.max(1, Math.floor(samples / bins));
  const out: number[] = [];
  let ofs = 0;
  for (let i = 0; i < bins; i++) {
    let peak = 0;
    const start = i * step;
    const end = Math.min(samples, start + step);
    ofs = start * 2;
    for (let s = start; s < end; s++, ofs += 2) {
      const val = view.getInt16(ofs, true) / 32768; // [-1..1]
      const a = Math.abs(val);
      if (a > peak) peak = a;
    }
    out.push(Number(peak.toFixed(5)));
  }
  return out;
}

// Aplica normalización (si se pide) y devuelve {key, publicUrl} de la versión normalizada
export async function normalizeIfNeeded(
  ffmpeg: string,
  url: string,
  opts: {
    targetLufs: number;
    measuredLufs: number | null;
    outFile: string;
    toPublicUrl: (key: string) => string;
  },
) {
  if (opts.measuredLufs == null)
    return { normalized: false, uploaded: {} as Record<string, string> };

  const gainDb = opts.targetLufs - opts.measuredLufs;
  // Si el ajuste es minúsculo (< 0.1dB) no hacemos nada
  if (Math.abs(gainDb) < 0.1) {
    return { normalized: false, uploaded: {} };
  }

  // Renderiza WAV con volume
  await execa(ffmpeg, [
    "-hide_banner",
    "-nostats",
    "-i",
    url,
    "-filter:a",
    `volume=${gainDb}dB`,
    "-y",
    opts.outFile,
  ]);

  // *** Aquí NO subimos por S3 directamente para no tocar tu flujo actual ***
  // Devolvemos key+URL "públicos" esperados por tu R2 si deseas moverlo ahí
  const key = opts.outFile.replaceAll("\\", "/").split("/audio/").pop()
    ? `audio/${opts.outFile.replaceAll("\\", "/").split("/audio/")[1]}`
    : `audio/${Date.now()}-norm.wav`;
  const publicUrl = opts.toPublicUrl(key);
  return { normalized: true, uploaded: { key, publicUrl } };
}
