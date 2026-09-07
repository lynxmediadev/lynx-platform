/**
 * ============================================================================
 * Archivo: src/lib/base-url.ts
 * Propósito (peras y manzanas):
 * - Entregar una función `getBaseUrl()` que devuelve el origen absoluto para
 *   construir URLs de fetch del lado servidor (RSC/SSR), donde NO sirve usar
 *   rutas relativas tipo "/api/...".
 * - En desarrollo usa http://localhost:3000 (o el puerto definido).
 * - En producción prefiere la variable server-only APP_URL y usa los aliases
 *   públicos/de proveedor únicamente como fallback.
 * Por qué:
 * - Evita el error "Failed to parse URL from /api/..." cuando se hace fetch en
 *   el servidor sin contexto de request.
 * ============================================================================
 */

export function getBaseUrl() {
  // 1) Si el deploy define una URL pública explícita, úsala
  const explicit =
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.URL;
  if (explicit) {
    return explicit.replace(/\/+$/, ""); // sin slash final
  }

  // 2) Vercel (dominio generado)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3) Render/railway/otros podrían exponer envs similares; agregar aquí si los usas.

  // 4) Desarrollo local: puerto típico 3000 o el que definas
  const port = process.env.PORT ?? "3000";
  return `http://localhost:${port}`;
}
