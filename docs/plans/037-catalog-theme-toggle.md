# 037 - Theme Toggle Completo para `/catalog`

## Objetivo
Alinear `/catalog` al sistema de tema global (`dark` por defecto, `light` vía clase `html.light`) para que el botón de cambio de tema del navbar aplique correctamente en toda la vista.

## Problema detectado
`/catalog` usa mayoritariamente clases `neutral-*` fijas y algunos `--lm-*` estáticos, por lo que el cambio de tema global no altera de forma consistente fondos, bordes, textos ni estados interactivos.

## Estrategia
1. Migrar `CatalogClient` a tokens semánticos (`background`, `foreground`, `card`, `muted`, `border`, `ring`) y variantes con opacidad.
2. Reemplazar dependencias de `--lm-bg-deep` en `src/app/catalog/page.tsx` y `src/app/catalog/layout.tsx` por clases semánticas del tema.
3. Mantener jerarquía visual actual (contraste y estructura) en dark, garantizando adaptación en light.
4. Verificar que controles clave (filtros, cards, panel sticky, CTA, dialog) respondan al toggle.

## Cambios a implementar
- `src/app/catalog/CatalogClient.tsx`
  - Sustitución de clases `neutral-*` hardcodeadas por clases semánticas theme-aware.
  - Ajuste de estados hover/focus para usar `foreground/background` y `border` semánticos.
  - Mantener consistencia de legibilidad en texto secundario con `muted-foreground`.
- `src/app/catalog/page.tsx`
  - Wrapper del catálogo con `bg-background`.
- `src/app/catalog/layout.tsx`
  - Fondo y texto base con tokens semánticos.

## Criterios de aceptación
- Toggle del navbar cambia visualmente `/catalog` completo (dark/light) sin recargar.
- No quedan superficies principales de catálogo clavadas en dark.
- Contraste de texto y botones se mantiene legible en ambos temas.
- `npm run typecheck` y `npm run build` en verde.

## Pruebas manuales
1. Ir a `http://localhost:3000/catalog`.
2. Cambiar tema varias veces desde el navbar.
3. Validar en ambos modos:
   - Header hero
   - Filtro (abierto/cerrado)
   - Grid y lista
   - Panel sticky de detalle
   - Dialog de Licencias
4. Repetir en mobile (ancho <= 639px).

## Estado de implementación (completado)
- Fecha: 2026-02-24
- Resultado:
  - `CatalogClient` migrado a tokens semánticos de tema (`background/foreground/card/muted/border`).
  - Superficies principales de `/catalog` ya no dependen de `neutral-*` fijos.
  - `src/app/catalog/page.tsx` y `src/app/catalog/layout.tsx` migrados a `bg-background` y `text-foreground`.
  - Interacciones (hover/focus) adaptadas al sistema de color del proyecto.
- Verificación técnica:
  - `npm run typecheck` ✅
  - `npm run build` ✅
