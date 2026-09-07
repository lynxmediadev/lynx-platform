/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: next.config.js (ESM) — salida portable                             │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Descripción                                                                 │
 * │ La web genera una salida standalone para un host Node/Docker.               │
 * │ La web usa la cola; FFmpeg pertenece exclusivamente al worker separado.     │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ 1) Mantiene la carga de env.js                                              │
 * │ 2) No contiene binarios ni configuración FFmpeg.                            │
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
