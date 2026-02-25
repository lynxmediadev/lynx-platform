# 038 - Music Player V2 (Sticky Bottom, Compacto)

## 1. Objetivo
Implementar un reproductor nuevo (V2) para ` /catalog `, compacto y sticky al fondo, que aparezca solo cuando se reproduce un track y mantenga coherencia visual con el estilo actual de catálogo.

Este V2 convive con el player anterior (legacy) sin romper rutas previas.

## 2. Alcance funcional (MVP de interfaz)
- Mostrar player solo cuando existe track activo en reproducción/contexto.
- Posición sticky/fixed inferior en desktop y mobile.
- Mantener ancho total sin generar scroll horizontal.
- Controles de reproducción:
  - `play/pause`
  - `prev/next` dentro de la cola visible de tracks (según filtros actuales).
- Mostrar metadata mínima:
  - cover
  - título
  - artista
- Título y artista clickeables hacia ficha de track.
- Waveform visible y clickeable para seek.
- Volumen global del reproductor (slider + mute).
- Botones de acción extra:
  - abrir track
  - ir a licencias
  - cerrar player

## 3. Sugerencias aplicadas (incluidas en implementación)
1. Persistir volumen en `localStorage` para no resetear en cada recarga.
2. Navegación `prev/next` por cola derivada de `visibleTracks` para respetar filtros activos.
3. Reservar padding inferior dinámico en `CatalogClient` cuando el player está visible para evitar que tape contenido.
4. Mantener V2 desacoplado del player legacy para evolución progresiva.

## 4. Diseño técnico
### 4.1 Componente nuevo
- Archivo: `src/components/catalog/CatalogBottomPlayerV2.tsx`
- Responsabilidad:
  - render visual del player bottom bar
  - interacción UI (botones, slider volumen, acciones)
  - render de waveform vía `WaveformScrubber`
- No maneja `audio` directamente; recibe estado/handlers del padre.

### 4.2 Integración en catálogo
- Archivo: `src/app/catalog/CatalogClient.tsx`
- Cambios:
  - Se integra render condicional del V2.
  - Se agrega estado de volumen persistente:
    - key: `catalog:player-volume`
  - Se agrega cola de reproducción (`playbackQueue`) y `currentQueueIndex`.
  - Se agregan handlers:
    - `playPrevTrack`
    - `playNextTrack`
    - `seekTrackToTime`
    - `closeBottomPlayer`
    - `togglePlayerMute`
    - `setPlayerVolumeSafe`
  - Se aplica volumen actual al `audioRef` al reproducir/seekear.
  - Se agrega padding inferior dinámico cuando player está visible.

## 5. Criterios de aceptación
1. En ` /catalog ` no se ve player al entrar (sin track activo).
2. Al dar play en cualquier card/list item, aparece barra sticky inferior.
3. La barra ocupa 100% de ancho visible y no crea scroll horizontal.
4. Waveform responde al click (seek).
5. `prev/next` cambia tracks dentro de la cola filtrada.
6. Volumen ajusta el audio y mute/desmute funciona.
7. Título/artista/acciones abren URL de track.
8. Cerrar player detiene audio y oculta barra.
9. `npm run typecheck` pasa sin errores.

## 6. Archivos modificados en esta implementación
- `src/components/catalog/CatalogBottomPlayerV2.tsx` (nuevo)
- `src/app/catalog/CatalogClient.tsx`

## 7. Pruebas manuales rápidas (URLs)
1. `http://localhost:3000/catalog`
   - Click en play de cualquier track.
   - Verificar aparición de barra inferior.
2. `http://localhost:3000/catalog` con filtros activos
   - Aplicar filtro.
   - Usar `prev/next` en player y validar recorrido de cola filtrada.
3. `http://localhost:3000/catalog`
   - Click en waveform para saltar de tiempo.
4. `http://localhost:3000/catalog`
   - Ajustar volumen, refrescar página, reproducir de nuevo y confirmar persistencia.
5. `http://localhost:3000/catalog`
   - Revisar desktop + mobile (sin overflow horizontal).

## 8. Estado
- [x] Planificado
- [x] Implementado
- [x] Integrado en `/catalog`
- [x] Validado con typecheck
