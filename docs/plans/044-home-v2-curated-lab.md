# 044 - Home V2 Curado: 3/10 + 10/10 + 8 Nuevas Opciones

> Nota vigente: este plan queda como antecedente historico. La ronda activa fue reemplazada por `docs/plans/045-home-v2-final-lab.md`.

## Objetivo

- Curar el laboratorio de home para conservar solo las direcciones utiles.
- Mantener como base activa la antigua opcion 3/10 y la antigua opcion 10/10.
- Archivar la antigua opcion 2/10 en una ruta revisable.
- Crear 8 opciones nuevas con estetica brutalista, alto contraste, tipografia grande y estructura comercial clara.

## Cambios implementados

- `/` ahora renderiza 10 opciones curadas:
  - Opcion 1: antigua 3/10.
  - Opcion 2: antigua 10/10.
  - Opciones 3-10: nuevas propuestas.
- `/dev/home-archive/saved-1` renderiza la antigua 2/10 con indicador `Saved template 1`.
- Las variantes descartadas se mantienen en codigo, pero fuera del explorer activo.
- `HomeOptionIndicator` acepta `label` opcional para rutas archivadas.
- `HomeVariantExplorer` pasa `optionIndex` y `optionTotal` dinamicamente a cada variante activa.

## Nuevas opciones activas

- `HomeVariantBlackCatalogSlab`: bloque oscuro editorial con accesos a catalogo, licencias y servicios.
- `HomeVariantAssetTerminal`: terminal operacional con busqueda visual, categorias y acciones.
- `HomeVariantServiceGridBrutal`: modulos grandes para assets, licencias, servicios y goods.
- `HomeVariantEditorialWall`: imagen dominante, palabra gigante y CTA editorial.
- `HomeVariantCatalogCommandStrips`: franjas horizontales por categoria comercial.
- `HomeVariantLicenseFirstStorefront`: storefront enfocado en claridad de licencias.
- `HomeVariantMonochromeMarketplace`: marketplace austero con grid de assets.
- `HomeVariantOdrIndex`: indice visual de tracks, samples, vocals, licencias, servicios y merch.

## Validacion

- [x] `npm run typecheck`
- [x] Smoke test `/`
- [x] Smoke test `/dev/home-archive/saved-1`
- [x] Smoke test `/about-us`
- [x] Smoke test `/catalog`

## Registro de avances

- 2026-05-28
  - Fase completada: implementacion visual y ruta archivada.
  - Archivos tocados:
    - `src/components/home-v2/HomeVariantExplorer.tsx`
    - `src/components/home-v2/HomeOptionIndicator.tsx`
    - `src/components/home-v2/HomeVariantTwo.tsx`
    - `src/components/home-v2/HomeVariantThree.tsx`
    - `src/components/home-v2/HomeVariantTen.tsx`
    - `src/components/home-v2/HomeVariantBlackCatalogSlab.tsx`
    - `src/components/home-v2/HomeVariantAssetTerminal.tsx`
    - `src/components/home-v2/HomeVariantServiceGridBrutal.tsx`
    - `src/components/home-v2/HomeVariantEditorialWall.tsx`
    - `src/components/home-v2/HomeVariantCatalogCommandStrips.tsx`
    - `src/components/home-v2/HomeVariantLicenseFirstStorefront.tsx`
    - `src/components/home-v2/HomeVariantMonochromeMarketplace.tsx`
    - `src/components/home-v2/HomeVariantOdrIndex.tsx`
    - `src/app/dev/home-archive/saved-1/page.tsx`
    - `docs/PROJECT_GENERAL_CONTEXT.md`
    - `docs/context/COMPONENT_INVENTORY.md`
  - Validacion ejecutada:
    - `npm run typecheck` OK.
    - Smoke test HTTP OK en `/`, `/dev/home-archive/saved-1`, `/about-us`, `/catalog`.
  - Estado: completado.
