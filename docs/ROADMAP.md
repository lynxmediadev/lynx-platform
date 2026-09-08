# LYNX Platform — Roadmap

Este roadmap describe evolución pendiente. El código y las migraciones vigentes siguen siendo la fuente de verdad del estado actual.

## NOW

- Limpiar el Admin de forma no destructiva: navegación centrada en Tracks, Colecciones, Clasificación, Licencias, Contenido y Usuarios. Mantener rutas y datos ocultos disponibles hasta validar que no se usan.
- Completar el smoke test de ingesta: preview, master, stem, worker local y acceso administrativo a descargas privadas.
- Revisar los formularios de Ficha, Licencias y Derechos sin perder metadata, relaciones ni compatibilidad existente.

## NEXT

- Consolidar la clasificación en vocabularios controlados para Genre, Subgenre, Mood, Use, Category y tags genéricos. Condición: inventario de `Mood`, `TrackMood`, `Tag`, `Catalog`, `genres` y `subgenres`, con un mapeo reversible y filtros actuales cubiertos.
- Integrar semánticamente `TrackStem` y `TrackVersion` con `TrackAsset`: los primeros describen el significado editorial; el segundo representa el archivo físico. Condición: cada relación debe poder vincularse de forma inequívoca, con historial y sin duplicar archivos.
- Modernizar Licencias: definir asignaciones, formatos, pricing, territorios y restricciones como experiencia coherente. Condición: conservar los templates, asignaciones y datos comerciales existentes.

## LATER

- Incorporar lifecycle de publicación (`DRAFT`, `READY`, `PUBLISHED`, `ARCHIVED`) cuando sea necesario distinguir completitud técnica, visibilidad pública y archivo. Hasta entonces se mantiene `Track.isDraft`.
- Evolucionar hacia múltiples creators y catálogo global, con búsqueda y filtros escalables basados en vocabularios controlados.
- Diseñar compras explícitamente: licencia a formatos/assets, órdenes, pago confirmado por webhook, entitlements y portal de descargas. No conectar pagos antes de cerrar ese diseño.

## REMOVE LATER

- Retirar `Track.audioUrl`, `assetKey`, `assetMime` y `assetSize` solo cuando todos los tracks reales estén verificados mediante `TrackAsset`, no haya consumidores legacy y exista backup/rollback comprobado.
- Retirar campos legacy de `TrackStem` y `TrackVersion` solo cuando sus archivos físicos estén vinculados de forma verificable a `TrackAsset` y las interfaces consuman esa relación.
- Retirar clasificación duplicada (`Mood`/`TrackMood`, `Tag`, `Catalog`, `genres` y `subgenres`) solo tras la migración reversible a un vocabulario controlado y la validación de filtros/catálogo.
- Renombrar técnicamente `Playlist` solo cuando una migración segura conserve rutas, ACLs, colecciones públicas y relaciones `PlaylistTrack`/`PlaylistViewer`.
