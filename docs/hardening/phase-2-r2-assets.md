# FASE 2 — Separación segura de assets en Cloudflare R2

## Resultado y alcance

La aplicación separa los previews públicos de los masters, stems, alternates y entregables privados. `TrackAsset.storageKey` y su metadata son la fuente de verdad; las columnas anteriores de `Track`, `TrackVersion` y `TrackStem` se conservan para dual-read y rollback. No se implementó cola, worker ni FFmpeg (FASE 3).

Inventario previo del 2026-09-06: 12 tracks, 10 fixtures `external://`, 2 objetos con key legacy, una versión sin audio y ningún stem. Ningún objeto legacy se eliminó ni se movió automáticamente.

## Flujos implementados

- **Upload:** el servidor autentica, comprueba ownership/rol, decide bucket y acceso por tipo, valida MIME/tamaño, genera una key aleatoria y firma un PUT de 60 segundos con `If-None-Match: *`. El navegador sube directamente. `/api/uploads/complete` verifica el objeto con `HEAD` y persiste metadata; la creación inicial de un track realiza la misma verificación.
- **Playback:** catálogo, playlists, player, ficha y análisis buscan primero un `TrackAsset PREVIEW/PUBLIC/VERIFIED`, derivan su URL desde `R2_PUBLIC_PREVIEW_URL` y usan las columnas legacy solo como fallback. El catálogo actual es público, por eso el preview también lo es.
- **Download privado:** `/api/tracks/:trackId/assets/:assetId/download` carga usuario y ownership desde el servidor. Solo owner, ADMIN o STAFF reciben una URL GET firmada de 60 segundos. El cliente nunca decide su rol.
- **Persistencia:** PostgreSQL guarda bucket lógico, key, tipo, acceso, estado, MIME, tamaño, checksum disponible y timestamps. Nunca guarda URLs firmadas.

## Configuración manual en Cloudflare

1. En **R2 Object Storage → Create bucket**, crea `lynx-previews`.
2. Crea también `lynx-private-assets`.
3. En `lynx-previews`, conecta un dominio público dedicado, por ejemplo `previews.lynxmedia.cl`. Mientras desarrollas puedes usar el dominio `r2.dev`, pero no es la opción final recomendada.
4. En `lynx-private-assets`, mantén desactivados tanto `r2.dev` como los dominios públicos.
5. Crea un API token R2 limitado a **Object Read & Write** y exclusivamente a esos dos buckets. No uses un token con permisos de cuenta completos.
6. Configura CORS en ambos buckets, reemplazando la IP por la IP LAN vigente del computador:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://192.168.100.38:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type", "If-None-Match"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

7. Agrega a `.env.local` las variables `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PREVIEWS_BUCKET`, `R2_PRIVATE_BUCKET`, `R2_PUBLIC_PREVIEW_URL` y `ASSET_UPLOAD_SIGNING_SECRET`. Usa `.env.example` como guía. No antepongas `NEXT_PUBLIC_` a ninguna credencial.
8. Reinicia `npm run dev` después de cambiar variables.

## Migración de los dos objetos legacy

El script es idempotente por destino lógico: solo toma tracks sin `TrackAsset`, copia al nuevo bucket, compara el tamaño mediante `HEAD` y recién entonces crea el registro `VERIFIED`. No borra el origen.

```bash
npm run assets:migrate-r2 -- --dry-run
npm run assets:migrate-r2 -- --apply
```

Ejecuta `--apply` solo después de configurar ambos buckets y conservar el backup de FASE 0. Los fixtures `external://` siguen funcionando mediante dual-read y no se copian.

## Prueba manual mínima

1. Abre `/catalog` y confirma reproducción de los tracks existentes.
2. En `/admin/uploads`, sube un MP3 de preview y crea un track.
3. Confirma que el objeto quedó en `lynx-previews`, que existe un `TrackAsset PREVIEW/PUBLIC/VERIFIED` y que el catálogo lo reproduce.
4. Comprueba que una subida `MASTER`, `STEM`, `ALTERNATE` o `DELIVERABLE` se firma contra `lynx-private-assets`.
5. Solicita la descarga privada desde `/api/tracks/ID/assets/ASSET_ID/download`: sin sesión debe responder 401; un usuario ajeno, 403; owner/admin, una URL GET de 60 segundos.
6. Verifica que ninguna URL firmada quede persistida en PostgreSQL.

## Rollback seguro

- No reviertas ni borres la tabla `TrackAsset`: la migración es aditiva.
- Para volver temporalmente al almacenamiento anterior, conserva `S3_*`; los registros existentes siguen usando dual-read.
- Las subidas nuevas mantienen una URL pública no firmada en `Track.audioUrl` solo como compatibilidad; la key canónica permanece en `TrackAsset`.
- No elimines objetos de ningún bucket hasta completar la comparación de inventario, tamaños y reproducción.
- Si falla una copia, corrige configuración y repite el script; el objeto fuente permanece intacto.

## Costo y límites

No se añadió ningún SaaS ni plan pagado. Ambos buckets comparten el free tier R2 de la cuenta. Revisa consumo al 50%, 75% y 90%; el umbral acordado para evaluar pago es 8 GB almacenados o 80% de las operaciones gratuitas. R2 cobra cualquier exceso, por lo que conviene configurar alertas de facturación en Cloudflare si el panel las ofrece para la cuenta.
