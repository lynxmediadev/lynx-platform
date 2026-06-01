# 048 - Home V2 Seleccion Activa: 13 Opciones

> Nota vigente: este plan queda como antecedente historico. El orden activo fue reemplazado por `docs/plans/049-home-v2-reorder-12-options.md`.

## Objetivo

- Conservar las 10 primeras opciones activas del laboratorio.
- Conservar las antiguas opciones 17/20, 18/20 y 20/20.
- Eliminar de la ultima ronda los componentes descartados por el usuario.

## Cambios implementados

- `/` ahora renderiza 13 opciones:
  - Opciones 1-10: se mantienen iguales.
  - Opcion 11: antigua 17/20 (`HomeVariantPortalGrid`).
  - Opcion 12: antigua 18/20 (`HomeVariantProductTicker`).
  - Opcion 13: antigua 20/20 (`HomeVariantMonitorWall`).
- Se eliminaron los componentes descartados de la ultima ronda:
  - `HomeVariantCreatorOS`
  - `HomeVariantGlassCommerce`
  - `HomeVariantDropTimeline`
  - `HomeVariantSmartCart`
  - `HomeVariantRecommendationEngine`
  - `HomeVariantLayeredDeck`
  - `HomeVariantInterfacePoster`
- No se tocaron componentes historicos ya fuera del explorer activo.

## Validacion

- [x] `npm run typecheck`
- [x] Smoke test `/`
- [x] Smoke test `/dev/home-archive/saved-1`
- [x] Smoke test `/about-us`
- [x] Smoke test `/catalog`

## Registro de avances

- 2026-05-31
  - Fase completada: seleccion activa reducida a 13 opciones y documentacion.
  - Archivos tocados:
    - `src/components/home-v2/HomeVariantExplorer.tsx`
    - `docs/PROJECT_GENERAL_CONTEXT.md`
    - `docs/context/COMPONENT_INVENTORY.md`
    - `docs/plans/047-home-v2-options-11-19-futurist-commercial.md`
  - Archivos eliminados:
    - `src/components/home-v2/HomeVariantCreatorOS.tsx`
    - `src/components/home-v2/HomeVariantGlassCommerce.tsx`
    - `src/components/home-v2/HomeVariantDropTimeline.tsx`
    - `src/components/home-v2/HomeVariantSmartCart.tsx`
    - `src/components/home-v2/HomeVariantRecommendationEngine.tsx`
    - `src/components/home-v2/HomeVariantLayeredDeck.tsx`
    - `src/components/home-v2/HomeVariantInterfacePoster.tsx`
  - Validacion ejecutada:
    - `npm run typecheck` OK.
    - Smoke test HTTP OK en `/`, `/dev/home-archive/saved-1`, `/about-us`, `/catalog`.
  - Estado: completado.
