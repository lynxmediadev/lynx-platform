# Matriz de variables de entorno

Nunca copies valores reales a este documento. `NEXT_PUBLIC_*` llega al navegador; el resto permanece en servidor, scripts o worker.

| Variable | Consumidor | Visibilidad | Requisito | Servicio / propósito |
|---|---|---|---|---|
| `DATABASE_URL` | Web, worker, scripts | Secreta | Obligatoria | Supabase Postgres pooler en runtime. |
| `DIRECT_URL` | Migraciones Prisma | Secreta | Obligatoria para migrar | Supabase Postgres directo. |
| `APP_BASE_URL` | Web, scripts auth | Servidor | Obligatoria fuera de local | Links de email, invitaciones y callbacks. |
| `APP_URL` | Web SSR | Servidor | Recomendada en producción | Origen absoluto de la aplicación. |
| `PORT`, `HOSTNAME`, `NODE_ENV` | Web | Servidor | Proveedor | Runtime Node/Docker. |
| `AUTH_MODE` | Web | Servidor | Obligatoria | `legacy`, `hybrid` o `supabase`. |
| `AUTH_SESSION_SECRET`, `ADMIN_SESSION_SECRET` | Web | Secreta | Legacy/hybrid | Cookies de sesión. |
| `ADMIN_ACCESS_KEY`, `ADMIN_PASS`, `ADMIN_ALLOW_LEGACY`, `ADMIN_BIND_UA` | Web | Secreta/config | Solo rollback legacy | No usar como auth pública nueva. |
| `CSRF_SECRET` | Web | Secreta | Obligatoria en producción | Firma CSRF de formularios públicos. |
| `NEXT_PUBLIC_SUPABASE_URL` | Web, navegador, scripts | Pública | Supabase auth | URL del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Web, navegador, scripts | Pública | Supabase auth | Publishable/anon key, nunca service role. |
| `SUPABASE_SERVICE_ROLE_KEY` | Web server, scripts admin | Secreta | Solo acciones administrativas | Nunca usar en cliente. |
| `AUTH_BOOTSTRAP_ADMIN_EMAIL`, `AUTH_BOOTSTRAP_ADMIN_PASSWORD` | Scripts | Secreta | Bootstrap puntual | No necesarios en web normal. |
| `AUTH_EMAIL_PROVIDER`, `AUTH_EMAIL_FROM`, `AUTH_EMAIL_DEBUG_LINKS`, `AUTH_ENFORCE_VERIFIED_EMAIL` | Web | Servidor | Auth/email | Configuración de correo. |
| `BREVO_API_KEY` | Web server | Secreta | Si Brevo está activo | Email transaccional. |
| `TURNSTILE_ENABLED`, `TURNSTILE_SECRET_KEY` | Web server | Secreta/config | Si se activa | Verificación Cloudflare Turnstile. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Navegador, web | Pública | Si se activa | Site key de Turnstile. |
| `R2_ACCOUNT_ID`, `R2_ENDPOINT`, `R2_REGION` | Web, worker | Servidor | R2 | Identificación/conexión S3-compatible. |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Web, worker | Secreta | R2 | Token limitado a los dos buckets. |
| `R2_PREVIEWS_BUCKET`, `R2_PRIVATE_BUCKET`, `R2_PUBLIC_PREVIEW_URL` | Web, worker | Servidor/config | R2 | Buckets lógico-público/privado y URL de previews. |
| `ASSET_UPLOAD_SIGNING_SECRET` | Web | Secreta | Upload firmado | Firma claims de subida. |
| `UPLOAD_MAX_PREVIEW_MB`, `UPLOAD_MAX_PRIVATE_MB`, `UPLOAD_ALLOWED_MIME` | Web | Servidor/config | Upload | Límites de ingest. |
| `AUDIO_PROCESSING_MODE`, `AUDIO_WORKER_POLL_MS`, `FFMPEG_PATH`, `FFPROBE_PATH` | Worker; `MODE` también web | Servidor | Worker | Cola, polling y binarios. No entregar al contenedor web salvo `MODE` si se requiere. |
| `S3_*` legacy | Web/scripts | Secreta/config | Solo dual-read rollback | Retirar en Fase 5, no usar para assets nuevos. |
| `GOOGLE_SCRIPT_URL`, `GOOGLE_SCRIPT_TOKEN`, `LICENSING_*` | Web server | URL/secret | Integraciones opcionales | Webhooks/Google Apps Script. |
| `CATALOG_USE_LEGACY`, `DB_OPTIONAL`, `DEBUG_*` | Web | Servidor | Solo desarrollo/diagnóstico | No activar en producción sin revisión. |
| `INVITE_*`, `SMOKE_*`, `BULK_COUNT`, `RESET_CONFIRM`, `ENV_FILE` | Scripts | Secreta/config | Puntual | No deben formar parte del runtime web/worker. |

## Distribución por proceso

- **Web:** DB runtime, auth, Supabase pública/service-role cuando una ruta administrativa lo requiera, R2 para firma/lectura privada, upload limits, Turnstile, Brevo, URLs de aplicación e integraciones activas.
- **Worker:** DB runtime, R2, `AUDIO_*`, FFmpeg/FFprobe. No necesita Turnstile, Brevo, claves de sesión, service-role ni secretos de upload.
- **Migración única:** `DIRECT_URL` más las variables que Prisma necesite. Nunca incluirla en logs.

En un deploy futuro crea conjuntos de variables separados para web y worker. `.env.local` es solo una comodidad local y nunca debe subirse ni copiarse a una imagen.
