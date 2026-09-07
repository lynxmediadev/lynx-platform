# Revisión posterior a FASE 4

## P0 — Bloqueo antes de producción

| Problema | Impacto | Solución | Fase/costo |
|---|---|---|---|
| Docker no está instalado en el PC de desarrollo; las dos imágenes no pudieron ejecutarse aquí. | No existe validación local de contenedor todavía. | Instalar/autorizar Docker solo cuando se necesite, construir web y worker, y ejecutar smoke test. | Fase 4 operativa; gratis localmente. |
| `CSRF_SECRET` debe configurarse antes de arrancar en producción. | Formularios públicos fallan de forma segura si falta. | Generar secreto aleatorio de 32+ bytes y guardarlo solo en el entorno web. | Configuración manual, USD 0. |

## P1 — Importante

| Problema | Impacto | Solución | Fase/costo |
|---|---|---|---|
| ~~La ruta legacy `AUDIO_PROCESSING_MODE=sync` conservaba FFmpeg en web.~~ | Resuelto en Fase 5: la ruta HTTP solo encola y responde `202`. | Mantener worker separado. | Cerrado, USD 0. |
| La web y worker locales comparten `.env.local`. | Un deploy futuro podría sobreentregar secretos. | Crear secretos/variables separados por proceso al desplegar. | Operación futura, gratis. |

## P2 — Recomendable

| Problema | Impacto | Solución | Fase/costo |
|---|---|---|---|
| `README` histórico y documentos antiguos pueden mencionar T3/local DB. | Onboarding confuso. | README actualizado; revisar archivos históricos antes de borrarlos. | Documentación, gratis. |
| Node 20 funciona hoy, pero AWS SDK anuncia que versiones posteriores a enero 2027 requerirán Node 22. | Upgrade futuro planificado. | Probar Node 22 en CI/local antes de esa fecha. | Mantenimiento, gratis. |
| `npm audit --omit=dev` informa 3 alertas high en la cadena Prisma / `deepmerge-ts`; la sugerencia disponible no es un upgrade claramente seguro. | Requiere revisión de compatibilidad antes de modificar Prisma. | Revisar advisory y lockfile; no ejecutar `npm audit fix --force` ni downgrade automático. | Mantenimiento futuro, gratis. |

## P3 — Mejora futura

| Problema | Impacto | Solución | Fase/costo |
|---|---|---|---|
| Métricas de hosting/worker aún son manuales. | No hay umbral observado todavía. | Registrar jobs/día, backlog, duración, RAM/CPU y uptime durante beta. | Fase 5 o posterior; PostgreSQL primero, gratis. |
| El staging `pending/` conserva objetos previos a crear el track. | Puede acumular uploads abandonados. | `maintenance:r2` clasifica con TTL de 24 h, protege referencias/VERIFIED y parte en dry-run. | Implementado en Fase 5, USD 0. |

## Bloqueos de cierre identificados en Fase 5

- **Auth legacy:** `BLOCKED — requires stable window / manual approval`. Solo 1 de 38 perfiles está enlazado con Supabase Auth y aún existen sesiones/tokens legacy.
- **Storage dual-read:** `BLOCKED — requires stable window / manual approval`. Diez tracks siguen sin `TrackAsset` y dependen de `audioUrl`/`assetKey` legacy.
- **Docker real:** continúa pendiente de prueba porque Docker no está instalado; los Dockerfiles se conservan inspeccionados.
