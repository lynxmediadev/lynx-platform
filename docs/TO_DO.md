# Watermark de audio (pendiente)

## Objetivo
Implementar un sistema de watermark para los previews públicos de los tracks, con el fin de proteger el master, reducir riesgos de uso no autorizado y mantener una experiencia de escucha aceptable para evaluación.

## Opcion recomendada (Opcion 1: preview pre-renderizado)
Generar una version "preview" con watermark y servir solo esa version en el sitio publico.

Ventajas:
- Mejor rendimiento y menor carga en runtime.
- No expone el master.
- Resultado consistente y control total del watermark.

Desventajas:
- Requiere pipeline de procesamiento y almacenamiento extra.
- Se debe regenerar si cambia el watermark.

Implementacion (idea):
- Usar FFmpeg para mezclar el track con un watermark (voz/logo/tono).
- Guardar el archivo resultante como asset separado (previewUrl).
- En frontend publico, reproducir previewUrl y nunca el master.

## Otras opciones

### Opcion 2: watermark dinamico en servidor (on-the-fly)
Mezclar en tiempo real cuando se solicita el audio.

Ventajas:
- No duplicas archivos.
- Posibilidad de watermark personalizado por usuario/sesion.

Desventajas:
- Mayor costo de CPU y latencia.
- Requiere infraestructura de streaming/colas.

### Opcion 3: watermark en cliente (Web Audio API)
Mezclar watermark y audio en el navegador.

Ventajas:
- Rapida de prototipar.
- Menos infraestructura.

Desventajas:
- Menor control y seguridad.
- UX peor en dispositivos limitados.
- El master puede quedar expuesto si no hay control estricto.

## Tipos de watermark a considerar
- Voz ("audio tag") intermitente cada X segundos.
- Sonic logo o breve jingle.
- Tono sutil o ruido de baja amplitud (menos recomendable).
- Watermark personalizado por cliente (si se usa Opcion 2).

## Proteccion de masters (pendiente)
Separar claramente:
- Master (solo accesible por admin o licenciatarios).
- Preview con watermark (publico).

Para el master:
- Usar URLs firmadas (signed URLs) con expiracion corta.
- Evitar URLs publicas permanentes.
- Controlar descargas y registrar accesos.

---

# SEO / Canonical pendiente
- Definir y configurar `NEXT_PUBLIC_SITE_URL` en producción (`https://lynxmedia.cl`) y en cada entorno (en local puede ser `http://localhost:3000` si se desea).
- Decidir política para tracks con múltiples catálogos (BEATS/SYNC/GAMES):
  - Opción A (actual): usar el slug por el que llegó el usuario.
  - Opción B: prioridad fija (ej. sync > beats > games) para canonical.
  - Opción C: canonical siempre `/track/[id]` cuando haya múltiples tags.
- Tras decidir, ajustar la lógica de canonical en `src/app/track/[id]/page.tsx` según la regla.

---

# Migración a catálogo único con filtros (ONE_CATALOG_PLAN)
- Seguir `docs/plans/ONE_CATALOG_PLAN.md` para unificar en una sola página `/catalog` con filtros SYNC/BEATS/GAMES.
- UI: agregar controles de filtro en `/catalog`; usar `?cat=` solo para estado compartible; canonical debe seguir siendo `/catalog`.
- Alias: convertir `/sync`, `/beats`, `/games` en landings que cargan `/catalog` con filtro aplicado y canonical `/catalog`, o redirigirlas si se decide limpiar.
- Enlaces internos: “Piezas similares”, catálogo y copy link deben usar `/track/[id]` (sin segmentos).
- Canonical final para tracks: preferencia `/track/[id]` como único canonical; redirigir `?c=` y `/slug/track/[id]` si se retiran alias.

---

# One-Stop / facultad de licenciar
- [ ] Confirmar que ODR Records tenga facultad para licenciar master + publishing en cada track.
- [ ] Requerir autorización/cesión de todos los coautores para firmar por ambos derechos cuando se marque One-Stop.
- [ ] Si no hay poder centralizado, marcar el track como no One-Stop (two-step / no cleared).
