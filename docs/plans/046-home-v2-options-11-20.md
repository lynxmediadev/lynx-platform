# 046 - Home V2 Opciones 11-20: Nuevos Prismas

> Nota vigente: este plan queda como antecedente historico. Las opciones 11-19 fueron reemplazadas por `docs/plans/047-home-v2-options-11-19-futurist-commercial.md`; la opcion 20 `HomeVariantMonitorWall` se conserva.

## Objetivo

- Mantener intactas las 10 opciones actuales del laboratorio.
- Agregar 10 opciones nuevas, del 11 al 20, con angulos artisticos y funcionales distintos a las rondas anteriores.
- Seguir enfocando el home en catalogo, assets digitales, licencias, merch y servicios profesionales.

## Cambios implementados

- `/` ahora renderiza 20 opciones en `HomeVariantExplorer`.
- Las opciones 1-10 se mantienen en el orden vigente de la ronda 045.
- Las opciones 11-20 son nuevas y se agregan al final.
- No se modifican rutas de backend, DB ni datos persistentes.

## Nuevas opciones activas

- `HomeVariantAudioBlueprint`: plano tecnico del ecosistema ODR.
- `HomeVariantCassetteArchive`: cassette fisico/archivo analogico para assets.
- `HomeVariantRadioDial`: dial de radio para sintonizar categorias y servicios.
- `HomeVariantStudioConsole`: consola de mezcla como control comercial.
- `HomeVariantMagazineCover`: portada editorial de revista/catalogo.
- `HomeVariantVaultAccess`: vault/safe para acceso a stock y derechos.
- `HomeVariantMapCoordinates`: mapa territorial con coordenadas de assets.
- `HomeVariantSampleLab`: laboratorio de specimens para catalogo.
- `HomeVariantRightsPassport`: pasaporte de derechos y usos.
- `HomeVariantMonitorWall`: control room con monitores de catalogo/servicios.

## Validacion

- [x] `npm run typecheck`
- [x] Smoke test `/`
- [x] Smoke test `/dev/home-archive/saved-1`
- [x] Smoke test `/about-us`
- [x] Smoke test `/catalog`

## Registro de avances

- 2026-05-31
  - Fase completada: opciones 11-20, explorer actualizado y documentacion.
  - Archivos tocados:
    - `src/components/home-v2/HomeVariantExplorer.tsx`
    - `src/components/home-v2/HomeVariantAudioBlueprint.tsx`
    - `src/components/home-v2/HomeVariantCassetteArchive.tsx`
    - `src/components/home-v2/HomeVariantRadioDial.tsx`
    - `src/components/home-v2/HomeVariantStudioConsole.tsx`
    - `src/components/home-v2/HomeVariantMagazineCover.tsx`
    - `src/components/home-v2/HomeVariantVaultAccess.tsx`
    - `src/components/home-v2/HomeVariantMapCoordinates.tsx`
    - `src/components/home-v2/HomeVariantSampleLab.tsx`
    - `src/components/home-v2/HomeVariantRightsPassport.tsx`
    - `src/components/home-v2/HomeVariantMonitorWall.tsx`
    - `docs/PROJECT_GENERAL_CONTEXT.md`
    - `docs/context/COMPONENT_INVENTORY.md`
    - `docs/plans/045-home-v2-final-lab.md`
  - Validacion ejecutada:
    - `npm run typecheck` OK.
    - Smoke test HTTP OK en `/`, `/dev/home-archive/saved-1`, `/about-us`, `/catalog`.
  - Estado: completado.
