/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: next.config.js (ESM) — salida portable y compatibilidad legacy      │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Descripción                                                                 │
 * │ La web genera una salida standalone para un host Node/Docker.               │
 * │ Los externals de FFmpeg existen solo para el rollback temporal sync; el     │
 * │ flujo normal usa la cola y el worker separado.                              │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ 1) Mantiene la carga de env.js                                              │
 * │ 2) Conserva el rollback AUDIO_PROCESSING_MODE=sync sin incluirlo en flujo   │
 * │    HTTP normal.                                                             │
 * │ 3) No contiene configuración específica de ningún hosting.                  │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 */
import "./src/env.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce .next/standalone para el contenedor web; dev y Vercel mantienen
  // su comportamiento normal.
  output: "standalone",
  agentRules: false,
  // Windows reaches this WSL development server through the local port bridge.
  // Next 16 blocks its dev-only scripts unless the bridge host is allowlisted.
  allowedDevOrigins: ["172.28.161.23"],
  serverExternalPackages: ["ffmpeg-static", "ffprobe-static"],
  // The queue worker owns FFmpeg in deploys. Keep the temporary sync rollback
  // usable in local development, but do not copy audio binaries into the
  // standalone web image where queue mode is the supported operation.
  outputFileTracingExcludes: {
    "/*": [
      "node_modules/ffmpeg-static/**/*",
      "node_modules/ffprobe-static/**/*",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "loremflickr.com" },
      { protocol: "https", hostname: "placecats.com" },
      { protocol: "https", hostname: "www.placecats.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
