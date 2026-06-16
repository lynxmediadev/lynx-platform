import { preflightAudioUrl, resolveAudioUrl } from "@/lib/audio/audio-url";

export type AudioCheckResult = {
  status: "ok" | "invalid";
  message: string | null;
  resolvedAudioUrl?: string;
};

type AudioCheckOptions = {
  cacheKey?: string;
  ttlMs?: number;
  skipCache?: boolean;
};

const DEFAULT_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_SIZE = 500;

// FIFO-bounded Map: cuando supera CACHE_MAX_SIZE elimina la entrada más antigua.
const audioCheckCache = new Map<
  string,
  { status: "ok" | "invalid"; message: string | null; expiresAt: number }
>();

function cacheSet(key: string, value: { status: "ok" | "invalid"; message: string | null; expiresAt: number }) {
  if (audioCheckCache.size >= CACHE_MAX_SIZE) {
    const oldest = audioCheckCache.keys().next().value;
    if (oldest !== undefined) audioCheckCache.delete(oldest);
  }
  audioCheckCache.set(key, value);
}

function buildCacheKey(resolvedAudioUrl: string, cacheKey?: string) {
  return cacheKey ? `${cacheKey}::${resolvedAudioUrl}` : resolvedAudioUrl;
}

export async function getAudioCheckStatus(
  audioUrl: string | null | undefined,
  options: AudioCheckOptions = {},
): Promise<AudioCheckResult> {
  const trimmed = audioUrl?.trim();

  if (!trimmed) {
    return { status: "invalid", message: "Audio URL vacío." };
  }

  const resolvedAudioUrl = resolveAudioUrl(trimmed);
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const cacheKey = buildCacheKey(resolvedAudioUrl, options.cacheKey);
  const now = Date.now();

  if (!options.skipCache) {
    const cached = audioCheckCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return {
        status: cached.status,
        message: cached.message,
        resolvedAudioUrl,
      };
    }
    if (cached) audioCheckCache.delete(cacheKey);
  }

  let status: "ok" | "invalid" = "ok";
  let message: string | null = null;

  try {
    await preflightAudioUrl(resolvedAudioUrl);
  } catch (err: any) {
    status = "invalid";
    message = err?.message ?? "Audio URL no accesible.";
  }

  if (!options.skipCache) {
    cacheSet(cacheKey, {
      status,
      message,
      expiresAt: now + ttlMs,
    });
  }

  return { status, message, resolvedAudioUrl };
}
