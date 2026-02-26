# 042 - Player Global Real (ODR) en `FrontendShell`

## Objetivo

- Implementar un player global real, con un único host de audio persistente entre rutas públicas.
- Eliminar cortes/superposiciones al navegar entre `/catalog`, `/track/[id]` y `/playlist/[id]`.
- Desacoplar `CatalogClient` del rol de host de audio.

## Alcance

- Incluye:
  - `GlobalPlayerProvider` con `<audio>` único.
  - `GlobalPlayerHost` montado en `FrontendShell`.
  - Migración de `CatalogClient` y `TrackSimpleAudioPlayer` a hooks globales.
  - Persistencia de sesión/volumen del player.
  - Limpieza de event-bus legado.
- No incluye:
  - Checkout/pagos.
  - Cambios de DB o migraciones.

## Decisiones cerradas

- Arquitectura: host único global en shell público.
- Política de cola:
  - Catálogo: `replace`.
  - Track page: `keep`.
  - Restauración: `if-empty` implícito por snapshot al montar provider.
- Visibilidad:
  - Mostrar en rutas públicas cuando hay track activo.
  - Ocultar en `/admin` y `/creator`.

## Arquitectura implementada

1. `GlobalPlayerProvider` (`src/components/player/global-player-context.tsx`)
   - Estado único de reproducción/cola/volumen.
   - API de control vía hooks.
   - Persistencia en `sessionStorage` + volumen en `localStorage`.
   - `<audio>` único montado dentro del provider.
2. `GlobalPlayerHost` (`src/components/player/GlobalPlayerHost.tsx`)
   - UI global reutilizando `CatalogBottomPlayerV2`.
3. `FrontendShell` (`src/components/site/FrontendShell.tsx`)
   - Rutas públicas envueltas en provider.
   - Render global del host.
   - Dashboard fuera del provider.

## Contratos (types/hooks)

- `GlobalPlayerTrack`
- `GlobalPlayerQueuePolicy = "replace" | "keep" | "if-empty"`
- `useGlobalPlayerState()`
  - `currentTrack`, `queue`, `queueIndex`, `queueSource`, `isPlaying`
  - `currentSec`, `durationSec`, `progress`, `volume`, `hasPrev`, `hasNext`
- `useGlobalPlayer()`
  - `playTrack(track, options)`
  - `togglePlay()`
  - `seekByRatio(ratio)`
  - `seekByTime(seconds)`
  - `setVolume(volume)`
  - `toggleMute()`
  - `playNext()`, `playPrev()`
  - `closePlayer()`
  - `isCurrentTrack(trackId)`

## Fases ejecutadas

### Fase 1 - Base global en shell

- Implementado `global-player-context` con machine/state y `<audio>` único.
- Implementado snapshot y restauración de sesión.

### Fase 2 - Host visual global

- Creado `GlobalPlayerHost`.
- Montado en `FrontendShell` para rutas públicas.
- Ocultamiento efectivo en `/admin` y `/creator`.

### Fase 3 - Migración de `CatalogClient`

- Eliminado audio local (`audioRef`) y bus de eventos.
- Eliminado render local de `CatalogBottomPlayerV2`.
- Migrado play/seek a `useGlobalPlayer`.
- `TrackCollectionBrowser` sigue funcionando con estado derivado del player global.

### Fase 4 - Migración de `/track/[id]` player local

- `TrackSimpleAudioPlayer` migrado a hooks globales.
- Política `queuePolicy: "keep"` aplicada al flujo de track page.

### Fase 5 - Limpieza legado

- Eliminado `src/lib/player/global-player-events.ts`.

## Riesgos y mitigaciones

- Riesgo: doble padding inferior por player.
  - Mitigación: padding lo controla `FrontendShell`; removido padding local condicionado en `CatalogClient`.
- Riesgo: restauración repetida por efectos reactivos.
  - Mitigación: estabilizado `mountTrack` con `ref` de track actual.
- Riesgo: que filtros de “Más beats para explorar” detengan audio.
  - Mitigación: `CatalogClient` ya no controla lifecycle del `<audio>`; filtros no impactan el host global.

## Checklist técnico

- [x] `npm run typecheck`
- [x] `npm run build`
- [x] `npm test`

## Checklist funcional manual sugerido

- [ ] Iniciar reproducción en `/catalog` y navegar a `/track/[id]`: el audio continúa.
- [ ] En `/track/[id]`, filtrar “Más beats para explorar” hasta 0 resultados: el audio activo continúa.
- [ ] Desde `/track/[id]`, usar play/seek local: refleja estado en player bottom global.
- [ ] `Next/Prev` respeta cola de origen hasta que una nueva reproducción en catálogo la reemplace.
- [ ] Verificar que en `/admin` y `/creator` no aparezca el player global.

## Registro de avances

- 2026-02-26
  - Fase completada: 1, 2, 3, 4, 5.
  - Archivos tocados:
    - `src/components/player/global-player-context.tsx`
    - `src/components/player/GlobalPlayerHost.tsx`
    - `src/components/site/FrontendShell.tsx`
    - `src/app/catalog/CatalogClient.tsx`
    - `src/components/track/TrackSimpleAudioPlayer.tsx`
    - `src/lib/player/global-player-events.ts` (eliminado)
  - Validación ejecutada:
    - `npm run typecheck` ✅
    - `npm run build` ✅
    - `npm test` ✅
  - Estado: completado.
