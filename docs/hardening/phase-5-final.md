# FASE 5 — Cierre del hardening actual

Fecha de ejecución: 2026-09-07. Esta es la fase final del plan vigente; no se inició una fase posterior, no hubo despliegue y no se activó ningún servicio o plan pagado.

## Resultado fácil

- La web ya no puede ejecutar FFmpeg: toda solicitud de análisis crea/reutiliza un `AudioJob` y responde `202`.
- El worker separado conserva FFmpeg/FFprobe, retries, lease, idempotencia y salida `READY`.
- Se añadieron reconciliadores locales para R2 y AudioJob. Ambos empiezan en dry-run y requieren una confirmación explícita para cambiar estado.
- Se endureció CSRF a un mínimo de 32 caracteres en producción y se evitó exponer errores internos de enqueue.
- Se protegió la descarga pública ante combinaciones inconsistentes de bucket/acceso.
- No se borró ningún objeto R2, usuario, sesión, token, track, asset o job.
- Auth legacy y storage dual-read se mantienen por evidencia objetiva de consumidores y datos aún no migrados.

## Arquitectura real al cierre

```text
Navegador
  -> Next.js standalone / Node, host-agnostic
       -> Supabase Auth (identidad y sesión para cuentas enlazadas)
       -> Prisma -> Supabase PostgreSQL (perfiles, roles, catálogo, AudioJob)
       -> R2 lynx-previews (público)
       -> R2 lynx-private-assets (privado; GET firmado autorizado)

POST análisis/upload complete -> AudioJob PostgreSQL -> 202
Audio worker separado -> FFmpeg/FFprobe -> Track + TrackAsset + R2 -> READY

Turnstile -> anti-bot cuando se habilita
Brevo -> SMTP/email transaccional
```

La compatibilidad auth legacy y el dual-read de storage están deprecados, pero siguen activos temporalmente. No son la arquitectura objetivo.

## Checkpoint y backup

- Tag anotado: `checkpoint/pre-phase-5-2026-09-07`, apunta a `5496987`.
- Dump: `/home/legion/dev/odr/.backups/lynx-platform/lynx-platform-pre-phase5-20260907-103203.dump`.
- Fecha: 2026-09-07 10:32:03, zona America/Santiago.
- Tamaño: 925858 bytes.
- SHA-256: `5e7616293719be86f5f5631b6e62bec67b4f155352e57d43bc8f9ae2aa78d4a3`.
- Permisos: `600` para dump y checksum.
- Verificación: checksum correcto; `pg_restore --list` leyó 507 entradas con cliente PostgreSQL 17.11 contra servidor 17.4.
- Alcance: schemas `public` y `auth`, formato custom, sin owner ni privileges.

El dump permanece fuera del repositorio. El procedimiento reproducible está en [backup-restore.md](../operations/backup-restore.md).

## Inventario y decisiones de retiro legacy

### Auth

Inventario previo: 38 perfiles Prisma; 28 `ACTIVE`, 7 `INVITED`, 3 `SUSPENDED`; roles 5 ADMIN, 16 STAFF, 15 CREATOR y 2 CLIENT. Solo 1 perfil está enlazado a Supabase Auth. `info@lynxmedia.cl` está `ACTIVE`, es `ADMIN`, tiene mapping válido y ya no conserva hash legacy. Persisten 37 `passwordHash`, 70 sesiones, 2 reset tokens, 64 verification tokens y 33 invite tokens legacy.

La integración y pruebas automatizadas cubren Supabase SSR/cookies, roles, suspendidos, callback, reset e invitación; además el flujo de email, recovery y login del administrador fue validado manualmente en Fase 1. Esto no demuestra una ventana estable para los otros 37 perfiles.

**Decisión:** `BLOCKED — requires stable window / manual approval`. Se mantienen `AUTH_MODE=legacy|hybrid|supabase`, hashes, cookies, sesiones, tokens, rutas y helpers compatibles. Antes de retirar: clasificar cuentas reales/fixtures, enlazar todas las reales, mantener `AUTH_MODE=supabase` durante una ventana acordada y repetir backup + pruebas.

### Storage

Inventario previo: 11 tracks y 3 `TrackAsset` verificados (2 PREVIEW/PUBLIC y 1 MASTER/PRIVATE). Diez tracks no tienen `TrackAsset`; diez usan `audioUrl`/`assetKey`, incluyendo diez fixtures `external://`. Catálogo, playlists y reproductor todavía consumen `resolvePublicTrackAudio` con fallback.

Clasificación:

- `MIGRATED`: los 3 assets canónicos verificados.
- `FIXTURE/TEST`: 10 referencias `external://`; siguen siendo visibles y no son objetos R2 migrables.
- `STILL REQUIRED`: fallback `audioUrl`/`assetKey` para 10 tracks sin cobertura canónica completa.
- `UNKNOWN`: cualquier objeto legacy fuera de estos inventarios debe revisarse manualmente; el reconciliador nunca lo borra.

**Decisión:** `BLOCKED — requires stable window / manual approval`. No se retiraron dual-read, columnas ni aliases `S3_*`; no hubo migration destructiva.

### Audio sync

El E2E de Fase 3 ya probó MASTER privado -> worker -> preview público -> `READY`. En Fase 5 se eliminaron el branch `AUDIO_PROCESSING_MODE=sync`, `src/lib/audio/analyze.ts`, el helper FFmpeg web sin consumidores y la variable de ejemplo. `next.config.js` ya no necesita excepciones FFmpeg. La ruta HTTP importa únicamente cola/Prisma/auth y responde `202`; el worker conserva los binarios y procesamiento.

## R2 staging y cleanup

Comando seguro:

```bash
npm run maintenance:r2 -- --dry-run
```

Política: TTL 24 horas; protege objetos recientes, cualquier referencia DB y todo asset `VERIFIED`; `legacy-previews/` es siempre `review-only`. Pagina ambos buckets y vuelve a consultar DB/HEAD justo antes de una eventual eliminación. Aplicar exige `--apply --confirm DELETE_ABANDONED_PENDING` y aprobación manual posterior.

Dry-run real del 2026-09-07: 1 objeto inspeccionado, 0 candidatos, 1 protegido, 0 eliminados. Es un PREVIEW bajo `pending/`, de 446400 bytes, enlazado en DB y `VERIFIED`; debe conservarse. No había objetos `legacy-previews/` visibles con estas credenciales/prefixes. No se ejecutó `--apply`.

## AudioJob cleanup y reconciliación

```bash
npm run maintenance:audio-jobs -- --dry-run
```

Detecta `PENDING` de más de 24 h, `PROCESSING` con lease superior a 10 min, `READY` sin preview, `FAILED` agotados y mappings TrackAsset incompatibles. Propone retención de `READY` tras 30 días y `FAILED` tras 90; nunca poda jobs activos. `--apply --confirm MAINTAIN_AUDIO_JOBS` recupera leases con la lógica existente y poda solo IDs revalidados en estados terminales.

Dry-run real: 1 job total, estado `READY`; 0 hallazgos, 0 leases a recuperar, 0 candidatos de poda y 0 inconsistencias de política de assets. No se ejecutó `--apply`.

## Security review

- Auth y autorización: rutas sensibles consultan usuario/rol Prisma en servidor; las pruebas de contrato cubren rechazo de suspendidos y guardas administrativas. El modo legacy queda explícitamente deprecado, no eliminado.
- IDOR/private download: el asset se busca por `trackId + assetId`; owner/ADMIN/STAFF se determina en servidor; no autenticado recibe 401 y ajeno 403.
- Upload: key aleatoria generada en servidor, claim HMAC con expiración, MIME/tamaño limitados, `HEAD` contra tamaño/MIME firmado, `If-None-Match: *` y rechazo de traversal.
- Signed URLs: GET/PUT de 60 s; no se guardan en DB ni logs. R2 credentials y service-role no tienen prefijo `NEXT_PUBLIC_`.
- Descarga pública: ahora rechaza un asset PUBLIC fuera de PREVIEWS y falla con 501 si falta base URL, en vez de formar una URL inválida.
- Errores: enqueue ya no devuelve mensajes internos/stack al cliente; el worker sanitiza URLs y limita errores persistidos a 500 caracteres.
- CSRF: producción falla si falta un secreto de al menos 32 caracteres; el fallback inseguro existe solo en desarrollo y emite warning.
- Callback: `next` exige ruta relativa y rechaza `//`; el destino final se restringe por rol en login. Cookies de auth son gestionadas en servidor.
- Rate limiting: persistente en PostgreSQL por fingerprint hash. Turnstile es opcional localmente y debe habilitarse al exponer formularios públicamente.
- Base de datos: `anon` y `authenticated` tienen 0 grants en tablas `public`, sin `USAGE` ni `CREATE` en el schema; Prisma opera con su conexión de servidor.
- Healthcheck: no consulta DB ni expone configuración; devuelve estado/timestamp con `no-store`.
- Escaneo de código versionado: no encontró valores secretos; `.env.local` continúa ignorado y no fue leído hacia logs.

## Dependencias y audit

`npm audit` informa 3 `high`, todas derivadas de una sola cadena: `prisma@6.19.3` -> `@prisma/config@6.19.3` -> `deepmerge-ts@7.1.5`. El advisory [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx) afecta `<8.0.0` por recursión con grafos circulares.

En LYNX el consumidor está en carga/merge de `prisma.config.ts`, controlado por el operador durante build/migrations, no en datos de requests. `npm audit` propone Prisma 6.12.0 (downgrade) y el parche real de `deepmerge-ts` exige 8.x; el issue upstream de Prisma advierte que 8.x contiene cambios de comportamiento. No se aplicó override mayor, downgrade ni `npm audit fix --force`. Riesgo residual: disponibilidad del proceso CLI si un operador introduce configuración circular. Acción: vigilar una versión Prisma que adopte 8.x y actualizar juntos `prisma`/`@prisma/client` después de check, tests, build y migration status.

## Migraciones y código retirado

No se creó ni aplicó migration: todos los `DROP` quedaron bloqueados por datos/consumidores reales. Se retiraron solamente código sin consumidores o con reemplazo comprobado:

- branch/flag sync de audio y el analizador pesado ejecutable desde web;
- configuración FFmpeg del build standalone web;
- helper FFmpeg sin imports y declaraciones de módulos ya innecesarias;
- script T3 de PostgreSQL Docker local, sin consumidores y ajeno a Supabase;
- botones legacy que prometían normalización síncrona no implementada.

Las dependencias `ffmpeg-static` y `ffprobe-static` permanecen porque el worker local las usa como fallback cuando no se definen rutas de sistema. No entran al standalone web.

## Validación ejecutada

- `git diff --check`: OK.
- `npm run check`: OK, ESLint + TypeScript.
- `npm test`: 73/73 pruebas correctas en 12 archivos.
- `npm run test:contract`: contrato público correcto; 2 casos autenticados omitidos porque no se entregó `CONTRACT_COOKIE`.
- `npm run build`: OK, Next.js 16.3.4, 64 páginas estáticas y rutas dinámicas compiladas.
- `.next/standalone`: 160 MB; búsqueda física sin archivos con nombre FFmpeg/FFprobe.
- `npx prisma validate`: schema válido.
- `npx prisma migrate status`: 36 migraciones, base actualizada.
- `npm audit`: 3 high/0 critical, decisión documentada arriba.
- Guards de maintenance: ambos `--apply` sin frase de confirmación fallan antes de leer/borrar objetos o modificar jobs.
- Docker: `NO EJECUTADO — Docker no instalado`.

## Costos y umbrales

| Componente | Costo inicial | Free tier / restricción | Umbral para evaluar pago | Alternativa gratuita |
|---|---:|---|---|---|
| Supabase | USD 0 | Free: DB/egress/proyectos limitados, pausa por inactividad y sin backup administrado | 80% de DB/egress, necesidad de uptime continuo o backup administrado; Pro aprox. USD 25/mes | backup lógico local + reactivación manual |
| Cloudflare R2 | USD 0 | 10 GB Standard y cuotas mensuales de operaciones compartidas por cuenta; excesos se cobran | 8 GB o 80% de operaciones; sobre free aprox. USD 0,015/GB-mes más operaciones | limpiar staging tras dry-run y conservar dos buckets actuales |
| Turnstile | USD 0 | Free suficiente para uso pequeño/mediano; analítica/SLA limitados | SLA, controles enterprise o límites de hostnames | free actual |
| Brevo | USD 0 | 300 emails/día, no acumulables | superar 300/día de forma sostenida; Starter desde aprox. USD 9/mes | limitar envíos y mantener Free |
| Worker | USD 0 | funciona solo con el PC encendido | backlog >20, >10 jobs/día, necesidad 24/7 o >2 h/semana de operación; hosting desde aprox. USD 5/mes sujeto a revisión | worker local/Docker existente |
| Web | USD 0 | local/Wi-Fi, sin SLA ni acceso público estable | lanzamiento comercial, usuarios externos/HTTPS/uptime medidos; comparar host Node/Docker o Vercel Pro aprox. USD 20/usuario/mes | web local e infraestructura ya existente |

No se agregó SaaS, Redis, cola externa ni observabilidad paga. Los límites/precios deben volver a verificarse al momento de contratar.

## Antes de producción (P0/P1)

### P0

1. Probar `Dockerfile.web` y `Dockerfile.audio-worker` con Docker real; hoy: `NO EJECUTADO — Docker no instalado`.
2. Configurar `CSRF_SECRET` aleatorio de 32+ caracteres, HTTPS, `APP_URL`/`APP_BASE_URL`, redirects Supabase y Turnstile público.
3. Completar clasificación/enlace Supabase de cuentas reales; mantener ventana estable antes de retirar auth legacy.
4. Migrar o retirar conscientemente los 10 tracks legacy/fixtures antes de quitar dual-read.

### P1

1. Separar variables de web/worker/migration en cualquier host futuro y usar credenciales de mínimo privilegio.
2. Probar restore en PostgreSQL aislado y ejecutar smoke test completo de auth, upload, download y AudioJob.
3. Vigilar advisory Prisma/deepmerge y Node 22 antes del cambio de soporte anunciado por AWS SDK.
4. Ejecutar periódicamente ambos maintenance dry-runs; revisar candidatos antes de cualquier apply.

## Rollback

- Código: tag `checkpoint/pre-phase-5-2026-09-07` o commit previo `5496987`.
- Datos: dump verificado arriba. No hubo cambios de schema ni eliminación de datos en esta fase.
- Audio: si el worker presenta un problema, detenerlo conserva los jobs; reparar/reintentar. No volver a ejecutar FFmpeg dentro de requests HTTP.
- Auth/storage: las capas legacy conservadas siguen siendo el rollback temporal mientras se completa la migración segura.
