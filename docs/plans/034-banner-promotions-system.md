# 034 - Banner Promotions System (Catalog Hero Slider)

## 1) Resumen Ejecutivo
Objetivo: transformar el banner de `/catalog` en un sistema editorial profesional, donde admin pueda decidir con precisión qué aparece en el slider (tracks, playlists, sound kits, servicios o links externos), en qué orden, con qué vigencia y con qué CTA.

Resultado esperado:
- El slider ya no depende de datos implícitos del catálogo.
- Existe una fuente única de verdad para promociones activas.
- Admin puede gestionar el banner sin tocar código.
- El sistema escala a múltiples slots de banner sin rediseñar arquitectura.

---

## 2) Objetivos de Producto y Técnicos
Objetivos de producto:
- Permitir promoción manual y controlada de contenido destacado.
- Permitir mezcla de tipos de entidad en un mismo slider.
- Mantener coherencia visual y editorial.
- Permitir programación temporal (inicio y fin).

Objetivos técnicos:
- Alta mantenibilidad: modelo explícito y extensible.
- Eficiencia: resolución de slides en batch, sin N+1.
- Integridad: evitar mostrar entidades no publicables.
- Observabilidad: registrar interacción de usuarios con slides.

---

## 3) Alcance
En alcance (Fase completa de este plan):
- Backend de promociones de banner.
- UI admin para CRUD, orden y programación de slides.
- Integración del slider de `/catalog` para consumir promos activas.
- Métricas de interacción del slider.
- Documentación operativa de uso.

Fuera de alcance (por ahora):
- A/B testing avanzado.
- Segmentación por usuario/país/rol.
- Motor de recomendación automático.

---

## 4) Arquitectura Propuesta
Se introduce una capa editorial dedicada:
- `BannerPromotion`: definición de campaña/colección de slides.
- `BannerPromotionItem`: cada slide individual.
- Resolver de runtime: toma items activos + resuelve targets + aplica fallback.

Ventaja:
- No ensucia `Track`, `Playlist`, `SoundKit`, `ServiceOffer` con campos ad-hoc de banner.
- Todo el control de promoción vive en un módulo único y reusable.

---

## 5) Modelo de Datos (Prisma)
Crear modelos y enums nuevos:

```prisma
enum BannerPlacement {
  CATALOG_HERO
}

enum BannerTargetType {
  TRACK
  PLAYLIST
  SOUND_KIT
  SERVICE_OFFER
  EXTERNAL_URL
}

model BannerPromotion {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  name        String
  placement   BannerPlacement
  isActive    Boolean  @default(true)
  startsAt    DateTime?
  endsAt      DateTime?
  notes       String?
  items       BannerPromotionItem[]

  @@index([placement, isActive, startsAt, endsAt, updatedAt])
}

model BannerPromotionItem {
  id                 String           @id @default(cuid())
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt
  promotionId        String
  promotion          BannerPromotion  @relation(fields: [promotionId], references: [id], onDelete: Cascade)

  targetType         BannerTargetType
  targetId           String?

  titleOverride      String?
  subtitleOverride   String?
  imageUrlOverride   String?
  ctaLabel           String?
  ctaHrefOverride    String?

  sortOrder          Int              @default(0)
  isEnabled          Boolean          @default(true)
  startsAt           DateTime?
  endsAt             DateTime?
  durationMs         Int              @default(5000)

  @@index([promotionId, sortOrder])
  @@index([isEnabled, startsAt, endsAt, sortOrder])
  @@index([targetType, targetId])
}
```

Notas de diseño:
- `targetType + targetId` da flexibilidad para múltiples entidades con una sola tabla.
- `durationMs` permite control por slide, default 5s.
- El sistema soporta múltiples promociones por slot, pero en runtime se prioriza una activa por `placement` (regla definida abajo).

---

## 6) Reglas de Publicación y Elegibilidad
Regla general:
- Un item solo puede salir si está habilitado, dentro de ventana de vigencia y su target existe y es publicable.

Reglas por tipo:
- `TRACK`: existe y tiene `audioUrl` válido; opcionalmente exigir pertenencia a playlist principal pública.
- `PLAYLIST`: `status = PUBLISHED` y `visibility = PUBLIC`.
- `SOUND_KIT`: `status = ACTIVE`.
- `SERVICE_OFFER`: `status = ACTIVE`.
- `EXTERNAL_URL`: debe tener `ctaHrefOverride` y `imageUrlOverride` válidos.

Si no cumple:
- Se descarta en runtime.
- Se registra warning en logs de servidor.

---

## 7) Prioridad y Resolución en Runtime
Resolver del banner:
1. Buscar promociones activas por `placement`.
2. Elegir 1 promoción efectiva por prioridad:
   - `startsAt` más reciente, luego `updatedAt` más reciente.
3. Traer `items` habilitados y vigentes ordenados por `sortOrder`.
4. Resolver targets por tipo en batch.
5. Aplicar overrides (`title`, `subtitle`, `image`, `CTA`) encima del contenido base.
6. Retornar DTO listo para UI.
7. Si no hay items válidos, usar fallback de imágenes/entidades actuales.

DTO de salida sugerido:
- `id`
- `title`
- `subtitle`
- `imageUrl`
- `ctaLabel`
- `ctaHref`
- `playableTrackId` (nullable)
- `durationMs`

---

## 8) API y Server Actions
Rutas admin nuevas:
- `GET /api/admin/banner-promotions?placement=CATALOG_HERO`
- `POST /api/admin/banner-promotions`
- `PATCH /api/admin/banner-promotions/:id`
- `DELETE /api/admin/banner-promotions/:id`
- `POST /api/admin/banner-promotions/:id/items`
- `PATCH /api/admin/banner-promotions/:id/items/:itemId`
- `DELETE /api/admin/banner-promotions/:id/items/:itemId`
- `POST /api/admin/banner-promotions/:id/items/reorder`

Ruta pública interna para resolver slider:
- `GET /api/catalog/hero-slides` (server-only usage recommended).

Revalidación:
- Tras mutaciones admin: `revalidatePath("/catalog")` y `revalidatePath("/admin/promotions/banner")`.

---

## 9) UI Admin (Lugar para Editar el Slider)
Ruta propuesta:
- `/admin/promotions/banner`

Secciones de la pantalla:
1. `Placement selector`:
- Permite elegir slot: por ahora `CATALOG_HERO`.

2. `Promotion header`:
- Nombre de campaña.
- Estado (`isActive`).
- Ventana global (`startsAt`, `endsAt`).

3. `Slides table/reorder`:
- Lista de slides en orden.
- Drag and drop para `sortOrder`.
- Estado de cada slide y vigencia.

4. `Slide editor`:
- Tipo de target.
- Selector por ID o buscador por entidad.
- Overrides de texto e imagen.
- CTA label/href.
- Duración del slide.

5. `Preview`:
- Vista previa mini del slider con contenido real.

---

## 10) Cómo Funciona y Cómo se Usa (Sección Operativa)
Qué hace:
- Este módulo controla exactamente qué se muestra en el slider del catálogo.
- No depende de “featured” sueltos ni de orden implícito de tracks.

Cómo usarlo (flujo admin):
1. Ir a `/admin/promotions/banner`.
2. Seleccionar `CATALOG_HERO`.
3. Crear campaña o editar la activa.
4. Agregar slides:
- Elegir `targetType`.
- Ingresar ID o seleccionar desde buscador.
- Definir CTA y duración.
- (Opcional) override de título/subtítulo/imagen.
5. Ordenar slides con drag and drop.
6. Definir fechas de vigencia.
7. Activar campaña.
8. Verificar resultado en `/catalog`.

Buenas prácticas editoriales:
- Mantener 4 a 8 slides por campaña.
- Usar imagen con buena legibilidad para overlay.
- Evitar textos largos en subtítulo.
- Revisar semanalmente vigencia y contenido expirado.

---

## 11) Integración con Catalog Slider Actual
Cambios en `CatalogClient`:
- Mantener UI del slider ya implementada.
- Reemplazar source actual (`visibleTracks`) por `heroSlides` desde backend.
- `Play` solo cuando slide tenga `playableTrackId`.
- CTA toma `ctaHref` y `ctaLabel` del DTO.
- Duración por slide usa `durationMs` (default 5000).

Fallback:
- Si resolver devuelve vacío, usar fallback actual con covers existentes.

---

## 12) Performance y Eficiencia
Medidas:
- Resolver por lotes por tipo de target.
- Índices en DB para vigencia y orden.
- Evitar joins innecesarios en catálogo principal.
- Entregar DTO ya resuelto al cliente para evitar lógica pesada en browser.
- Usar `cache: no-store` solo donde sea necesario; preferir revalidación por path tras cambios admin.

---

## 13) Seguridad y Permisos
Requisitos:
- CRUD de promociones: solo `ADMIN` y opcional `STAFF` autorizado.
- Validación estricta de input con Zod.
- Sanitización de URLs (`https` y/o rutas internas permitidas).
- Protección contra promoción de contenido privado/no publicado.
- Logging de mutaciones administrativas.

---

## 14) Observabilidad y Métricas
Crear `BannerPromotionEvent`:
- `id`, `createdAt`, `placement`, `itemId`, `eventType`, `sessionId`, `path`.
- `eventType`: `VIEW`, `CLICK_CTA`, `CLICK_PLAY`.

Uso:
- Medir qué slides convierten mejor.
- Identificar slides con bajo rendimiento para reemplazo editorial.

---

## 15) Pruebas Requeridas
Unit:
- Resolver de elegibilidad por tipo.
- Merge de overrides.
- Priorización de promoción activa por placement.

Integration:
- CRUD admin + reorder.
- Vigencia temporal.
- Revalidación de `/catalog`.

E2E:
- Crear slide desde admin y verlo en catálogo.
- Click CTA navega correctamente.
- Click Play dispara audio cuando aplica.

---

## 16) Plan de Implementación por Fases
Fase 1 - Base de datos:
- Añadir modelos/enums Prisma.
- Migración + índices.

Fase 2 - Backend:
- Servicios de resolver de slides.
- Endpoints admin CRUD/reorder.
- Endpoint runtime de lectura.

Fase 3 - Admin UI:
- Página `/admin/promotions/banner`.
- Formulario, listado, reorder, preview.

Fase 4 - Integración frontend:
- Conectar `/catalog` al resolver.
- Mantener fallback.
- Ajustar slider a `durationMs`.

Fase 5 - Métricas y QA:
- Eventos de interacción.
- Tests unit/integration/e2e.
- Hardening de validaciones.

---

## 17) Riesgos y Mitigaciones
Riesgo: promos con targets inválidos.
- Mitigación: validación en guardado + descarte en runtime + warning.

Riesgo: mostrar contenido no publicable.
- Mitigación: reglas de elegibilidad centralizadas por tipo.

Riesgo: desorden editorial.
- Mitigación: panel único, orden explícito y calendario de vigencia.

Riesgo: regresión de performance.
- Mitigación: batch resolver, índices y pruebas de carga básica.

---

## 18) Criterios de Aceptación
1. Admin puede crear, editar, eliminar y ordenar slides para `CATALOG_HERO`.
2. Slider de `/catalog` muestra solo promos activas y elegibles.
3. Cada slide respeta `durationMs` (default 5000).
4. CTA y Play funcionan según tipo de target.
5. Cambios en admin se reflejan en `/catalog` tras revalidación.
6. Existen métricas de `VIEW`, `CLICK_CTA`, `CLICK_PLAY`.
7. Tests críticos de resolver y CRUD pasan.

---

## 19) Decisiones Cerradas
Decisión 1:
- Sistema centralizado de promociones, no flags por entidad.

Decisión 2:
- Modelo flexible `targetType + targetId` para escalar tipos sin migraciones complejas por cada nuevo target.

Decisión 3:
- Slot inicial único: `CATALOG_HERO`, preparado para expansión futura.

Decisión 4:
- Duración por slide configurable, default 5 segundos.

