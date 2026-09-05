/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: next.config.js (ESM) — externals para ffmpeg/ffprobe                │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Descripción                                                                 │
 * │ Evita que Turbopack/Webpack intenten empaquetar los binarios de             │
 * │ ffmpeg-static y ffprobe-static. En runtime se resuelven desde node_modules. │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ 1) Mantiene la carga de env.js                                              │
 * │ 2) Marca ffmpeg-static y ffprobe-static como "externals" del servidor       │
 * │ 3) Después de guardar, limpia .next y reinicia el dev server                │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 */
import "./src/env.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  // Windows reaches this WSL development server through the local port bridge.
  // Next 16 blocks its dev-only scripts unless the bridge host is allowlisted.
  allowedDevOrigins: ["172.28.161.23"],
  serverExternalPackages: ["ffmpeg-static", "ffprobe-static"],
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
