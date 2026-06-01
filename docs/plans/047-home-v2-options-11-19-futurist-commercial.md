# 047 - Home V2 Opciones 11-19: UI Futurista Comercial

> Nota vigente: este plan queda como antecedente historico. La seleccion activa fue reducida por `docs/plans/048-home-v2-selection-13-options.md`: se conservan las 10 primeras opciones, la antigua 17/20, la antigua 18/20 y la antigua 20/20.

## Objetivo

- Mantener intactas las opciones 1-10 del laboratorio.
- Mantener la opcion 20 actual (`HomeVariantMonitorWall`).
- Reemplazar opciones 11-19 por una ronda nueva: pulida, comercial, futurista y funcionalmente variada.

## Cambios implementados

- `HomeVariantExplorer` conserva:
  - Opciones 1-10 de la ronda anterior.
  - Opciones 11-19 nuevas.
  - Opcion 20 `HomeVariantMonitorWall`.
- Los componentes antiguos de 11-19 no se eliminan; quedan como referencia historica fuera del explorer activo.
- No hay cambios de DB, APIs ni backend.

## Nuevas opciones activas 11-19

- `HomeVariantCreatorOS`: escritorio/OS creativo con ventanas para catalogo, licencias, servicios y drops.
- `HomeVariantGlassCommerce`: storefront con paneles translucidos, capas y assets destacados.
- `HomeVariantDropTimeline`: timeline de lanzamientos, servicios, licencias y drops.
- `HomeVariantSmartCart`: interfaz tipo carrito/checkout futurista sin checkout real.
- `HomeVariantRecommendationEngine`: recomendaciones por intencion del usuario.
- `HomeVariantLayeredDeck`: deck de tarjetas/product cards superpuestas.
- `HomeVariantPortalGrid`: portales grandes de navegacion por area.
- `HomeVariantProductTicker`: ticker comercial de productos/servicios con estados.
- `HomeVariantInterfacePoster`: poster digital con UI overlays y CTA comercial.

## Validacion

- [x] `npm run typecheck`
- [x] Smoke test `/`
- [x] Smoke test `/dev/home-archive/saved-1`
- [x] Smoke test `/about-us`
- [x] Smoke test `/catalog`

## Registro de avances

- 2026-05-31
  - Fase completada: opciones 11-19, explorer actualizado y documentacion.
  - Archivos tocados:
    - `src/components/home-v2/HomeVariantExplorer.tsx`
    - `src/components/home-v2/HomeVariantCreatorOS.tsx`
    - `src/components/home-v2/HomeVariantGlassCommerce.tsx`
    - `src/components/home-v2/HomeVariantDropTimeline.tsx`
    - `src/components/home-v2/HomeVariantSmartCart.tsx`
    - `src/components/home-v2/HomeVariantRecommendationEngine.tsx`
    - `src/components/home-v2/HomeVariantLayeredDeck.tsx`
    - `src/components/home-v2/HomeVariantPortalGrid.tsx`
    - `src/components/home-v2/HomeVariantProductTicker.tsx`
    - `src/components/home-v2/HomeVariantInterfacePoster.tsx`
    - `docs/PROJECT_GENERAL_CONTEXT.md`
    - `docs/context/COMPONENT_INVENTORY.md`
    - `docs/plans/046-home-v2-options-11-20.md`
  - Validacion ejecutada:
    - `npm run typecheck` OK.
    - Smoke test HTTP OK en `/`, `/dev/home-archive/saved-1`, `/about-us`, `/catalog`.
  - Estado: completado.
