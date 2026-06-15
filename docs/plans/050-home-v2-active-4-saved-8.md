# 050 - Home V2 Activo: 4 Opciones + 8 Guardadas

## Objetivo

- Reducir el homepage activo a las primeras 4 opciones actuales.
- Guardar las antiguas opciones 5/12 a 12/12 como rutas archivadas enumeradas.
- Mantener accesibles todas las opciones descartadas para revision directa.

## Cambios implementados

- `/` ahora renderiza 4 opciones:
  - Opcion 1: `HomeVariantEditorialWall`.
  - Opcion 2: `HomeVariantSignalBoard`.
  - Opcion 3: `HomeVariantSearchMonolith`.
  - Opcion 4: `HomeVariantOdrIndex`.
- Se agregaron rutas guardadas:
  - `/dev/home-archive/home-v2-saved-1`: antigua 5/12, `HomeVariantTen`.
  - `/dev/home-archive/home-v2-saved-2`: antigua 6/12, `HomeVariantPortalGrid`.
  - `/dev/home-archive/home-v2-saved-3`: antigua 7/12, `HomeVariantDropLedger`.
  - `/dev/home-archive/home-v2-saved-4`: antigua 8/12, `HomeVariantSoundMuseum`.
  - `/dev/home-archive/home-v2-saved-5`: antigua 9/12, `HomeVariantSplitDecision`.
  - `/dev/home-archive/home-v2-saved-6`: antigua 10/12, `HomeVariantAssetCircuit`.
  - `/dev/home-archive/home-v2-saved-7`: antigua 11/12, `HomeVariantProductTicker`.
  - `/dev/home-archive/home-v2-saved-8`: antigua 12/12, `HomeVariantMonitorWall`.
- Se mantiene la ruta historica `/dev/home-archive/saved-1` sin cambios.

## Validacion

- [x] `npm run typecheck`
- [x] Smoke test `/`
- [x] Smoke test `/dev/home-archive/home-v2-saved-1..8`
- [x] Smoke test `/dev/home-archive/saved-1`
- [x] Smoke test `/about-us`
- [x] Smoke test `/catalog`

## Registro de avances

- 2026-06-01
  - Fase completada: reduccion activa a 4 opciones y archivo de 8 opciones.
  - Archivos tocados:
    - `src/components/home-v2/HomeVariantExplorer.tsx`
    - `src/app/dev/home-archive/home-v2-saved-1/page.tsx`
    - `src/app/dev/home-archive/home-v2-saved-2/page.tsx`
    - `src/app/dev/home-archive/home-v2-saved-3/page.tsx`
    - `src/app/dev/home-archive/home-v2-saved-4/page.tsx`
    - `src/app/dev/home-archive/home-v2-saved-5/page.tsx`
    - `src/app/dev/home-archive/home-v2-saved-6/page.tsx`
    - `src/app/dev/home-archive/home-v2-saved-7/page.tsx`
    - `src/app/dev/home-archive/home-v2-saved-8/page.tsx`
    - `docs/PROJECT_GENERAL_CONTEXT.md`
    - `docs/context/COMPONENT_INVENTORY.md`
    - `docs/plans/049-home-v2-reorder-12-options.md`
  - Validacion ejecutada:
    - `npm run typecheck` OK.
    - Smoke test HTTP OK en `/`, `/dev/home-archive/saved-1`, `/dev/home-archive/home-v2-saved-1..8`, `/about-us`, `/catalog`.
  - Estado: completado.
