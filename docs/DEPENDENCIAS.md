# DEPENDENCIAS DEL PROYECTO

Objetivo: checklist tecnico para preparar PC1 y poder continuar el desarrollo sin bloqueos.

## Requisitos base (sistema)
- Node.js 20 LTS (recomendado via nvm).
- npm 10.x (incluido con Node).
- Git.
- (Windows) WSL2 recomendado para rutas y tooling Linux.

## Instalacion del proyecto
1) Clonar repo y cambiar a rama `codex1`.
2) Instalar dependencias: `npm ci`.
3) Prisma genera clientes en `postinstall`, pero si cambias el schema: `npx prisma generate`.

## Variables de entorno requeridas
Crear `.env.local` usando `.env.example` como base y completar:

### Base de datos (Supabase/Postgres)
- `DATABASE_URL` (conexion principal).
- `DIRECT_URL` (para migraciones, si se usa `prisma migrate`).

### Admin
- `ADMIN_ACCESS_KEY` o `ADMIN_PASS`.
- `ADMIN_SESSION_SECRET`.
- `ADMIN_BIND_UA` (opcional).

### Storage (R2/S3 compatible)
- `S3_BUCKET`
- `S3_ENDPOINT`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_PUBLIC_BASE_URL`
- `S3_REGION` (opcional; default "auto")
- `S3_FORCE_PATH_STYLE` (opcional)
- `UPLOAD_MAX_MB` (opcional)
- `UPLOAD_ALLOWED_MIME` (opcional)

### URL base (server-side fetch)
- `NEXT_PUBLIC_APP_URL` (recomendado en prod)
- `APP_URL` o `URL` (alternativas)
- `PORT` (opcional)

## Audio / analisis (FFmpeg)
- El proyecto usa `ffmpeg-static` y `ffprobe-static` (ya vienen en `node_modules`).
- Opcional: setear rutas fijas si lo necesitas:
  - `FFMPEG_PATH`
  - `FFPROBE_PATH`

## Integraciones opcionales
- `GOOGLE_SCRIPT_URL`
- `GOOGLE_SCRIPT_TOKEN`

## Comandos utiles
- Dev: `npm run dev`
- Build: `npm run build`
- Prisma: `npx prisma generate`, `npm run db:migrate`
- Seeds: `npm run db:seed`, `npm run db:seed:reset`, `npm run db:seed:bulk`

## Verificacion rapida
- `npm run dev`
- Abrir `/admin/tracks` y `/admin/track/[id]/edit`.
- Probar "Analizar" con un audio real (no dummy).

## Notas específicas Mix/Master (/servicios/mix)
- Precios y moneda (client): edita `BASE_PRICE_CLP`, `TRACK_PRICE_CLP`, `MAX_TRACKS` y `currencyFactors` en `src/app/servicios/mix/MixFormClient.tsx` (sección de constantes al inicio).
- API `/api/services/mix` valida:
  - Single: tracks 12–99, vocalTracks 0–10, add-ons booleanos.
  - Álbum: songs >= 1.
  - Throttle anti-spam: 3 solicitudes por email/minuto.
  - `deadlineAt` placeholder se setea cuando timeline de álbum incluye “mes” (priorización básica).
- Pago en línea: placeholder `paymentIntentId` en el payload (aún inactivo).
