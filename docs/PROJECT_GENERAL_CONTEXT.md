Entiendo. Ahora comprendo muchas cosas y por qué estábamos manteniendo una lógica distinta en Categorías.

Creo que estamos manteniendo una funcionalidad que tal vez no necesitamos del todo, pero necesito que tú me ayudes con la solcuón, porque es muy probable que esté comprendiendo algo mal.
Inicialmente quería hacer catálogos por categoría porque quería tener "Beats" y "Sync" como catálogos con su propia ruta.

En base a eso, creo que aplicamos una lógica diferente en los tags para Categorías.
Yo lo que quería era tener una ruta tipo /sync o /beats para acceder más rápido a cada tipo de música.

Ahora cambié la visión sobre eso.

- En primer lugar, necesito que agregues al contexto, en un archivo llamado /docs/PROJECT_GENERAL_CONTEXT.md: En lynxmedia.cl no habrá venta de BEATS para artistas/raperos. Eso lo haremos en otro proyecto de ODR.
- En ODR Records nos enfocaremos, en cuánto a lo musical, sólo en SYNC LICENSING.

Ahora unas consideraciones para la implementación y planificación:

- Quiero que los _tags de categoría_ tengan la misma lógica que Moods, lo que supongo que significa sacar la lógica de pivote a TrackTags.
- Como ahora tendremos un solo catálogo, categorías será un tag más, ¿Podremos crear un filtro en /catalog que considere las variables principales para filtrar tracks en este contexto?
- /catalog será la página principal de catálogo.
- Ya no necesito /beats o /sync, deja todo limpio para usar esas rutas a futuro sin problemas.
- Tampoco necesito esos botones en /catalog con las Categorías.
- Ya que quitaremos la lógica de pivote, seguramente quedará lógica en código perdido, archivos innecesarios y que pueden llevar a confusiones, bugs, etc. Hay que dejar limpia esta implementación.

## Inventario de rutas y checklist (fuente vigente)

Regla de validación:

- Solo el usuario puede marcar un item como `listo` (`[x]`) de forma explícita.
- Si no hay confirmación explícita del usuario, el estado se mantiene en `pendiente` (`[ ]`).

Referencia única para `/admin/tracks/[id]/edit`:

- Usar exclusivamente la sección `## Inventario operativo actualizado (vigente)`.
- Dentro de esa sección, el bloque oficial es `### 3) Inventario completo de /admin/tracks/[id]/edit (módulos + campos internos)`.

---

/_ EL INVENTARIO DE COMPONENTES REUTILIZABLES VIVE EN `docs/context/COMPONENT_INVENTORY.md` _/

## STAGING (pendiente obligatorio antes de producción)

Estado actual:

- Proyecto en etapa de ajustes funcionales/visuales => **continuar en local**.
- No hacer corte de producción todavía.

Checklist mínimo a validar en staging antes de producción:

- [ ] Cookies/sesión en HTTPS real (`secure`, expiración, logout, invalidación).
- [ ] Flujos auth completos: invite/register/login/forgot/reset/verify-email.
- [ ] Turnstile en entorno público (dominio real permitido).
- [ ] Entregabilidad de correos con dominio real (SPF/DKIM/DMARC).
- [ ] Validación de roles/ownership en rutas protegidas (`ADMIN/STAFF/CREATOR`).
- [ ] Smoke mobile/desktop final sin overflow/regresiones.
- [ ] Monitoreo de errores server y logs de eventos auth/email.
- [ ] Retiro del fallback legacy `admin_session` según plan.

Regla para el asistente (futuro):

- Cuando se cumplan estos gatillos:
  1. auth/email/roles sin bugs bloqueantes por al menos 1 ciclo de smoke,
  2. UI principal de admin estable,
  3. se inicie preparación de release,
     debes emitir una alerta explícita en el chat con este formato:
     `🚨 ALERTA STAGING: es momento de levantar staging antes de producción.`

## PRE PRODUCCIÓN (Pagos) — pendiente después de UI

Decisión actual:

- Se posterga integración de pagos hasta cerrar interfaz de usuario principal.
- Prioridad actual: UX/UI y estabilidad funcional de PLATFORM.

Alcance objetivo (cuando se active pagos):

- Integrar proveedor de pagos para servicios (evaluar Webpay y PayPal).
- No guardar datos de tarjeta en PLATFORM.
- Confirmar estado de pago solo vía backend/webhook firmado.

Checklist técnico mínimo (pendiente):

- [ ] Definir proveedor inicial (`Webpay` o `PayPal`) y ambiente sandbox.
- [ ] Crear modelo Prisma `Payment` (monto, moneda, estado, provider, externalId, idempotencyKey, requestId).
- [ ] Implementar `POST /api/payments/create` (creación de orden desde backend).
- [ ] Implementar `POST /api/payments/webhook/[provider]` (validación de firma + actualización de estado).
- [ ] Implementar ruta de retorno `GET /api/payments/return/[provider]` (solo UX; no confirmar pago por redirect).
- [ ] Aplicar máquina de estados: `PENDING -> APPROVED/FAILED/CANCELED/EXPIRED`.
- [ ] Registrar auditoría de eventos de pago (logs + trazabilidad por `requestId`).
- [ ] Probar idempotencia para evitar doble cobro/doble confirmación.
- [ ] Separar variables por entorno (`sandbox` vs `production`) y documentarlas.

Regla de habilitación:

- No exponer botón de pago en producción hasta completar checklist y smoke end-to-end en staging.

## VISIÓN y DIFERENCIACIÓN DE MERCADO

Objetivo estratégico de ODR (SYNC LICENSING):

- La página de track debe permitir una decisión de compra 100% informada.
- El foco principal comercial es la licencia (no solo el precio).
- La información crítica de términos, límites y condiciones debe estar disponible siempre, en múltiples niveles de lectura.

Principios de producto:

- Transparencia contractual por diseño:
  - Vista resumida (rápida de entender).
  - Vista completa tipo mapa/tabla (detallada y comparable).
  - Vista de contrato (texto del acuerdo).
- Escalabilidad por artista:
  - Cada artista puede definir su propio set de plantillas.
  - Cada track puede asignar una cantidad variable de licencias (operativamente hasta 6).
- Claridad operativa:
  - El usuario no debe adivinar qué incluye una licencia.
  - El artista no debe perder control sobre condiciones específicas por track.

Diferenciación frente a mercado (BeatStars / Airbit / Soundee / Tracktrain y similares):

- En lugar de ocultar o simplificar en exceso condiciones relevantes, PLATFORM/ODR expone estructura completa de términos de forma ordenada y legible.
- La experiencia prioriza sobriedad visual + profundidad informativa:
  - UI minimal y compacta.
  - Capas de detalle accesibles por modal/tabs, sin saturar la vista principal.
- Resultado esperado:
  - Menos fricción comercial por dudas legales.
  - Mejor conversión por claridad.
  - Menos conflictos post-compra por expectativas mal alineadas.

## POR HACER / TO-DO

### Página de venta de merchandising (nuevo pendiente)

Objetivo:

- Crear una línea de venta de merchandising oficial de ODR/PLATFORM (ropa/accesorios) con flujo claro de descubrimiento, detalle de producto y checkout.

Alcance funcional inicial (MVP recomendado):

- Catálogo público de productos en `/merch`.
- Página de detalle por producto en `/merch/[slug]`.
- Variantes por producto (talla/color) + stock por variante.
- Precio, moneda, SKU y estado (`ACTIVE`, `DRAFT`, `ARCHIVED`).
- Carrito básico con persistencia local y resumen de compra.
- Integración de pago en fase posterior (alineada con bloque `PRE PRODUCCIÓN (Pagos)`).

Backoffice mínimo:

- Lista admin de productos en `/admin/merch`.
- CRUD de producto (nombre, descripción, precio, imágenes, variantes, stock, visibilidad).
- Gestión de orden de imágenes y marca de imagen principal.
- Toggle rápido de publicación (`DRAFT`/`ACTIVE`).

Modelo de datos sugerido (pendiente implementación):

- `MerchProduct`: `id`, `slug`, `name`, `description`, `status`, `currency`, `basePrice`, `featured`, `createdAt`, `updatedAt`.
- `MerchVariant`: `id`, `productId`, `sku`, `size`, `color`, `priceOverride`, `stock`, `isEnabled`.
- `MerchImage`: `id`, `productId`, `url`, `alt`, `sortOrder`, `isPrimary`.
- `MerchOrder` + `MerchOrderItem` (activar cuando entre pagos).

Checklist de implementación (pendiente):

- [ ] Definir alcance exacto de tipos de merch del primer release.
- [ ] Diseñar contratos API (`/api/merch/products`, `/api/merch/cart`, `/api/merch/orders`).
- [ ] Crear migración Prisma para modelos de merch.
- [ ] Implementar vistas públicas `/merch` y `/merch/[slug]`.
- [ ] Implementar backoffice `/admin/merch` con List Kit.
- [ ] Conectar pagos/webhooks cuando se habilite el bloque de `PRE PRODUCCIÓN (Pagos)`.
- [ ] Definir política de envíos/devoluciones y reflejarla en UI legal/comercial.

## COMANDOS

### RESET DE DB

> Objetivo: tener un inventario único de comandos para reset/reconstrucción de datos en local.
> Regla práctica: ejecutar solo en desarrollo y confirmar antes si necesitas conservar data.

| Comando | Tipo | Qué hace |
| --- | --- | --- |
| `npm run db:seed:reset` | Reset completo | Borra y repuebla base local con dataset de seed (`RESET_CONFIRM=YES`). |
| `npm run db:catalog:reset-main-tracks` | Reset parcial | Limpia y recarga tracks en la playlist `isMainCatalog=true` (catálogo principal). |
| `npm run db:backfill:playlists` | Backfill | Crea/arregla playlists por defecto (`All Tracks`), `publicId` y main catalog si falta. |
| `npm run db:seed:bulk` | Poblado masivo | Inserta datos dummy masivos para pruebas de listas/performance. |
| `npm run db:seed:modules` | Poblado módulos | Carga datos dummy de módulos operativos (playlists/sound kits/services/contracts). |
| `npm run db:seed:tickets` | Poblado tickets | Inserta tickets dummy para pruebas del módulo Tickets. |
| `npx prisma migrate reset` | Reset Prisma (manual) | Drop/recreate DB + aplica migraciones + seed (si está configurado). Uso manual/avanzado. |

### Otros comandos DB útiles (no reset)

| Comando | Qué hace |
| --- | --- |
| `npm run db:push` | Sincroniza esquema Prisma a DB (sin migración versionada). |
| `npm run db:migrate` | Aplica migraciones pendientes (`prisma migrate deploy`). |
| `npm run db:generate` | Crea/aplica migración en dev (`prisma migrate dev`). |
| `npm run db:studio` | Abre Prisma Studio para inspección/edición de datos. |

## Inventario de componentes reutilizables (proyecto)

Este inventario fue movido a `docs/context/COMPONENT_INVENTORY.md`.

Regla: actualizar inventario de componentes únicamente en ese archivo para evitar desalineación.

## Inventario operativo actualizado (vigente)

Nota:

- Esta sección es la referencia vigente para trabajo de mantenimiento fino.
- Si hay diferencias con listas anteriores del documento, usar esta sección.
- Regla de estado: solo el usuario marca `[x]`; por defecto todo queda en `[ ]`.
- Clasificación de componentes:
  - `[Reusable]`: ya reusable y compartible.
  - `[No reusable]`: específico de una ruta/módulo.
  - `[ R ]`: hoy no reusable, pero conviene extraerlo a reusable.

### 1) Inventario de componentes reutilizables (con internos identificables)

Esta sección también se movió a `docs/context/COMPONENT_INVENTORY.md` (apartado operativo).

Para checklist de componentes reutilizables, usar ese archivo como fuente vigente.

### 2) Inventario completo de `/admin` (Dashboard Admin)

Estado de ruta:

- [ ] Ruta revisada/validada por usuario

#### A. Shell / Layout

- [ ] [No reusable] `src/app/admin/layout.tsx` (entry del layout admin)
- [ ] [No reusable][ R ] `src/components/admin/AdminDashboardLayoutClient.tsx` (wrapper cliente de admin)
- [ ] [Reusable] `DashboardShell` (`src/components/dashboard/DashboardShell.tsx`)
- [ ] [Reusable] `DashboardContent (Main Content)` (`src/components/dashboard/DashboardContent.tsx`)

#### B. Navegación lateral (Sidebar)

- [ ] [Reusable] `DashboardSidebar` (`src/components/dashboard/DashboardSidebar.tsx`)
- [ ] [Reusable] `DashboardMobileSidebar` (`src/components/dashboard/DashboardSidebar.tsx`)
- [ ] [Reusable] Contratos nav (`DashboardNavItem`, `DashboardSection`) en `src/components/dashboard/types.ts`
- [ ] [No reusable][ R ] Config admin de nav (`adminDashboardSections`) en `src/components/dashboard/nav-config.admin.ts`
- [ ] [No reusable][ R ] Agrupaciones de navegación: `General`, `Workspace`, `Licensing`, `System`
- [ ] [No reusable][ R ] Items de navegación admin:
  - [ ] `Overview` (`/admin`)
  - [ ] `Account` (`/admin/account`)
  - [ ] `Tracks` (`/admin/tracks`)
  - [ ] `Uploads` (`/admin/uploads`)
  - [ ] `Playlists` (`/admin/playlists`)
  - [ ] `Sound Kits` (`/admin/sound-kits`)
  - [ ] `Services` (`/admin/services`)
  - [ ] `Requests` (`/admin/licensing`)
  - [ ] `Contracts` (`/admin/contracts`)
  - [ ] `Contact Inbox` (`/admin/requests`)
  - [ ] `Audit Log` (`/admin/audit-log`)
  - [ ] `Settings` (`/admin/settings`)

#### C. Topbar / Breadcrumbs / acciones globales

- [ ] [Reusable] `DashboardTopbar` (`src/components/dashboard/DashboardTopbar.tsx`)
- [ ] [Reusable] `DashboardBreadcrumbs` (`src/components/dashboard/DashboardBreadcrumbs.tsx`)
- [ ] [No reusable][ R ] Acción topbar: botón `Sitio público`
- [ ] [Reusable] Acción topbar: `ThemeToggle`
- [ ] [No reusable][ R ] Acción topbar: `Cerrar sesión` (form POST `/admin/logout`)
- [ ] [No reusable][ R ] Título contextual por ruta activa (mapping desde nav config)

#### D. Drawer mobile

- [ ] [Reusable] `Sheet` + `SheetContent` (ui base)
- [ ] [No reusable][ R ] `SheetTitle` sr-only específico de navegación admin
- [ ] [No reusable][ R ] Estado local `mobileOpen`

#### E. Overview + Placeholders de rutas

- [ ] [No reusable][ R ] Overview page (`src/app/admin/page.tsx`)
- [ ] [No reusable][ R ] Tracks list page (`src/app/admin/tracks/page.tsx`)
- [ ] [No reusable][ R ] Tracks table client (`src/components/admin/tracks/TracksTableClient.tsx`)
- [ ] [No reusable][ R ] `PlaceholderPage` (`src/components/admin/PlaceholderPage.tsx`)
- [ ] [No reusable][ R ] Placeholder `Account` (`src/app/admin/account/page.tsx`)
- [ ] [No reusable][ R ] Lista `Playlists` con List Kit (`src/app/admin/playlists/page.tsx`)
- [ ] [No reusable][ R ] Lista `Sound Kits` con List Kit (`src/app/admin/sound-kits/page.tsx`)
- [ ] [No reusable][ R ] Lista `Services` con List Kit (`src/app/admin/services/page.tsx`)
- [ ] [No reusable][ R ] Lista `Contracts` con List Kit (`src/app/admin/contracts/page.tsx`)
- [ ] [No reusable][ R ] Cliente `PlaylistsTableClient` (`src/components/admin/playlists/PlaylistsTableClient.tsx`)
- [ ] [No reusable][ R ] Cliente `SoundKitsTableClient` (`src/components/admin/sound-kits/SoundKitsTableClient.tsx`)
- [ ] [No reusable][ R ] Cliente `ServicesTableClient` (`src/components/admin/services/ServicesTableClient.tsx`)
- [ ] [No reusable][ R ] Cliente `ContractsTableClient` (`src/components/admin/contracts/ContractsTableClient.tsx`)
- [ ] [No reusable][ R ] Detalle playlist (`src/app/admin/playlists/[id]/page.tsx`)
- [ ] [No reusable][ R ] Detalle sound kit (`src/app/admin/sound-kits/[id]/page.tsx`)
- [ ] [No reusable][ R ] Detalle service (`src/app/admin/services/[id]/page.tsx`)
- [ ] [No reusable][ R ] Detalle contract (`src/app/admin/contracts/[id]/page.tsx`)
- [ ] [No reusable][ R ] Placeholder `Audit Log` (`src/app/admin/audit-log/page.tsx`)
- [ ] [No reusable][ R ] Placeholder `Settings` (`src/app/admin/settings/page.tsx`)

### 3) Inventario completo de `/admin/tracks/[id]/edit` (módulos + campos internos, arquitectura modular vigente)

Estado de ruta:

- [ ] Ruta revisada/validada por usuario

#### A. Nueva estructura de rutas `edit` (vigente)

- [ ] [No reusable] `/admin/tracks/[id]/edit` -> Overview modular (`src/app/admin/tracks/[id]/edit/page.tsx`)
- [ ] [No reusable] `/admin/tracks/[id]/edit/creative` -> Módulo Creativo (`src/app/admin/tracks/[id]/edit/creative/page.tsx`)
- [ ] [No reusable] `/admin/tracks/[id]/edit/rights` -> Módulo Derechos (`src/app/admin/tracks/[id]/edit/rights/page.tsx`)
- [ ] [No reusable] `/admin/tracks/[id]/edit/metadata` -> Módulo Metadata (`src/app/admin/tracks/[id]/edit/metadata/page.tsx`)
- [ ] [No reusable] `/admin/tracks/[id]/edit/deliverables` -> Módulo Entregables (`src/app/admin/tracks/[id]/edit/deliverables/page.tsx`)
- [ ] [No reusable] `/admin/tracks/[id]/edit/review` -> Módulo Review (`src/app/admin/tracks/[id]/edit/review/page.tsx`)
- [ ] [No reusable] `/admin/tracks/[id]/edit/full` -> Vista completa legacy de compatibilidad (`src/app/admin/tracks/[id]/edit/full/page.tsx`)
- [ ] [No reusable] `/admin/track/[id]/edit` -> redirect legacy hacia ruta canonical (`src/app/admin/track/[id]/edit/page.tsx`)

#### B. Shell y navegación compartida de edición

- [ ] [Reusable] `TrackEditShell` (`src/components/admin/track/edit/TrackEditShell.tsx`)
- [ ] [No reusable][ R ] Config de navegación de módulos (`src/components/admin/track/edit/module-nav.ts`)
- [ ] [No reusable][ R ] Cabecera contextual de módulo (acciones de topbar por página `page.tsx`)
- [ ] [No reusable][ R ] Barra sticky de guardado por módulo (`CreativeModuleForm`, `RightsModuleForm`, `MetadataModuleForm`, `DeliverablesModuleForm`)

#### C. Módulo `Overview` (`/edit`)

Componentes por módulo:

- [ ] [No reusable] Página Overview (`src/app/admin/tracks/[id]/edit/page.tsx`)
- [ ] [No reusable][ R ] `StatusChip` (componente local en `page.tsx`)
- [ ] [No reusable][ R ] `ModuleCard` (componente local en `page.tsx`)

Reutilizables usados:

- [ ] [Reusable] `TrackEditShell`
- [ ] [Reusable] `DeleteTrackButton`
- [ ] [Reusable] `TrackAnalyzeHeaderButtons`
- [ ] [Reusable] `Button`

#### D. Módulo `Creativo` (`/edit/creative`)

Componentes por módulo:

- [ ] [No reusable] Página Creative (`src/app/admin/tracks/[id]/edit/creative/page.tsx`)
- [ ] [No reusable][ R ] `CreativeModuleForm` (`src/components/admin/track/edit/CreativeModuleForm.tsx`)
- [ ] [Reusable] `CreativeForm`
- [ ] [Reusable] `MoodChips`
- [ ] [Reusable] `UseChips`
- [ ] [Reusable] `CategoryChips`

Campos internos principales:

- [ ] Input: `title`
- [ ] Input: `artist`
- [ ] Input: `bpm`
- [ ] Input: `key`
- [ ] Select+hidden: `trackType`
- [ ] Textarea: `genres`
- [ ] Textarea: `subgenres`
- [ ] Hidden input: `moods`
- [ ] Hidden input: `uses`
- [ ] Hidden input: `catalogTags`

Reutilizables usados:

- [ ] [Reusable] `TrackEditShell`
- [ ] [Reusable] `FormField`
- [ ] [Reusable] `SaveStateBadge`
- [ ] [Reusable] `EditableIconInput`
- [ ] [Reusable] `NumericSelectInput`
- [ ] [Reusable] `TagChips` (vía wrappers Mood/Use/Category)
- [ ] [Reusable] `Button`
- [ ] [Reusable] `Input`

#### E. Módulo `Derechos` (`/edit/rights`)

Componentes por módulo:

- [ ] [No reusable] Página Rights (`src/app/admin/tracks/[id]/edit/rights/page.tsx`)
- [ ] [No reusable][ R ] `RightsModuleForm` (`src/components/admin/track/edit/RightsModuleForm.tsx`)
- [ ] [Reusable] `RightsFormClient`
- [ ] [Reusable] `PublishingTable`
- [ ] [Reusable] `PublishingCards`
- [ ] [Reusable] `PublishingNewForms`
- [ ] [Reusable] `MasterTable`
- [ ] [Reusable] `MasterCards`
- [ ] [Reusable] `MasterNewForm`
- [ ] [Reusable] `RightsToggles`

Campos internos principales:

- [ ] Hidden input: `publishingShares`
- [ ] Hidden input: `masterShares`
- [ ] WRITER item: `name`, `sortOrder`, `sharePct`, `pro`, `ipiNumber`, `caeNumber`
- [ ] WRITER alta: `newWriter.name`, `newWriter.sharePct`, `newWriter.ipiNumber`, `newWriter.pro`, `newWriter.caeNumber`
- [ ] PUBLISHER item: `name`, `sortOrder`, `sharePct`, `pro`, `ipiNumber`, `caeNumber`
- [ ] PUBLISHER alta: `newPublisher.name`, `newPublisher.sharePct`, `newPublisher.ipiNumber`, `newPublisher.pro`, `newPublisher.caeNumber`
- [ ] MASTER item: `name`, `sortOrder`, `sharePct`, `contact`, `notes`
- [ ] MASTER alta: `newMaster.name`, `newMaster.sharePct`, `newMaster.contact`, `newMaster.notes`
- [ ] Toggles/campos: `mfn`, `oneStop`, `clearedForSync`, `contentIdEnrolled`, `contentIdAdmin`, `contentIdWhitelist`, `master`, `restrictions`

Reutilizables usados:

- [ ] [Reusable] `TrackEditShell`
- [ ] [Reusable] `FormField`
- [ ] [Reusable] `SaveStateBadge`
- [ ] [Reusable] `EditableIconInput`
- [ ] [Reusable] `NumericSelectInput`
- [ ] [Reusable] `Button`
- [ ] [Reusable] `Input`
- [ ] [Reusable] `Textarea`
- [ ] [Reusable] `Checkbox`
- [ ] [Reusable] `Label`
- [ ] [Reusable] `Dialog`

#### F. Módulo `Metadata` (`/edit/metadata`)

Componentes por módulo:

- [ ] [No reusable] Página Metadata (`src/app/admin/tracks/[id]/edit/metadata/page.tsx`)
- [ ] [No reusable][ R ] `MetadataModuleForm` (`src/components/admin/track/edit/MetadataModuleForm.tsx`)
- [ ] [Reusable] `IdsForm`
- [ ] [Reusable] `SyncMetaForm`

Campos internos principales:

- [ ] Input: `isrc`
- [ ] Input: `iswc`
- [ ] Input: `upc`
- [ ] Select+hidden: `licenseType`
- [ ] Input: `exclusiveTermMonths`
- [ ] Input: `mediaBuy`
- [ ] Textarea: `exclusiveTerritories`
- [ ] Textarea: `restrictedTerritories`
- [ ] Textarea: `restrictedIndustries`
- [ ] Textarea: `restrictedPlatforms`
- [ ] Textarea: `restrictedBrands`
- [ ] Textarea: `restrictions`
- [ ] Select+hidden: `pricingTier`
- [ ] Input: `budgetMin`
- [ ] Input: `budgetMax`
- [ ] Select+hidden: `budgetCurrency`

Reutilizables usados:

- [ ] [Reusable] `TrackEditShell`
- [ ] [Reusable] `FormField`
- [ ] [Reusable] `EditableIconInput`
- [ ] [Reusable] `NumericSelectInput`
- [ ] [Reusable] `Select`
- [ ] [Reusable] `Input`
- [ ] [Reusable] `Textarea`
- [ ] [Reusable] `Button`

#### G. Módulo `Entregables` (`/edit/deliverables`)

Componentes por módulo:

- [ ] [No reusable] Página Deliverables (`src/app/admin/tracks/[id]/edit/deliverables/page.tsx`)
- [ ] [No reusable][ R ] `DeliverablesModuleForm` (`src/components/admin/track/edit/DeliverablesModuleForm.tsx`)
- [ ] [Reusable] `DeliverablesForm`

Campos internos principales:

- [ ] Textarea: `versions`
- [ ] Textarea: `stems`

Reutilizables usados:

- [ ] [Reusable] `TrackEditShell`
- [ ] [Reusable] `FormField`
- [ ] [Reusable] `Textarea`
- [ ] [Reusable] `Button`

#### H. Módulo `Review` (`/edit/review`)

Componentes por módulo:

- [ ] [No reusable] Página Review (`src/app/admin/tracks/[id]/edit/review/page.tsx`)
- [ ] [No reusable][ R ] Cards resumen locales (Creativo/Derechos/Metadata+Entrega)

Reutilizables usados:

- [ ] [Reusable] `TrackEditShell`
- [ ] [Reusable] `TrackAnalyzeHeaderButtons`
- [ ] [Reusable] `Button`

#### I. Ruta de compatibilidad `full` (`/edit/full`)

Componentes por módulo:

- [ ] [No reusable] Página Full legacy (`src/app/admin/tracks/[id]/edit/full/page.tsx`)
- [ ] [Reusable] `TrackEditForm` (orquestador legacy)
- [ ] [Reusable] `AudioAnalysisSection`

Alcance funcional de compatibilidad:

- [ ] Guardado global `Guardar todo`
- [ ] Edición integral en una sola vista (fallback)
- [ ] Navegación modular con acceso a `Vista completa`

### 4) Plantilla de checklist para nuevas rutas

```md
### Ruta: `/ruta/a/trabajar`

Fecha de confirmación: `pendiente`

Módulos:

- [ ] Módulo A
- [ ] Módulo B

Campos internos:

- [ ] Campo 1
- [ ] Campo 2
```
