# 051 - Home V2 Theme Audit + Viewport Theme Scopes

## Objetivo

- Auditar inconsistencias de tema en el home activo.
- Asegurar que los viewports 1 y 3 se vean en el modo global elegido por el usuario.
- Asegurar que los viewports 2 y 4 se vean en el modo opuesto al global.

## Hallazgos

- El tema global se controla con la clase `light` en `<html>`.
- Dark es el default de `:root`; light se activa con `html.light`.
- Los viewports no usan tokens de la misma forma:
  - Viewports 1, 3 y 4 usan composiciones invertidas (`bg-foreground text-background`).
  - Viewport 2 usa composición directa (`bg-background`).
- Por eso no basta con aplicar una clase uniforme por número de viewport; hay que considerar cómo cada variante consume los tokens.
- El viewport 1 mantenía un overlay con degradado, contrario a la decisión visual actual de usar fondos y capas planas.
- El viewport 2 quedaba con contraste débil en modo opuesto porque algunos textos secundarios usaban `text-muted-foreground`.

## Cambios implementados

- Se agregaron scopes locales de tema en `src/styles/globals.css`:
  - `.home-theme-light`
  - `.home-theme-dark`
  - `.home-theme-inverse`
- `HomeVariantExplorer` aplica `home-theme-inverse` a los viewports 1, 2 y 3.
- El viewport 4 queda sin scope local porque su propia composición con `bg-foreground text-background` ya lo muestra invertido respecto al tema global.
- `HomeVariantEditorialWall` reemplaza el overlay con degradado y la foto full-bleed de fondo por una composición plana con bloques geométricos.
- `HomeVariantSignalBoard` usa contraste explícito con `text-foreground` y `text-foreground/70` para evitar textos ilegibles en 2/4.

## Resultado esperado

- Si el sitio está en dark:
  - Viewports 1 y 3 se ven dark.
  - Viewports 2 y 4 se ven light.
- Si el sitio está en light:
  - Viewports 1 y 3 se ven light.
  - Viewports 2 y 4 se ven dark.

## Validacion

- [x] `npm run typecheck`
- [x] Smoke test `/`
- [ ] Revisión manual en dark mode.
- [ ] Revisión manual en light mode.

## Registro de avances

- 2026-06-02
  - Fase completada: auditoría de tokens y scopes locales de tema.
  - Archivos tocados:
    - `src/styles/globals.css`
    - `src/components/home-v2/HomeVariantExplorer.tsx`
  - Validacion ejecutada:
    - `npm run typecheck` OK.
    - Smoke test HTTP OK en `/`, `/about-us`, `/catalog`.
  - Estado: pendiente de revisión visual manual en dark/light.

- 2026-06-02
  - Fase completada: corrección visual de fondos planos y legibilidad del viewport 2.
  - Archivos tocados:
    - `src/components/home-v2/HomeVariantEditorialWall.tsx`
    - `src/components/home-v2/HomeVariantSignalBoard.tsx`
    - `docs/plans/051-home-v2-theme-audit.md`
  - Validacion ejecutada:
    - `npm run typecheck` OK.
    - Búsqueda de degradados en viewports activos OK, sin coincidencias.
  - Estado: pendiente de revisión visual manual en navegador.

- 2026-06-02
  - Fase completada: corrección estricta del viewport 1 para eliminar lectura visual de degradado.
  - Archivos tocados:
    - `src/components/home-v2/HomeVariantEditorialWall.tsx`
    - `docs/plans/051-home-v2-theme-audit.md`
  - Validacion ejecutada:
    - `npm run typecheck` OK.
    - Búsqueda local en `HomeVariantEditorialWall` OK, sin `Image` ni clases de degradado.
  - Estado: pendiente de revisión visual manual en navegador.
