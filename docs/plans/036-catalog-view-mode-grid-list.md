# 36 - Catalog View Mode (Grid / Lista)

## 1) Objetivo
Implementar un sistema de vista conmutables para el catálogo público (`/catalog`) que permita alternar entre:
- Vista `Grid` (actual)
- Vista `Lista` (nueva)

Debe ser sólido, mantenible y consistente con el diseño actual, sin romper:
- reproducción de audio,
- selección de track,
- panel de detalle,
- filtros existentes.

---

## 2) Problema actual
Actualmente el catálogo se presenta solo en grid de cards. Algunos usuarios prefieren una vista tipo lista para escaneo rápido cuando hay muchos tracks.

---

## 3) Solución propuesta
### 3.1 Estado de vista
Agregar un estado explícito y tipado:
- `CatalogViewMode = "grid" | "list"`

### 3.2 Persistencia de preferencia
Persistir la preferencia en `localStorage` para mantenerla entre recargas:
- key: `catalog:view-mode`

Comportamiento:
- Si existe preferencia válida en localStorage, se usa.
- Si no existe, default `grid`.
- En modo `compact` (usado en secciones embebidas como similares), forzar `grid` para no introducir UX inconsistente ahí.

### 3.3 Ubicación del control
Agregar el switch `Grid / Lista` dentro del bloque de filtros (lado derecho junto a contador y botón limpiar), con:
- icono + texto,
- estado activo visual,
- `aria-pressed` para accesibilidad.

### 3.4 Render condicional
Mantener ambos layouts dentro de `CatalogClient`:
- `grid`: layout actual de cards.
- `list`: filas compactas con:
  - portada pequeña,
  - título + artista,
  - metadata rápida (duración/BPM/key),
  - botón play/pause,
  - selección de track al click.

La lista debe reutilizar la misma lógica funcional del grid:
- `playTrack(track)`
- `setSelectedTrackId(track.id)`
- barra de progreso por track activo.

---

## 4) Cambios técnicos
### 4.1 Archivo principal
- `src/app/catalog/CatalogClient.tsx`

Cambios:
1. Tipos nuevos (`CatalogViewMode`) + helper validator.
2. Estado `viewMode` + lectura/escritura en localStorage.
3. Control de UI para conmutar vista.
4. Render condicional de tracks (`grid`/`list`).
5. Funciones helper para metadatos de lista (duración/BPM/key).

### 4.2 No se requieren cambios en DB
- Sin migraciones.
- Sin cambios en API.

---

## 5) Criterios de aceptación
1. En `/catalog` existe un selector visible para alternar `Grid` y `Lista`.
2. Al cambiar a `Lista`, los tracks se renderizan en filas (no cards grid).
3. Reproducir/pausar funciona igual en ambas vistas.
4. Selección de track funciona igual y actualiza panel de detalle.
5. La preferencia de vista persiste tras recargar la página.
6. En modos compactos (embebidos), no se rompe la UI y se mantiene comportamiento esperado.
7. `npm run typecheck` sin errores.
8. `npm run build` sin errores.

---

## 6) Riesgos y mitigación
1. **Riesgo**: duplicar lógica entre grid y lista.
- Mitigación: centralizar handlers (`playTrack`, `setSelectedTrackId`) y mantener render-only por vista.

2. **Riesgo**: ruptura visual en responsive.
- Mitigación: list layout móvil primero y validación manual en desktop/mobile.

3. **Riesgo**: estado de vista inválido en localStorage.
- Mitigación: validador estricto y fallback a `grid`.

---

## 7) Validación técnica
1. `npm run typecheck`
2. `npm run build`

---

## 8) Estado
- [x] Plan creado
- [x] Implementación grid/list
- [x] Typecheck
- [x] Build
- [x] Instrucciones finales de prueba

---

## 9) Pruebas manuales (con URLs directas)

### 9.1 Arranque
1. Ejecutar: `npm run dev`
2. Abrir: `http://localhost:3000/catalog`
3. En teléfono (misma red): `http://192.168.100.5:3000/catalog`

### 9.2 Verificación del switch Grid / Lista
URL: `http://localhost:3000/catalog`

Pasos:
1. Revisar barra de filtros (lado derecho): debe aparecer el switch con iconos `grid` y `lista`.
2. En modo `grid`:
   - Ver cards en grilla.
   - Desktop: 5 tracks por fila.
3. Cambiar a modo `lista`:
   - Ver filas horizontales (cover pequeño + info + botón play).
   - Selección de track al hacer click en fila.
   - Reproducción funcional desde botón play/pause de cada fila.
4. Recargar la página (`F5`):
   - Debe mantenerse la última vista elegida (persistencia en localStorage).

### 9.3 Verificación con panel de detalle
URL: `http://localhost:3000/catalog`

Pasos:
1. Seleccionar un track en `grid` y confirmar que actualiza panel derecho.
2. Cambiar a `lista` y seleccionar otro track.
3. Confirmar que panel derecho sigue actualizando bien (cover, controles, metadata, CTA).

### 9.4 Flujo hacia track individual
Desde `/catalog`, en panel derecho usar `Ver detalles`.

URLs sugeridas:
- `http://localhost:3000/track/seed-001`
- `http://localhost:3000/track/seed-005`

Validar:
1. Carga sin error.
2. Audio reproduce.
3. Layout de detalle se mantiene intacto (no regresión por cambio grid/list).

### 9.5 Validación técnica en terminal
Ejecutar en este orden (no paralelo):
1. `npm run build`
2. `npm run typecheck`

Resultado esperado:
- Ambos comandos terminan sin errores.
