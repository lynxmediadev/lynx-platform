# 040 - Collection Browser Reutilizable (Grid/List + Detalle)

## Objetivo
Construir un sistema plug-and-play reusable para listar colecciones con vista `grid/list` y panel de detalle del elemento seleccionado, extraído desde `/catalog` sin romper el comportamiento actual.

## Alcance
- Incluye:
  - Core reusable en `src/components/collection`.
  - Adapter de tracks para catálogo.
  - Integración del adapter en `CatalogClient`.
  - Compatibilidad con rutas consumidoras actuales (`/catalog`, `/playlist/[id]`, `/track/[id]`).
  - Documentación de inventario y plan.
- No incluye:
  - Cambios de DB/migraciones.
  - Cambios de contratos backend.
  - Reescritura de banner o player sticky.

## Decisiones cerradas
1. Estrategia de migración: incremental por adaptador.
2. Estilo de reuso: render slots/props.
3. El core reusable cubre:
  - Layout grid/list.
  - Selección.
  - Panel detalle.
  - Shell de filtros opcional.
4. Queda fuera del core:
  - Hero/banner.
  - Player sticky.
  - Tracking analytics de hero.

## Arquitectura propuesta
1. Core genérico (`src/components/collection`):
- `types.ts`
- `useCollectionState.ts`
- `CollectionToolbar.tsx`
- `CollectionFilterShell.tsx`
- `CollectionBrowser.tsx`
- `index.ts`

2. Adapter de tracks (`src/components/catalog/adapters`):
- `TrackCollectionBrowser.tsx`
- `TrackFilterControls.tsx`
- `TrackGridItem.tsx`
- `TrackListItem.tsx`
- `TrackDetailPanel.tsx`

3. Integración:
- `CatalogClient` conserva orquestación de dominio (data, banner, player, tracking), delegando grid/list/detalle/filtros al adapter.

## Contratos (types/props)
### Core
`CollectionBrowser<TItem extends { id: string }>`:
- `items`
- `totalItems`
- `selectedId`, `defaultSelectedId`, `onSelectedIdChange`
- `viewMode`, `defaultViewMode`, `onViewModeChange`, `persistViewModeKey`
- `showDetailPanel`
- `filterShell` (opcional)
- `renderGridItem`
- `renderListItem`
- `renderDetailPanel`
- `renderNoItemsState`
- `renderNoResultsState`
- `listDetailLayoutClassName`
- `gridClassName`
- `listClassName`
- `detailAsideClassName`

### Adapter tracks
`TrackCollectionBrowser` recibe estado/handlers de catálogo (selección, reproducción, filtros y detalle) y conecta el core con componentes de dominio.

## Plan de implementación por fases
### Fase 1 - Preparación y límites
1. Definir en docs y código los límites del core.
2. Mantener en `CatalogClient` la orquestación de dominio + periféricos.

### Fase 2 - Core reusable
1. Crear types genéricos.
2. Crear hook de estado reusable.
3. Crear toolbar reusable.
4. Crear shell de filtros reusable.
5. Crear browser reusable.
6. Crear `index.ts` de exports.

### Fase 3 - Adapter tracks
1. Crear componentes de item (grid/list).
2. Crear controles de filtros.
3. Crear panel de detalle.
4. Crear adapter orquestador de tracks.

### Fase 4 - Integración en CatalogClient
1. Reemplazar JSX monolítico de filtros+lista+detalle por el adapter.
2. Conservar lógica de banner/player/tracking.
3. Mantener persistencia de modo y volumen.

### Fase 5 - Compatibilidad de rutas
1. Verificar rutas:
  - `/catalog`
  - `/playlist/[id]`
  - `/track/[id]` (bloque catálogo)
2. No tocar DB/migraciones.

### Fase 6 - Documentación final
1. Actualizar `docs/context/COMPONENT_INVENTORY.md`.
2. Completar registro final y checklist en este plan.

## Riesgos y mitigaciones
1. Riesgo: regresión visual al extraer JSX.
- Mitigación: mover markup literal primero, refactor visual después.
2. Riesgo: sobre-genericidad.
- Mitigación: core mínimo + adapters por dominio.
3. Riesgo: inconsistencia de selección bajo filtros.
- Mitigación: normalización en `useCollectionState`.

## Checklist de validación
- [x] `npm run typecheck`
- [x] `npm run build`
- [x] `npm test` (ejecutado con `npm run dev -- --port 3000` activo)
- [ ] Grid/List persiste modo en `/catalog` (pendiente verificación visual manual)
- [ ] Selección al primer click en grid/list (pendiente verificación visual manual)
- [ ] Panel detalle sticky OK (pendiente verificación visual manual)
- [ ] Filtros mobile/desktop sin regresión (pendiente verificación visual manual)
- [ ] `/playlist/[id]` sin regresiones (pendiente verificación visual manual)
- [ ] `/track/[id]` sin regresiones en bloque catálogo (pendiente verificación visual manual)
- [ ] Sin overflow horizontal desktop/mobile (pendiente verificación visual manual)

## Registro de avances (fecha, cambios, estado)
- 2026-02-26:
  - Se crea plan 040 con arquitectura, contratos y fases.
  - Estado: Fase 1 completada.
- 2026-02-26:
  - Se crea core reusable en `src/components/collection/`:
    - `types.ts`
    - `useCollectionState.ts`
    - `CollectionToolbar.tsx`
    - `CollectionFilterShell.tsx`
    - `CollectionBrowser.tsx`
    - `index.ts`
  - Estado: Fase 2 completada.
- 2026-02-26:
  - Se crea adapter de tracks en `src/components/catalog/adapters/`:
    - `TrackCollectionBrowser.tsx`
    - `TrackFilterControls.tsx`
    - `TrackGridItem.tsx`
    - `TrackListItem.tsx`
    - `TrackDetailPanel.tsx`
    - `types.ts` + `index.ts`
  - Estado: Fase 3 completada.
- 2026-02-26:
  - `CatalogClient` deja de renderizar el bloque monolítico de filtros/grid/lista/detalle y delega en `TrackCollectionBrowser`.
  - Se mantiene sin cambios funcionales:
    - hero/banner
    - tracking `/api/catalog/hero-events`
    - `CatalogBottomPlayerV2`
    - estado de reproducción/volumen
  - Estado: Fase 4 completada.
- 2026-02-26:
  - Compatibilidad de build validada para rutas consumidoras (`/catalog`, `/playlist/[id]`, `/track/[id]`) sin cambiar contratos server ni DB.
  - Estado: Fase 5 completada (validación visual manual pendiente).
- 2026-02-26:
  - Validaciones técnicas ejecutadas:
    - `npm run typecheck` ✅
    - `npm run build` ✅
    - `npm test` ✅ (con servidor `next dev` activo en puerto 3000)
  - Documentación actualizada:
    - este archivo (plan 040)
    - `docs/context/COMPONENT_INVENTORY.md`
  - Estado: Fase 6 completada.
