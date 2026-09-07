export const AUDIO_JOB_MAX_ATTEMPTS_DEFAULT = 3;
export const AUDIO_JOB_RETRY_BASE_MS = 30_000;
export const AUDIO_JOB_RETRY_MAX_MS = 15 * 60_000;

export type AudioJobFailureResult = "retry" | "failed";

/** Bounded exponential backoff: 30 s, 60 s, 120 s ... up to 15 min. */
export function nextRetryAt(attempts: number, now = new Date()) {
  const delay = Math.min(
    AUDIO_JOB_RETRY_MAX_MS,
    AUDIO_JOB_RETRY_BASE_MS * 2 ** Math.max(0, attempts - 1),
  );
  return new Date(now.getTime() + delay);
}

export function failureResult(attempts: number, maxAttempts: number): AudioJobFailureResult {
  return attempts >= maxAttempts ? "failed" : "retry";
}

/** Never retain presigned URLs, query strings, or unbounded process output in PostgreSQL. */
export function sanitizeAudioJobError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error ?? "Unknown error");
  return raw
    .replace(/https?:\/\/[^\s]+/gi, "[url redacted]")
    .replace(/(?:X-Amz-[^=\s]*|Signature|Credential|Token)=?[^\s&]*/gi, "[credential redacted]")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 500);
}
