# 049 - Home V2 Reorden Activo: 12 Opciones

> Nota vigente: este plan queda como antecedente historico. La seleccion activa fue reducida por `docs/plans/050-home-v2-active-4-saved-8.md`.

## Objetivo

- Reordenar el laboratorio activo segun la seleccion del usuario.
- Ocultar la antigua opcion 4/13 por similitud con la antigua opcion 1/13.
- Mantener el resto de opciones activas al final en su orden relativo.

## Cambios implementados

- `/` ahora renderiza 12 opciones.
- Nuevo orden activo:
  - Opcion 1: antigua 1/13 (`HomeVariantEditorialWall`).
  - Opcion 2: antigua 9/13 (`HomeVariantSignalBoard`).
  - Opcion 3: antigua 8/13 (`HomeVariantSearchMonolith`).
  - Opcion 4: antigua 3/13 (`HomeVariantOdrIndex`).
  - Opcion 5: antigua 2/13 (`HomeVariantTen`).
  - Opcion 6: antigua 11/13 (`HomeVariantPortalGrid`).
  - Opcion 7: antigua 5/13 (`HomeVariantDropLedger`).
  - Opcion 8: antigua 6/13 (`HomeVariantSoundMuseum`).
  - Opcion 9: antigua 7/13 (`HomeVariantSplitDecision`).
  - Opcion 10: antigua 10/13 (`HomeVariantAssetCircuit`).
  - Opcion 11: antigua 12/13 (`HomeVariantProductTicker`).
  - Opcion 12: antigua 13/13 (`HomeVariantMonitorWall`).
- `HomeVariantThree` queda oculto, no eliminado.

## Validacion

- [x] `npm run typecheck`
- [x] Smoke test `/`
- [x] Smoke test `/dev/home-archive/saved-1`
- [x] Smoke test `/about-us`
- [x] Smoke test `/catalog`

## Registro de avances

- 2026-05-31
  - Fase completada: reordenamiento activo y documentacion.
  - Archivos tocados:
    - `src/components/home-v2/HomeVariantExplorer.tsx`
    - `docs/PROJECT_GENERAL_CONTEXT.md`
    - `docs/context/COMPONENT_INVENTORY.md`
    - `docs/plans/048-home-v2-selection-13-options.md`
  - Validacion ejecutada:
    - `npm run typecheck` OK.
    - Smoke test HTTP OK en `/`, `/dev/home-archive/saved-1`, `/about-us`, `/catalog`.
  - Estado: completado.
