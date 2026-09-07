/**
 * Local-only worker for durable AudioJob records. It has no HTTP listener:
 * it only makes outbound connections to PostgreSQL/Supabase and Cloudflare R2.
 */
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { TrackAssetBucket } from "@prisma/client";
import type { TrackAsset } from "@prisma/client";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { hostname, tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import { once } from "node:events";
import { computeWaveformFromFile } from "../src/lib/audio/waveform";
import {
  measureEbuLoudnessFromLocalPath,
  probeLoudnormFromLocalPath,
} from "../src/lib/audio/lufs";
import { getFfmpegPath, getFfprobePath } from "../src/lib/audio/paths";
import {
  claimNextAudioJob,
  markAudioJobFailure,
  markAudioJobReady,
} from "../src/lib/audio-jobs/queue";
import { prisma } from "../src/lib/prisma";

const workerId = `${hostname()}-${process.pid}-${randomUUID().slice(0, 8)}`;
const onceMode = process.argv.includes("--once");
const pollMs = boundedNumber(process.env.AUDIO_WORKER_POLL_MS, 5_000, 1_000, 60_000);

class AudioWorkerError extends Error {
  constructor(
    readonly kind: "SOURCE_MISSING" | "INVALID_AUDIO" | "FFMPEG_FAILURE" | "R2_FAILURE" | "DB_FAILURE",
    message: string,
  ) {
    super(`${kind}: ${message}`);
    this.name = "AudioWorkerError";
  }
}

type ProbeResult = {
  durationSec: number | null;
  sampleRateHz: number | null;
  channels: number | null;
  bitrateKbps: number | null;
};

function boundedNumber(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.floor(parsed))) : fallback;
}

function required(name: string) {
  const value = (process.env[name] ?? "").trim();
  if (!value) throw new AudioWorkerError("R2_FAILURE", `Missing ${name}`);
  return value;
}

function r2Config() {
  const accountId = (process.env.R2_ACCOUNT_ID ?? "").trim();
  const endpoint = (process.env.R2_ENDPOINT ?? "").trim() || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  return {
    endpoint: requiredValue(endpoint, "R2_ENDPOINT or R2_ACCOUNT_ID"),
    region: (process.env.R2_REGION ?? "auto").trim() || "auto",
    accessKeyId: required("R2_ACCESS_KEY_ID"),
    secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
    previewsBucket: required("R2_PREVIEWS_BUCKET"),
    privateBucket: required("R2_PRIVATE_BUCKET"),
    publicPreviewUrl: (process.env.R2_PUBLIC_PREVIEW_URL ?? "").trim().replace(/\/+$/, ""),
  };
}

function requiredValue(value: string, label: string) {
  if (!value) throw new AudioWorkerError("R2_FAILURE", `Missing ${label}`);
  return value;
}

function createR2Client() {
  const cfg = r2Config();
  return {
    cfg,
    client: new S3Client({
      region: cfg.region,
      endpoint: cfg.endpoint,
      credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
    }),
  };
}

function bucketName(asset: Pick<TrackAsset, "bucket">, cfg: ReturnType<typeof r2Config>) {
  return asset.bucket === TrackAssetBucket.PREVIEWS ? cfg.previewsBucket : cfg.privateBucket;
}

function publicPreviewUrl(key: string, cfg: ReturnType<typeof r2Config>) {
  if (!cfg.publicPreviewUrl) throw new AudioWorkerError("R2_FAILURE", "Missing R2_PUBLIC_PREVIEW_URL");
  return `${cfg.publicPreviewUrl}/${key.replace(/^\/+/, "")}`;
}

async function downloadObject(client: S3Client, bucket: string, key: string, destination: string) {
  try {
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!result.Body) throw new Error("R2 returned an empty response body");
    const bytes = await result.Body.transformToByteArray();
    await fs.writeFile(destination, bytes);
  } catch (error) {
    throw new AudioWorkerError("SOURCE_MISSING", `Cannot download source asset (${error instanceof Error ? error.name : "unknown error"})`);
  }
}

async function objectExists(client: S3Client, bucket: string, key: string) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function runFfprobe(filePath: string): Promise<ProbeResult> {
  const bin = getFfprobePath();
  const child = spawn(bin, ["-v", "error", "-of", "json", "-show_format", "-show_streams", filePath]);
  const stdout: Buffer[] = [];
  const stderr: Buffer[] = [];
  child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
  child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
  const [code] = (await once(child, "close")) as [number];
  if (code !== 0) throw new AudioWorkerError("INVALID_AUDIO", `ffprobe exited with code ${code}`);
  try {
    const result = JSON.parse(Buffer.concat(stdout).toString("utf8")) as {
      streams?: Array<{ codec_type?: string; duration?: string; sample_rate?: string; channels?: number; bit_rate?: string }>;
      format?: { duration?: string; bit_rate?: string };
    };
    const stream = result.streams?.find(item => item.codec_type === "audio");
    if (!stream) throw new Error("No audio stream");
    const numeric = (value?: string | number) => (value == null || !Number.isFinite(Number(value)) ? null : Number(value));
    const duration = numeric(stream.duration) ?? numeric(result.format?.duration);
    return {
      durationSec: duration === null ? null : Math.round(duration),
      sampleRateHz: numeric(stream.sample_rate),
      channels: numeric(stream.channels),
      bitrateKbps: Math.round((numeric(stream.bit_rate) ?? numeric(result.format?.bit_rate) ?? 0) / 1000) || null,
    };
  } catch {
    throw new AudioWorkerError("INVALID_AUDIO", "ffprobe returned invalid metadata");
  }
}

async function transcodePreview(source: string, destination: string) {
  const bin = getFfmpegPath();
  const child = spawn(bin, [
    "-y", "-hide_banner", "-nostats", "-i", source, "-vn", "-map_metadata", "-1",
    "-codec:a", "libmp3lame", "-b:a", "192k", destination,
  ]);
  const [code] = (await once(child, "close")) as [number];
  if (code !== 0) throw new AudioWorkerError("FFMPEG_FAILURE", `Preview transcode failed with code ${code}`);
}

function waveformBytes(points: number[]) {
  return Buffer.from(new Float32Array(points).buffer);
}

function ebuStatsAreSane(i: number | null, lra: number | null, peak: number | null) {
  return i !== null && i > -60 && i < -1 && lra !== null && lra >= 0 && lra <= 35 && peak !== null && peak >= -40 && peak <= 6;
}

async function latestProcessableAsset(trackId: string) {
  return prisma.trackAsset.findFirst({
    where: { trackId, status: "VERIFIED", type: { in: ["MASTER", "PREVIEW"] } },
    orderBy: [{ type: "asc" }, { updatedAt: "desc" }],
  });
}

async function processJob(job: Awaited<ReturnType<typeof claimNextAudioJob>>) {
  if (!job) return false;
  const workDir = await fs.mkdtemp(join(tmpdir(), "lynx-audio-job-"));
  try {
    const track = await prisma.track.findUnique({ where: { id: job.trackId } });
    if (!track) throw new AudioWorkerError("DB_FAILURE", "Track no longer exists");
    const source = job.assetId
      ? await prisma.trackAsset.findFirst({ where: { id: job.assetId, trackId: job.trackId, status: "VERIFIED" } })
      : await latestProcessableAsset(job.trackId);
    if (!source) throw new AudioWorkerError("SOURCE_MISSING", "No verified master or preview asset exists");

    const { cfg, client } = createR2Client();
    const extension = extname(source.storageKey).replace(/[^a-z0-9.]/gi, "") || ".audio";
    const sourceFile = join(workDir, `source${extension}`);
    await downloadObject(client, bucketName(source, cfg), source.storageKey, sourceFile);

    const metadata = await runFfprobe(sourceFile);
    const waveform = await computeWaveformFromFile(sourceFile, getFfmpegPath(), { points: 256 });
    let loudness: Awaited<ReturnType<typeof measureEbuLoudnessFromLocalPath>> | null = null;
    let fallback: Awaited<ReturnType<typeof probeLoudnormFromLocalPath>> | null = null;
    try {
      loudness = await measureEbuLoudnessFromLocalPath(sourceFile);
      if (!ebuStatsAreSane(loudness.integratedLufs, loudness.loudnessRangeLu, loudness.truePeakDbfs)) {
        fallback = await probeLoudnormFromLocalPath(sourceFile);
      }
    } catch {
      try { fallback = await probeLoudnormFromLocalPath(sourceFile); } catch { /* analysis remains partial */ }
    }

    let previewKey: string | null = source.type === "PREVIEW" ? source.storageKey : null;
    if (source.type === "MASTER") {
      previewKey = `processed/${track.id}/previews/${source.id}.mp3`;
      const exists = await objectExists(client, cfg.previewsBucket, previewKey);
      if (!exists) {
        const previewFile = join(workDir, "preview.mp3");
        await transcodePreview(sourceFile, previewFile);
        try {
          await client.send(new PutObjectCommand({
            Bucket: cfg.previewsBucket,
            Key: previewKey,
            Body: await fs.readFile(previewFile),
            ContentType: "audio/mpeg",
            CacheControl: "public, max-age=31536000, immutable",
            IfNoneMatch: "*",
          }));
        } catch (error) {
          if (!await objectExists(client, cfg.previewsBucket, previewKey)) {
            throw new AudioWorkerError("R2_FAILURE", `Cannot upload preview (${error instanceof Error ? error.name : "unknown error"})`);
          }
        }
      }
      const previewHead = await client.send(new HeadObjectCommand({ Bucket: cfg.previewsBucket, Key: previewKey }));
      await prisma.trackAsset.upsert({
        where: { bucket_storageKey: { bucket: "PREVIEWS", storageKey: previewKey } },
        create: {
          trackId: track.id, type: "PREVIEW", access: "PUBLIC", status: "VERIFIED", bucket: "PREVIEWS",
          storageKey: previewKey, mime: "audio/mpeg", sizeBytes: BigInt(previewHead.ContentLength ?? 0),
          checksumSha256: previewHead.ChecksumSHA256 ?? null, uploadedAt: previewHead.LastModified ?? new Date(), verifiedAt: new Date(),
        },
        update: { status: "VERIFIED", mime: "audio/mpeg", sizeBytes: BigInt(previewHead.ContentLength ?? 0), checksumSha256: previewHead.ChecksumSHA256 ?? null, verifiedAt: new Date() },
      });
    }

    const selectedLoudness = fallback ?? loudness;
    await prisma.track.update({
      where: { id: track.id },
      data: {
        durationSec: metadata.durationSec ?? undefined,
        sampleRateHz: metadata.sampleRateHz ?? undefined,
        channels: metadata.channels ?? undefined,
        bitrateKbps: metadata.bitrateKbps ?? undefined,
        loudnessLufs: selectedLoudness?.integratedLufs ?? undefined,
        loudnessRangeLu: selectedLoudness?.loudnessRangeLu ?? undefined,
        truePeakDbfs: selectedLoudness?.truePeakDbfs ?? undefined,
        lraLowLufs: loudness?.lraLowLufs ?? undefined,
        lraHighLufs: loudness?.lraHighLufs ?? undefined,
        waveform: waveform.length ? waveformBytes(waveform) : undefined,
        analysisAt: new Date(),
        audioUrl: previewKey ? publicPreviewUrl(previewKey, cfg) : track.audioUrl,
      },
    });
    await markAudioJobReady(job.id, workerId);
    console.info(`[audio-worker] ready job=${job.id} track=${track.id} source=${basename(source.storageKey)}`);
  } catch (error) {
    const outcome = await markAudioJobFailure(job.id, workerId, error);
    console.error(`[audio-worker] ${outcome?.exhausted ? "failed" : "retry"} job=${job.id}`, error instanceof AudioWorkerError ? error.kind : "UNKNOWN");
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
  return true;
}

async function main() {
  console.info(`[audio-worker] started id=${workerId} mode=${onceMode ? "once" : "continuous"}`);
  let running = true;
  while (running) {
    const claimed = await claimNextAudioJob(workerId);
    const didWork = await processJob(claimed);
    if (onceMode || !didWork) {
      if (onceMode) {
        running = false;
        continue;
      }
      await new Promise(resolve => setTimeout(resolve, pollMs));
    }
  }
  await prisma.$disconnect();
}

void main().catch(async error => {
  console.error("[audio-worker] fatal", error instanceof Error ? error.message : "unknown error");
  await prisma.$disconnect();
  process.exitCode = 1;
});
