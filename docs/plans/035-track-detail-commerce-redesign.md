# 035 - Track Detail Commerce Redesign (Catalog + Track Page)

## 1) Resumen
Objetivo: alinear `/catalog` y `/track/[id]` para que el flujo de descubrimiento y compra/licenciamiento de beats sea claro, rápido y comercialmente útil.

Resultado esperado:
- El panel de detalle en `/catalog` es más funcional y ocupa mejor el espacio.
- El catálogo muestra 5 tracks por fila en desktop.
- `/track/[id]` se convierte en una ficha comercial completa (preview + metadata musical + términos/licencia + entregables + tracks relacionados).
- La experiencia se mantiene usable en mobile y desktop.

---

## 2) Problemas detectados
1. El detalle de `/catalog` tenía poca jerarquía visual y aprovechaba mal el alto.
2. El grid del catálogo en desktop quedaba corto para volumen de tracks.
3. La página actual de `/track/[id]` usa una interacción centrada en modal y se percibe menos orientada a compra.
4. La metadata de licensing existe en DB pero no estaba presentada como bloque comercial claro para el usuario final.

---

## 3) Objetivos UX
1. **Escaneo rápido**: en 5–8 segundos el usuario debe entender qué beat es, cuánto dura, qué vibe tiene y cómo licenciarlo.
2. **Decisión informada**: mostrar restricciones, tipo de licencia y rango presupuestario en formato legible.
3. **Acciones claras**: reproducir, ver detalles, iniciar contacto/licencia, volver al catálogo.
4. **Consistencia visual**: mantener paleta base negra del proyecto y lenguaje visual del catálogo.

---

## 4) Alcance de implementación
### 4.1 `/catalog`
- Cambiar CTA de panel detalle: `Ir al álbum` → `Ver detalles`.
- Cover de detalle pasa de cuadrado a rectángulo (aprox 2:1).
- Reorganizar bloque de detalle con mejor distribución de información.
- Ensanchar el panel detalle y reducir ancho relativo del grid.
- Grid desktop de catálogo con 5 tracks por fila.

### 4.2 `/track/[id]`
- Reemplazar layout actual por una ficha comercial en secciones:
  - Hero comercial (cover, título, artista, reproducción, CTA principal).
  - Resumen técnico rápido (BPM, key, duración, tipo de track, géneros).
  - Condiciones de licencia y restricciones (one-stop, sync, territorios, uso, etc.).
  - Entregables (versiones y stems).
  - Derechos / publishing (writer, publisher, IDs ISRC/ISWC).
  - Tracks similares como continuación del funnel.
- Mantener `LicensingDialog` como CTA funcional de contacto/licencia.
- Evitar dependencias de UI confusas (modales para metadata principal).

### 4.3 Documentación
- Registrar este plan en `docs/plans/035-track-detail-commerce-redesign.md`.

---

## 5) Modelo de datos y mapeo (sin migraciones)
Se reutilizan campos existentes de `Track` y relaciones:
- Musical: `durationSec`, `bpm`, `key`, `trackType`, `genres`, `subgenres`.
- Derechos/licensing: `licenseType`, `oneStop`, `clearedForSync`, `exclusiveTerritories`, `exclusiveTermMonths`, `restricted*`, `mediaBuy`.
- Pricing: `pricingTier`, `budgetMin`, `budgetMax`, `budgetCurrency`.
- IDs: `master`, `isrc`, `iswc`.
- Publishing: `publishingSplit`, `publishingShares[]`.
- Entregables: `versions[]`, `stems[]`.

No se agregan tablas ni migraciones en esta fase.

---

## 6) Cambios técnicos detallados
### 6.1 Catalog
Archivo: `src/app/catalog/CatalogClient.tsx`
- Ajustar layout principal del grid + panel detalle.
- Ajustar columnas del grid de tracks (desktop = 5).
- Rediseñar bloque de detalle (cover 2:1, métricas en cards, CTA actualizado).

### 6.2 Track page
Archivos:
- `src/app/track/[id]/page.tsx`
- `src/app/track/[id]/TrackHero.tsx` (rework completo orientado a ficha comercial)

Acciones:
- Sustituir interacción de metadata por modal a secciones visibles en página.
- Organizar la ficha en bloques con títulos y labels consistentes.
- Mantener reproducción y CTA de licencia en el primer viewport desktop.
- Preservar datos similares para cross-navigation hacia catálogo.

---

## 7) Criterios de aceptación (Definition of Done)
1. En `/catalog`, el botón del panel dice `Ver detalles`.
2. En `/catalog`, la imagen de detalle es rectangular y no cuadrada.
3. En `/catalog`, el grid en desktop muestra 5 cards por fila.
4. En `/catalog`, el panel detalle es visualmente más ancho y el contenido queda mejor distribuido.
5. En `/track/[id]`, existe layout nuevo orientado a compra/licencia (sin depender de modal para metadata principal).
6. En `/track/[id]`, se muestran claramente: metadata musical, licensing/restricciones, entregables, derechos, CTA.
7. `npm run typecheck` pasa sin errores.
8. `npm run build` pasa sin errores.

---

## 8) Plan de validación
1. Validación estática:
- `npm run typecheck`
- `npm run build`

2. Validación funcional manual:
- Ir a `/catalog` y verificar:
  - 5 columnas desktop.
  - panel detalle (cover 2:1, CTA correcto, info legible).
- Abrir un track desde el catálogo y verificar `/track/[id]`:
  - reproducción,
  - bloques comerciales visibles,
  - LicensingDialog operativo,
  - navegación de retorno y tracks similares.

3. Validación responsive:
- Revisar mobile (aprox 390px) y desktop (>1280px).

---

## 9) Riesgos y mitigaciones
1. **Riesgo**: sobrecargar la ficha con demasiada metadata.
- Mitigación: separar en bloques y usar labels cortos + fallback `—`.

2. **Riesgo**: ruptura visual por URLs de cover externas.
- Mitigación: fallback estable de cover y uso consistente de rendering de imagen.

3. **Riesgo**: regresiones en flujo de audio preview.
- Mitigación: mantener lógica de `PublicAudioBar` y test manual en catálogo + track page.

---

## 10) Estado de avance de esta tarea
- [x] Plan creado
- [x] Cambios base en `/catalog`
- [x] Rediseño completo `/track/[id]`
- [x] Typecheck
- [x] Build (validado tras limpiar caché de build local y recompilar)
- [x] Ajustes finales

---

## 11) Pruebas de mañana (URLs directas)

### 11.1 Arranque local
1. Ejecutar: `npm run dev`
2. Abrir: `http://localhost:3000/catalog`

Si quieres verlo en teléfono (misma red WiFi):
- `http://192.168.100.5:3000/catalog`

### 11.2 Checklist rápida de catálogo
URL: `http://localhost:3000/catalog`

Verificar:
1. Grid de catálogo en desktop con **5 tracks por fila**.
2. Panel derecho más ancho que antes.
3. En panel derecho, cover en formato rectangular (no cuadrado).
4. Botón principal del panel dice **Ver detalles**.
5. Al filtrar sin resultados, botón **Limpiar filtros** devuelve foco al campo de búsqueda.

### 11.3 Navegación a track individual
Desde `/catalog`, hacer click en **Ver detalles** de cualquier track.

URLs sugeridas de prueba (si tienes seed cargado):
- `http://localhost:3000/track/seed-001`
- `http://localhost:3000/track/seed-005`

Verificar:
1. Carga sin error de aplicación.
2. Se ve el nuevo hero comercial (cover, play, copiar link, botón de licenciar).
3. Se ve waveform y reproduce audio.
4. Secciones visibles (sin modal):  
   - Opciones de licencia  
   - Términos clave  
   - Metadata musical  
   - Restricciones de uso  
   - Derechos y autores  
   - Entregables  
   - Piezas similares

### 11.4 Smoke responsive
Desktop:
- `http://localhost:3000/catalog`
- `http://localhost:3000/track/seed-001`

Mobile (390x844):
- `http://localhost:3000/catalog`
- `http://localhost:3000/track/seed-001`

Verificar:
1. No hay solapes con navbar.
2. Tipografía y botones legibles.
3. Scroll fluido y bloques ordenados.

### 11.5 Validación técnica (terminal)
Ejecutar en este orden:
1. `npm run build`
2. `npm run typecheck`
3. (Importante) no correrlos en paralelo.

Resultado esperado:
- Ambos comandos deben terminar sin errores.
