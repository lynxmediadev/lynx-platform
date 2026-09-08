# LYNX Platform — Contexto operativo para IA

Actualizado el 2026-09-08. Este documento describe el estado que debe asumir cualquier agente antes de proponer o modificar código.

## Producto y límites actuales

LYNX/ODR Records es un catálogo musical para sync licensing: permite explorar y escuchar previews públicos, administrar un catálogo profesional y recibir solicitudes de licencia. También contempla servicios de audio y merchandising futuro, pero el foco actual es el catálogo de tracks.

- Aplicación: Next.js 16 App Router + TypeScript + Tailwind 4.
- Datos, perfiles, roles y relaciones: PostgreSQL en Supabase mediante Prisma.
- Identidad: Supabase Auth; Prisma conserva el perfil, estado y autorización.
- Audio: Cloudflare R2. `lynx-previews` contiene previews públicos; `lynx-private-assets` contiene masters, stems, alternates y entregables privados.
- Desarrollo local: WSL, `npm run dev`, puerto `3000`.
- Principio de costo: USD 0/mes durante esta etapa. No contratar ni activar un SaaS/plan de pago sin aprobación explícita, costos, límites free tier y umbral medible.

## Seguridad y reglas no negociables

- Nunca imprimir, copiar ni subir valores de `.env.local`, claves R2, URLs de base, tokens o secretos. Documentar solo nombres de variables.
- No exponer masters/stems/entregables privados a usuarios públicos.
- R2 privado solo se entrega mediante URL firmada corta generada por servidor después de autorización.
- `ADMIN` y `STAFF` administran assets. Visitantes públicos solo escuchan previews públicos.
- No borrar objetos R2, datos ni migraciones existentes sin una instrucción explícita y una estrategia de rollback.
- Usar `apply_patch` para cambios de archivos. Antes de afirmar publicación en GitHub: comprobar `git status`, checks, commit y resultado de `git push`.

## Fases de hardening completadas

### Fase 0 — Checkpoint y línea base

- Se creó checkpoint previo al hardening y documentación de baseline/backup.
- El respaldo lógico de Supabase es local y externo al repositorio. Supabase Free no aporta backup automático.
- No se depende de infraestructura pagada para desarrollo.

### Fase 1 — Auth de Supabase

- Supabase Auth administra contraseña, identidad y sesión; Prisma autoriza por rol y estado (`ACTIVE`).
- Compatibilidad temporal con `AUTH_MODE=legacy|hybrid|supabase`.
- Existe provisioning idempotente: `npm run auth:provision-supabase -- --apply --email "EMAIL"`.
- La service role nunca debe llegar al cliente. Brevo es SMTP inicial dentro de Free tier.

### Fase 2 — Separación segura de assets en R2

- `TrackAsset` es la fuente de verdad de storage; el sistema mantiene dual-read con columnas legacy para rollback.
- `PREVIEW` usa bucket `PREVIEWS` y acceso `PUBLIC`; `MASTER`, `STEM`, `ALTERNATE` y `DELIVERABLE` usan bucket `PRIVATE` y acceso `PRIVATE`.
- `/api/uploads/sign` valida rol/track/MIME/tamaño, crea una key de servidor y firma PUT a R2.
- `/api/uploads/complete` hace HEAD de verificación antes de persistir el asset.

### Fase 3 — Cola durable y worker local

- `AudioJob` vive en PostgreSQL; la web encola y responde sin ejecutar FFmpeg.
- Worker local: `npm run worker:audio` (continuo) o `npm run worker:audio:once` (un job).
- El worker usa FFmpeg/FFprobe, analiza audio, genera waveform y puede crear preview desde master. No requiere puertos entrantes.
- Si el computador está apagado, los jobs quedan pendientes: es la limitación aceptada para mantener costo cero.

### Fase 4 — Portabilidad

- Web y worker son dockerizables/portables; no hay despliegue productivo en Vercel, Railway ni otro hosting.
- Desarrollo/beta sigue local y por Wi-Fi. No asumir Vercel Hobby para uso comercial.

### Fase 5 — Limpieza y mantenimiento

- Se retiró el procesamiento síncrono legado: el worker es el único proceso que usa FFmpeg.
- Hay mantenimiento de R2 y de audio jobs mediante dry-run primero.
- Comandos: `npm run maintenance:r2` y `npm run maintenance:audio-jobs`; no usar `--apply` sin revisar el resultado.

## Flujos implementados después del último checkpoint anterior

### Ingesta y gestión de archivos

- `/admin/uploads` ahora es **Nuevo track**: título, artista y preview público. Ya no tiene selector global de “archivo privado”.
- Tras crear el track, redirige a `/admin/tracks/[id]/edit/assets`.
- Puede crearse un borrador excepcional sin preview; `Track.isDraft` evita que aparezca en catálogo hasta tener preview vigente.
- El módulo **Archivos** concentra preview, master, stems, versiones alternativas y entregables físicos.
- Un track mantiene un master vigente y su historial. El primer master queda vigente; los posteriores se conservan hasta usar “Marcar vigente”.
- Un preview nuevo reemplaza deliberadamente al preview vigente; un master nunca pisa un preview curado. Si no hay preview, el worker puede generar uno técnico desde el master vigente.
- Al subir un stem físico, se crea el registro comercial `TrackStem` solo si no existe otro con el mismo nombre; no sobrescribe su metadata manual.
- Migración aplicada: `20260907110000_track_asset_editor` agrega `Track.isDraft` y a `TrackAsset` nombre original, etiqueta e indicador `isCurrent`.

### Editor de un track

El editor quedó reducido a cuatro áreas visibles:

1. **Ficha** (`/edit/creative`): título, artista, BPM, tonalidad, tipo, géneros, subgéneros, moods, usos y categorías.
2. **Archivos** (`/edit/assets`): assets reales en R2, historial y cargas privadas/públicas.
3. **Comercial** (`/edit/metadata`): identificadores, licencias, precios, territorios, restricciones y formatos ofrecidos.
4. **Derechos** (`/edit/rights`): writers, publishers, titulares master, MFN, one-stop y Content ID.

- Las rutas legacy `/edit`, `/edit/deliverables` y `/edit/review` redirigen a las áreas nuevas; los datos anteriores no se borraron.
- Se eliminó la edición por sintaxis de texto de Entregables. Los formatos comerciales se seleccionan explícitamente: MP3, WAV, Stems, Trackouts, Instrumental, Alt Mix y Cutdowns.
- Migración aplicada: `20260908093000_track_delivery_formats` agrega `Track.deliveryFormats`.
- La UI debe mantener densidad razonable: grillas y cards compactas; evitar campos de ancho completo si su contenido no lo justifica.

### Ficha pública y descargas de prueba

- Ruta pública canónica: `/track/[id]`; catálogo: `/catalog`.
- Preview es público y reproducible; assets privados siguen protegidos.
- Existe un panel flotante centrado sobre el player: **Descargas de prueba**.
- Solo se renderiza para una sesión `ADMIN` o `STAFF`; no se entrega HTML ni controles a visitantes públicos.
- Cada asset verificado tiene Play/Pause y Download. Play usa una URL autorizada; Download usa `Content-Disposition: attachment` y abre en otra pestaña si el navegador no descarga directamente. Nunca navega la ficha actual fuera del track.
- Algunos formatos (por ejemplo FLAC/AIFF según navegador) pueden no reproducirse, pero deben seguir descargando.

## Estado comercial: deliberadamente pendiente

No existe aún checkout, pagos, órdenes, entitlements de compradores ni portal “Mis compras”. Por lo tanto:

- Un visitante público **no** puede descargar master/stems/entregables.
- La ruta de descarga privada autoriza solamente owner, ADMIN o STAFF.
- El panel de descargas público es una herramienta temporal de QA administrativa, no una función de venta.
- Antes de construir pagos, se deben definir licencia → formatos/assets permitidos, órdenes, confirmación por webhook y permisos de descarga. No avanzar allí sin una instrucción nueva.

## Operación y validación

Variables relevantes (sin valores): `DATABASE_URL`, `DIRECT_URL`, `AUTH_MODE`, Supabase URL/publishable key/service role, credenciales R2, `R2_PREVIEWS_BUCKET`, `R2_PRIVATE_BUCKET`, `R2_PUBLIC_PREVIEW_URL`, `ASSET_UPLOAD_SIGNING_SECRET`, `FFMPEG_PATH`, `FFPROBE_PATH`.

Comandos de trabajo:

```bash
npm run dev
npm run worker:audio
npm run worker:audio:once
npm run check
npm test
npm run build
npm run db:migrate
```

- Reiniciar `npm run dev` después de regenerar Prisma o aplicar migraciones si el proceso de desarrollo estaba activo.
- Checks esperados antes de commit: `npm run check`, `npm test`, `npm run build`, `git diff --check`.
- Las migraciones recientes ya están aplicadas a la base configurada. Nunca usar `db:push` para reemplazar migraciones versionadas.

## Trabajo pendiente prioritario

1. Realizar smoke test manual completo: crear track con preview, subir master/stem, ejecutar worker, probar play/download como admin e incógnito.
2. Mejorar gradualmente los formularios de Ficha, Comercial y Derechos sin perder metadata ni relaciones existentes.
3. Migrar assets legacy que sigan usando fallback solo después de revisar el dry-run de R2.
4. Diseñar compras en una fase futura; no conectar proveedor de pagos todavía.
5. Mantener actualizados este documento y los runbooks cuando se agregue arquitectura, migración o cambio de seguridad relevante.
