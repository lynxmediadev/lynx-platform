# 043 - Home V2 Opciones 7-10 + Assets Navegables

> Nota vigente: este plan queda como antecedente historico. La curaduria activa del laboratorio de home fue reemplazada por `docs/plans/044-home-v2-curated-lab.md`.

## Objetivo

- Mantener las 6 opciones iniciales del laboratorio de home.
- Agregar 4 opciones nuevas para evaluar direcciones visuales más amplias.
- Corregir la presentación de imágenes/assets para que las tarjetas se vean funcionales y navegables.

## Alcance

- Incluye:
  - `HomeVariantSeven`, `HomeVariantEight`, `HomeVariantNine`, `HomeVariantTen`.
  - Actualización de `HomeVariantExplorer` a 10 opciones.
  - Mejora de `HomeAssetTile` para imágenes más visibles, hover, link y fallback visual.
  - Expansión de `home-v2/data` con assets mock y destinos temporales.
  - Actualización de inventario de componentes.
- No incluye:
  - Elección final de una variante.
  - Implementación de catálogo real de merch/drops.
  - Nueva fuente externa.

## Decisiones

- `/` sigue funcionando como laboratorio visual por viewport durante la etapa de exploración.
- `/about-us` conserva el home institucional anterior.
- Los tiles deben ser clickeables aunque algunas rutas sean temporales.
- Se mantiene la paleta actual; la diferencia visual viene de layout, contraste y tipografía.

## Opciones agregadas

### Opción 7 - Marketplace wall

- Pared compacta de assets con categorías laterales.
- Enfatiza volumen de catálogo y navegación rápida.

### Opción 8 - Record shop terminal

- Buscador dominante, filas de assets y acciones rápidas.
- Enfatiza utilidad inmediata y entrada operativa al catálogo.

### Opción 9 - Editorial merch + sound

- Composición editorial de alto contraste.
- Mezcla productos físicos, audio y servicios en bloques visuales.

### Opción 10 - Command center

- Módulos grandes para catálogo, licencias, servicios y merch.
- Enfatiza claridad funcional y expansión comercial de la plataforma.

## Cambios implementados

- `src/components/home-v2/HomeVariantExplorer.tsx`
  - Renderiza 10 variantes.
- `src/components/home-v2/HomeAssetTile.tsx`
  - Tarjeta convertida en link.
  - Imágenes menos opacas y sin grayscale agresivo.
  - Hover visual sutil.
  - Fallback textual si la imagen no carga.
- `src/components/home-v2/data.ts`
  - `HomeAsset` ahora incluye `href`.
  - Assets mock ampliados con destinos a `/catalog`, `/track/seed-001` y servicios.
- `docs/context/COMPONENT_INVENTORY.md`
  - Inventario actualizado a 10 opciones y tiles navegables.

## Checklist técnico

- [x] `npm run typecheck`
- [x] Smoke test `/`
- [x] Smoke test `/about-us`
- [x] Smoke test `/catalog`

## Checklist funcional manual

- [ ] `/` permite navegar 10 opciones verticales.
- [ ] Cada opción muestra indicador `Home option N/10`.
- [ ] Los assets muestran imagen visible o fallback textual.
- [ ] Los tiles de assets navegan a su `href`.
- [ ] `FIND THINGS` navega a `/catalog`.
- [ ] `/about-us` conserva el home anterior.

## Registro de avances

- 2026-05-28
  - Fase completada: opciones 7-10, data navegable, mejoras de tiles, documentación.
  - Archivos tocados:
    - `src/components/home-v2/HomeVariantExplorer.tsx`
    - `src/components/home-v2/HomeVariantSeven.tsx`
    - `src/components/home-v2/HomeVariantEight.tsx`
    - `src/components/home-v2/HomeVariantNine.tsx`
    - `src/components/home-v2/HomeVariantTen.tsx`
    - `src/components/home-v2/HomeAssetTile.tsx`
    - `src/components/home-v2/data.ts`
    - `docs/context/COMPONENT_INVENTORY.md`
  - Validación ejecutada:
    - `npm run typecheck` OK.
    - Smoke test HTTP OK en `/`, `/about-us`, `/catalog`.
  - Estado: completado.
