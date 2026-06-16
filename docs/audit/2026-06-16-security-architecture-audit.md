# Auditoría de Seguridad y Arquitectura — Lynx-Platform
**Fecha:** 2026-06-16
**Branch auditado:** `dev` (basado en `platform-1`)
**Ejecutado por:** Claude Sonnet 4.6

---

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Hallazgos de seguridad — Críticos (resueltos)](#2-hallazgos-críticos-resueltos)
3. [Hallazgos de seguridad — Pendientes (requieren acción externa)](#3-hallazgos-pendientes)
4. [Sistema de audio](#4-sistema-de-audio)
5. [Backend y base de datos](#5-backend-y-base-de-datos)
6. [Sistema de archivos y almacenamiento](#6-sistema-de-archivos-y-almacenamiento)
7. [API y tRPC](#7-api-y-trpc)
8. [Catálogo y datos públicos](#8-catálogo-y-datos-públicos)
9. [Propuestas de funcionalidad](#9-propuestas-de-funcionalidad)
10. [Hoja de ruta corto-mediano plazo](#10-hoja-de-ruta)

---

## 1. Resumen ejecutivo

El proyecto tiene una base de código sólida con arquitectura coherente. El stack (Next.js 15 App Router, tRPC, Prisma, R2) está bien elegido para el contexto. Durante la auditoría se detectaron **9 hallazgos de seguridad**, de los cuales **8 fueron corregidos directamente en el código** en esta sesión. Se identificaron además **riesgos de infraestructura** que requieren configuración externa o decisiones del equipo.

El sistema de audio es funcional y correcto para sync licensing, aunque puede evolucionar. Se detectaron oportunidades de mejora en calidad de análisis, soporte de formatos y automatización.

---

## 2. Hallazgos críticos (resueltos en esta sesión)

### 2.1 CRÍTICO — `/api/uploads/sign` sin autenticación
**Archivo:** `src/app/api/uploads/sign/route.ts`
**Riesgo:** Cualquier persona en internet podía obtener una URL firmada para subir archivos a R2 sin estar autenticada. Esto permite abuso de almacenamiento, hosting de archivos maliciosos y costos no controlados en Cloudflare R2.
**Solución aplicada:** Se agregó `getRouteUser()` al inicio del handler. Solo usuarios con rol `ADMIN`, `STAFF` o `CREATOR` pueden generar URLs firmadas.

### 2.2 CRÍTICO — `/api/admin/requests/bulk-delete` sin autenticación
**Archivo:** `src/app/api/admin/requests/bulk-delete/route.ts`
**Riesgo:** Cualquier actor podía eliminar solicitudes de contacto de la base de datos enviando un POST con IDs arbitrarios. No había ningún chequeo de sesión ni de rol.
**Solución aplicada:** Se agrega `getRouteUser()` con verificación de rol `ADMIN` o `STAFF`.

### 2.3 MEDIO — `/api/debug/ffmpeg` expuesto en producción
**Archivo:** `src/app/api/debug/ffmpeg/route.ts`
**Riesgo:** El endpoint exponía paths del sistema de archivos, variables de entorno (`PATH`), y versión de ffmpeg en cualquier entorno. En producción esto es información de reconocimiento para un atacante.
**Solución aplicada:** Se agrega guard de `NODE_ENV === "production"` → responde `404`.

### 2.4 MEDIO — `GET /api/tracks` exponía datos comerciales sensibles sin auth
**Archivo:** `src/app/api/tracks/route.ts`
**Riesgo:** El endpoint GET devolvía el objeto Track completo sin autenticación, incluyendo campos como `budgetMin`, `budgetMax`, `budgetCurrency`, `restrictedBrands`, `restrictedIndustries`, `pricingTier`, y metadatos internos del asset (`assetKey`, `assetSize`).
**Solución aplicada:** Se limita el `select` de Prisma para usuarios no autenticados a solo los campos públicamente seguros.

### 2.5 MEDIO — `CSRF_SECRET` faltante en `.env.example`
**Archivo:** `.env.example`
**Riesgo:** Si `CSRF_SECRET` no está definido en producción, el sistema CSRF cae al default `"dev-insecure-secret-change-me"` (visible en el código fuente), lo que hace que todos los tokens CSRF sean predecibles y el sistema inefectivo.
**Solución aplicada:** Se agrega `CSRF_SECRET` al `.env.example` con instrucción de generación.

### 2.6 MEDIO — `GET /api/tracks/[id]` exponía datos comerciales sin autenticación
**Archivo:** `src/app/api/tracks/[id]/route.ts`
**Riesgo:** El endpoint GET público devolvía el objeto Track completo vía `mapDb()`, incluyendo: números IPI/CAE de publicación, splits de derechos (`publishingShares`), `budgetMin`/`budgetMax`, `pricingTier`, `contentIdAdmin`, `assetKey`, restricciones territoriales y marcas prohibidas. Esta información es comercialmente sensible y no debe estar pública.
**Solución aplicada:** Se creó `mapPublic()` que devuelve solo los campos necesarios para reproducción y display público (id, title, artist, audioUrl, coverUrl, bpm, key, genres, versions sin assetKey, stems sin assetKey, duración). El handler GET sin autenticación usa `mapPublic()`; solo ADMIN/STAFF reciben `mapDb()` completo.

### 2.7 IMPORTANTE — `downloadToTemp()` sin timeout ni límite de tamaño
**Archivo:** `src/lib/audio/analyze.ts`
**Riesgo:** La descarga del archivo de audio al análisis no tenía AbortSignal ni verificaba Content-Length. Un archivo de varios GB o una URL que nunca responde podía colgar el proceso del servidor indefinidamente, consumiendo memoria y un worker de Node.js.
**Solución aplicada:** Se agrega `AbortSignal.timeout(30_000)` al fetch y se verifica el tamaño antes y después de la descarga. Archivos mayores a 500MB son rechazados con error descriptivo.

### 2.8 IMPORTANTE — Path injection posible en rutas de FFmpeg
**Archivo:** `src/lib/audio/paths.ts`
**Riesgo:** Las variables de entorno `FFMPEG_PATH` y `FFPROBE_PATH`, si contuvieran caracteres especiales de shell (`;`, `|`, `&`, `$`), se pasaban directamente a `child_process.spawn()`. Si un atacante con acceso a configuración de entorno pusiera una ruta maliciosa, podría ejecutar comandos arbitrarios.
**Solución aplicada:** Se agrega `safeEnvPath()` que valida el valor con regex `/^[a-zA-Z0-9/_\-. :\\]+$/`. Valores que no pasen la validación son ignorados con un warning en consola, usando en su lugar el binario del módulo npm.

### 2.9 IMPORTANTE — Cache in-memory sin límite en `audio-check.ts`
**Archivo:** `src/lib/audio/audio-check.ts`
**Riesgo:** La caché de verificación de URLs de audio era un `Map` que crecía sin límite. Con un catálogo grande (miles de tracks, cada uno con URL distinta), el proceso de Node.js podía agotar la memoria del servidor.
**Solución aplicada:** Se agrega `CACHE_MAX_SIZE = 500` y la función `cacheSet()` que aplica evicción FIFO: cuando la caché llega a 500 entradas, elimina la entrada más antigua antes de insertar la nueva.

### 2.10 IMPORTANTE — Sin rate limiting en `/api/catalog/list`
**Archivo:** `src/app/api/catalog/list/route.ts`
**Riesgo:** El endpoint público de catálogo no tenía ningún límite de requests por IP. Un scraper podía iterar sobre todos los filtros posibles para descargar metadatos completos del catálogo, incluyendo waveforms, sin ninguna fricción.
**Solución aplicada:** Se agrega rate limiting in-memory de 60 requests por minuto por IP, usando el helper `getClientIp()` de `src/lib/antibot.ts`. Requests que superan el límite reciben HTTP 429.

---

## 3. Hallazgos pendientes

Estos requieren acción de tu parte o decisiones de infraestructura que no se pueden resolver solo con cambios de código.

### 3.1 ALTO — `CSRF_SECRET` probablemente no está en producción
**Acción requerida:** Verificar que `.env.local` (o las variables de entorno de Vercel/producción) incluyan `CSRF_SECRET` generado con:
```bash
openssl rand -base64 32
```
Sin esta variable, el sistema CSRF en `/api/licensing/request` es trivialmente bypasseable.

### 3.2 ALTO — Sin rate limiting a nivel de infraestructura
**Situación actual:** El rate limiting en formularios públicos (`/api/licensing/request`) usa solo una cookie del navegador, que es trivialmente eliminable por cualquier script automatizado. No hay rate limiting en `/api/contact` ni en `/api/support-tickets`.
**Acción recomendada:** Activar Cloudflare Turnstile (`TURNSTILE_ENABLED=1`) en producción. Alternativamente, configurar rate limiting en el edge de Cloudflare o un middleware de IP con Redis.

### 3.3 MEDIO — Verificación de email desactivada por defecto
**Situación actual:** `AUTH_ENFORCE_VERIFIED_EMAIL=0` en el ejemplo — en producción, usuarios con email no verificado pueden acceder al sistema.
**Acción recomendada:** Activar `AUTH_ENFORCE_VERIFIED_EMAIL=1` antes del lanzamiento.

### 3.4 MEDIO — Cookie legacy `admin_key` permite bypass si `ADMIN_ALLOW_LEGACY=1`
**Situación actual:** Si la variable `ADMIN_ALLOW_LEGACY=1` está activa en producción, la cookie `admin_key` comparada con `ADMIN_ACCESS_KEY` usa comparación directa de strings (timing-safe solo a nivel de middleware Edge, pero el valor en la cookie es texto plano).
**Acción recomendada:** Asegurarse de que `ADMIN_ALLOW_LEGACY` esté desactivado (o ausente) en producción. Este mecanismo es un legado que debe ser eliminado antes del primer release.

### 3.5 BAJO — Sin headers de seguridad HTTP (CSP, HSTS, etc.)
**Situación actual:** No se detectaron headers `Content-Security-Policy`, `X-Frame-Options`, `Permissions-Policy` ni `Strict-Transport-Security` en la configuración de Next.js.
**Archivo a modificar:** `next.config.ts` (o equivalente).
**Acción recomendada:** Agregar headers de seguridad. Next.js permite hacerlo fácilmente en `headers()` dentro de la config.

### 3.6 BAJO — `assetKey` del archivo se devuelve en respuesta de upload sign
**Situación actual:** El endpoint `/api/uploads/sign` devuelve `assetKey` (la ruta interna del objeto en R2) al cliente. Esto es necesario para que el cliente lo envíe al crear el track, pero expone la estructura interna del bucket.
**Evaluación:** Riesgo bajo dado que el endpoint ya requiere autenticación tras el fix 2.1.

---

## 4. Sistema de audio

### 4.1 Estado actual

| Componente | Tecnología | Evaluación |
|---|---|---|
| Almacenamiento | Cloudflare R2 (S3-compat) | Excelente para el contexto |
| Análisis de loudness | FFmpeg EBU R128 + fallback loudnorm | Correcto, estándar de la industria |
| Análisis de formato | ffprobe (duration, sample rate, channels, bitrate) | Completo |
| Waveform | PCM mono 8kHz → 256 puntos Float32 | Funcional, mejorable |
| Playback | Web Audio API (singleton `AudioContext`) | Correcto, SSR-safe |
| Player global | `GlobalPlayerProvider` + bus de eventos | Bien arquitectado |
| BPM | Entrada manual | Ausente en análisis automático |
| Key (tonalidad) | Entrada manual | Ausente en análisis automático |

### 4.2 Formatos de audio soportados

Actualmente el `UPLOAD_ALLOWED_MIME` por defecto incluye:
- `audio/mpeg` (MP3)
- `audio/wav` / `audio/x-wav` (WAV)
- `audio/flac` (FLAC)
- `audio/ogg` (OGG)
- `audio/mp4` (AAC/M4A)

**Formato faltante para producción profesional:**
- `audio/aiff` / `audio/x-aiff` — AIFF es estándar en producción Mac/Pro Tools
- `audio/x-m4a` — alias alternativo de M4A usado por algunas DAWs
- `audio/webm` — útil para preview en navegador

### 4.3 Problemas identificados en el pipeline

**Problema 1 — Waveform a 8kHz es demasiado baja calidad visual**
El downmix a 8kHz reduce la fidelidad del waveform visual. Para uso profesional (plataformas como SoundCloud o Splice usan 1000 puntos de resolución a calidad completa), lo recomendado es:
- Mantener al menos 22kHz para el downmix
- Subir a 1000 puntos mínimo

**Problema 2 — No hay transcoding automático**
Cuando un artista sube un WAV de 300MB, ese archivo queda en R2 como WAV. No existe una etapa de transcoding automático que genere:
- Un MP3 de preview (128-192kbps) para streaming público
- Un archivo normalizado para descarga comercial

Esto es costoso en ancho de banda cuando el usuario del catálogo escucha tracks.

**Problema 3 — BPM y Key son siempre manuales**
Para un catálogo de sync, los metadatos de BPM y tonalidad son fundamentales para los compradores. Actualmente requieren entrada manual, lo que introduce errores y demora.

### 4.4 Recomendaciones para el sistema de audio

1. **Corto plazo:** Aumentar resolución del waveform a 1000 puntos y el sample rate del downmix a 22050Hz (sin costo adicional de cómputo relevante).
2. **Mediano plazo:** Agregar análisis automático de BPM y key usando `essentia.js` (WASM, puede correr en el servidor Node.js sin dependencias adicionales).
3. **Mediano plazo:** Implementar job de transcoding post-upload que genere MP3 de preview desde WAV/FLAC. Puede hacerse con el FFmpeg ya instalado via un worker o action.
4. **Largo plazo:** Evaluar fingerprinting de audio para detección de Content ID (Acoustid/Chromaprint).

---

## 5. Backend y base de datos

### 5.1 Estado del schema (942 líneas, 57 modelos/enums)

El schema está bien estructurado. Los modelos principales son coherentes:
- `Track` con todos los campos de sync licensing
- `TrackTag` como tabla pivot para moods/uses/catalog tags
- `Playlist` / `PlaylistTrack` para el catálogo
- `PublishingShare` / `MasterShare` para derechos
- `TrackVersion` / `TrackStem` para entregables
- `LicensingRequest` con campos comerciales
- `BannerPromotion` / `PromotionSlot` para el sistema de showcase
- Sistema de usuarios con roles y invitaciones

**Observación:** La migración `20260220000000_banner_promotions` fue creada manualmente durante esta sesión para recuperar una migración faltante. Este archivo debe ser tratado como canónico going forward.

### 5.2 Riesgos en queries de base de datos

**Riesgo 1 — `GET /api/tracks` sin paginación estricta cuando no es `view=list`**
El fallback devuelve `findMany` sin `take` limitado cuando `view !== 'list'`. Con un catálogo grande esto puede ser costoso.
**Recomendación:** Aplicar `take: 100` como hard cap en el fallback.

**Riesgo 2 — Campo `waveform` (Bytes) se serializa en respuestas de lista**
El campo `waveform` contiene un Buffer de ~1KB por track. En una lista de 100 tracks son 100KB extra de datos binarios inútiles en listas.
**Recomendado:** Excluir siempre `waveform` de endpoints de lista (incluyendo el caso admin).

### 5.3 Seed actualizado

Durante esta sesión se corrigió `prisma/seed.reset.ts` para:
- Eliminar campos obsoletos `moods`/`uses` que fueron migrados al sistema `TrackTag`
- Crear tags base (moods, uses, categories)
- Crear una playlist principal `isMainCatalog: true`
- Vincular todos los tracks seed a esa playlist

---

## 6. Sistema de archivos y almacenamiento

### 6.1 Cloudflare R2

Configuración correcta con variables de entorno bien separadas. El endpoint usa pre-signed PUT URLs, lo que evita pasar el archivo por el servidor (correcto).

**Punto pendiente:** Las variables R2 (`S3_BUCKET`, `S3_ENDPOINT`, etc.) no están documentadas en `.env.example`. Si alguien clona el repo nuevo, no sabe qué variables de R2 configurar.
**Acción recomendada:** Agregar las variables de R2/S3 al `.env.example`.

### 6.2 Limpieza de archivos temporales

El análisis de audio descarga archivos a `/tmp` y los limpia en el bloque `finally`. Correcto.

### 6.3 Borrado físico de assets

Existe `src/lib/storage/delete-object.ts` para borrar de R2. Se debe verificar que este helper se llame cuando se elimina un track del admin, para evitar archivos huérfanos en el bucket.

---

## 7. API y tRPC

### 7.1 Cobertura de autenticación en rutas API

| Ruta | Auth | Estado |
|---|---|---|
| `POST /api/uploads/sign` | `getRouteUser()` | ✅ Corregido esta sesión |
| `POST /api/admin/requests/bulk-delete` | `getRouteUser()` + rol | ✅ Corregido esta sesión |
| `GET /api/debug/ffmpeg` | `NODE_ENV !== production` | ✅ Corregido esta sesión |
| `GET /api/debug/env-admin` | `NODE_ENV !== production` | ✅ Ya estaba correcto |
| `POST /api/tracks` | `getRequestAuthUser()` | ✅ Correcto |
| `GET /api/tracks` | Público (campos limitados) | ✅ Corregido esta sesión |
| `POST /api/admin/playlists/**` | `getRouteUser()` | ✅ Correcto |
| `POST /api/admin/services/**` | `getRouteUser()` | ✅ Correcto |
| `POST /api/admin/sound-kits/**` | `getRouteUser()` | ✅ Correcto |
| `POST /api/admin/contracts/**` | `getRouteUser()` | ✅ Correcto |
| `POST /api/admin/tickets/**` | `getRouteUser()` | ✅ Correcto |
| `POST /api/admin/showcase/**` | `getRouteUser()` | ✅ Correcto |
| `POST /api/admin/users/invite` | `requireRouteAdmin()` | ✅ Correcto |
| `POST /api/tracks/[id]/analyze` | `getRequestAuthUser()` | ✅ Correcto |
| `POST /api/licensing/request` | Público + CSRF + antibot | ✅ Correcto |
| `POST /api/contact` | Público (sin rate-limit) | ⚠️ Sin rate-limit |
| `POST /api/support-tickets` | Público | ⚠️ Sin rate-limit |
| `GET /api/tracks/[id]` | Público (mapPublic) / Auth (mapDb) | ✅ Corregido esta sesión |
| `POST /api/catalog/list` | Público + rate limit 60 req/min/IP | ✅ Corregido esta sesión |

### 7.2 Middleware de autenticación

El middleware Edge (`src/middleware.ts`) protege correctamente las rutas de browser `/admin/**` y `/creator/**`. Las rutas `/api/**` usan sus propios guards dentro de cada handler — esto es el patrón correcto en Next.js App Router.

**Observación:** Existe código de fallback legacy (`admin_key` cookie) que debe ser desactivado antes de producción (`ADMIN_ALLOW_LEGACY` debe estar ausente o en `0`).

### 7.3 tRPC

El router raíz está en `src/server/api/root.ts`. La configuración de tRPC es correcta para Next.js 15. Las operaciones sensibles deberían usar procedimientos protegidos (`protectedProcedure`), verificar que ningún router público exponga mutaciones sin autenticación.

---

## 8. Catálogo y datos públicos

### 8.1 Flujo del catálogo

El catálogo público requiere una `Playlist` con `isMainCatalog: true`. Si esta playlist no existe, `/catalog` lanza un error de Prisma. Se resolvió durante la configuración de la nueva base de datos creando esa playlist en el seed.

**Recomendación:** Agregar un fallback graceful en `getMainCatalogPlaylist()` que devuelva una lista vacía en lugar de lanzar error cuando no hay playlist principal configurada.

### 8.2 API pública de catálogo

`GET /api/catalog/list` devuelve solo campos públicos (sin presupuesto, sin keys de asset, sin datos internos). Correcto.

---

## 9. Propuestas de funcionalidad

Estas propuestas podrían hacer la plataforma más competitiva y profesional a corto-mediano plazo:

### 9.1 Audio Player público mejorado (ALTO IMPACTO)
- Waveform interactiva donde el usuario puede hacer clic para navegar el track
- Marcadores de tiempo configurables por el artista (intro, drop, build)
- Preview limitado (ej. primeros 60 segundos) con watermark de audio para tracks no comprados
- Fade in/out suave al cambiar entre tracks

### 9.2 Comparador de licencias (ALTO IMPACTO para sync)
- Vista lado a lado de hasta 3 licencias del mismo track
- Resaltado de diferencias entre licencias (qué incluye cada una que la otra no)
- CTA directo de compra por licencia
- Actualmente hay modal de licencias pero no comparador visual

### 9.3 Búsqueda por características de audio (ALTO IMPACTO)
- Filtro por rango de BPM (ej. "entre 120-140 BPM")
- Filtro por tonalidad (ej. "en Do menor")
- Filtro por duración (corto/medio/largo)
- Estos filtros ya tienen campos en la DB, solo falta conectar el UI y los queries

### 9.4 Página de artista (`/artist/[slug]`)
- Ya existe el plan `039-artist-page.md`
- Vista de todos los tracks del artista con su bio, foto y stats
- Diferenciador importante frente a BeatStars que no tiene páginas de artista curadas

### 9.5 Embedding público de playlists
- Ya existe `embedEnabled` en el modelo `Playlist`
- Implementar un iframe embebible de playlist/catálogo para que clientes puedan incrustar el catálogo en sus propias webs
- Modelo de negocio: white-label para supervisores de música

### 9.6 Sistema de favoritos para compradores
- Permitir a usuarios (rol `CLIENT`) guardar tracks favoritos
- Lista de wishlist accesible desde su cuenta
- Comparar favoritos antes de decidir compra
- Requiere modelo `UserFavoriteTrack` simple en Prisma

### 9.7 Notificaciones al artista cuando llega una solicitud
- Cuando se crea un `LicensingRequest`, notificar al `ownerUserId` del track
- Actualmente solo existe webhook opcional (LICENSING_WEBHOOK_URL) y sync a Sheets
- Implementar email transaccional directo (ya existe Brevo configurado)

### 9.8 Panel de analytics básico para el artista
- Qué tracks recibieron solicitudes de licencia
- Cuántas veces se reproduce cada track (requiere contador de plays)
- Tendencias de uso por categoría (moods/uses más solicitados)
- Ingresos proyectados por solicitudes activas

### 9.9 Transcoding automático post-upload
- Al subir un WAV/FLAC, generar automáticamente un MP3 a 192kbps para streaming
- Guardar ambas versiones en R2 (original + streaming)
- Usar FFmpeg (ya disponible en el servidor)
- Esto reduce dramáticamente el ancho de banda del catálogo

### 9.10 Certificados de licencia
- Al completar una compra, generar un PDF de certificado de licencia
- Incluye: track, licencia comprada, usos permitidos, territorios, período, partes
- Esto da credibilidad legal y profesionalismo frente a competidores

---

## 10. Hoja de ruta

### Corto plazo (antes de producción — obligatorio)

- [ ] Configurar `CSRF_SECRET` en variables de entorno de producción
- [ ] Activar `TURNSTILE_ENABLED=1` en producción
- [ ] Activar `AUTH_ENFORCE_VERIFIED_EMAIL=1`
- [ ] Desactivar `ADMIN_ALLOW_LEGACY` (asegurar que no esté en `.env` de prod)
- [ ] Agregar headers de seguridad HTTP en `next.config.ts` (CSP, X-Frame-Options, etc.)
- [ ] Agregar variables R2/S3 al `.env.example`
- [ ] Fallback graceful en `getMainCatalogPlaylist()` para catálogo vacío
- [ ] Completar el staging checklist en `PROJECT_GENERAL_CONTEXT.md`

### Corto plazo (mejoras sin bloquear producción)

- [ ] Aumentar waveform a 1000 puntos / 22kHz downmix
- [ ] Agregar `audio/aiff` al `UPLOAD_ALLOWED_MIME`
- [ ] Excluir campo `waveform` de endpoints de lista (Bytes innecesarios)
- [ ] Hard cap `take: 100` en `GET /api/tracks` fallback

### Mediano plazo (Q3 2026)

- [ ] Análisis automático de BPM y Key (essentia.js o similar)
- [ ] Comparador visual de licencias en `/track/[id]`
- [ ] Filtros por BPM/key/duración en `/catalog`
- [ ] Sistema de favoritos para compradores (modelo + UI)
- [ ] Notificaciones por email al artista en nuevas solicitudes

### Largo plazo (Q4 2026 / post-pagos)

- [ ] Transcoding automático post-upload (MP3 de preview desde WAV/FLAC)
- [ ] Página de artista (`/artist/[slug]`)
- [ ] Panel de analytics básico
- [ ] Embed público de playlist
- [ ] Certificados PDF de licencia post-compra

---

*Documento generado automáticamente durante auditoría de seguridad y arquitectura.*
*Próxima auditoría recomendada: antes del primer release a producción.*
