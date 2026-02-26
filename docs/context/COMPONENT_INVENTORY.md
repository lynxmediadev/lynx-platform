# Inventario de Componentes (PLATFORM)

Fuente: migrado desde `docs/PROJECT_GENERAL_CONTEXT.md` el 2026-02-20.

## Alcance

- Este archivo centraliza el inventario de componentes y piezas reutilizables de PLATFORM.
- La sección de contexto general mantiene referencias y rutas operativas, pero no duplica este inventario.

## Inventario de componentes reutilizables (proyecto)

### 1) UI base global (`src/components/ui`)

| Componente      | Ruta                                    | Uso principal                  | Estado |
| --------------- | --------------------------------------- | ------------------------------ | ------ |
| Accordion       | `src/components/ui/accordion.tsx`       | Contenedores expandibles       | Activo |
| Badge           | `src/components/ui/badge.tsx`           | Etiquetas de estado            | Activo |
| Button          | `src/components/ui/button.tsx`          | Botón base del proyecto        | Activo |
| Card            | `src/components/ui/card.tsx`            | Contenedor visual base         | Activo |
| Checkbox        | `src/components/ui/checkbox.tsx`        | Selección booleana             | Activo |
| Dialog          | `src/components/ui/dialog.tsx`          | Modales/confirmaciones         | Activo |
| DropdownMenu    | `src/components/ui/dropdown-menu.tsx`   | Menús contextuales             | Activo |
| Input           | `src/components/ui/input.tsx`           | Campo de texto base            | Activo |
| Label           | `src/components/ui/label.tsx`           | Etiqueta accesible de campos   | Activo |
| Select          | `src/components/ui/select.tsx`          | Selector de opciones           | Activo |
| Separator       | `src/components/ui/separator.tsx`       | Separadores visuales           | Activo |
| Sheet           | `src/components/ui/sheet.tsx`           | Panel lateral/drawer           | Activo |
| Slider          | `src/components/ui/slider.tsx`          | Rango deslizante               | Activo |
| Tabs            | `src/components/ui/tabs.tsx`            | Navegación por pestañas        | Activo |
| Textarea        | `src/components/ui/textarea.tsx`        | Texto multilínea base          | Activo |
| Tooltip         | `src/components/ui/tooltip.tsx`         | Ayudas contextuales            | Activo |
| useToast        | `src/components/ui/use-toast.ts`        | Hook de notificaciones         | Activo |
| TagChips        | `src/components/ui/TagChips.tsx`        | Sistema genérico de tags/chips | Activo |
| CopyButton      | `src/components/ui/CopyButton.tsx`      | Copiar texto con feedback      | Activo |
| CopyIconButton  | `src/components/ui/CopyIconButton.tsx`  | Copiar vía botón ícono         | Activo |
| AudioPlayer     | `src/components/ui/AudioPlayer.tsx`     | Reproductor de audio UI        | Activo |
| AudioPlayerDemo | `src/components/ui/AudioPlayerDemo.tsx` | Demo/uso de AudioPlayer        | Activo |
| CatalogCardUI   | `src/components/ui/catalog/card.tsx`    | Card visual de catálogo        | Activo |

### 2) UI admin compartida (`src/components/admin/ui`)

| Componente         | Ruta                                             | Uso principal                                             | Estado |
| ------------------ | ------------------------------------------------ | --------------------------------------------------------- | ------ |
| FormField          | `src/components/admin/ui/FormField.tsx`          | Envoltura estándar de campos admin                        | Activo |
| FormField2         | `src/components/admin/ui/FormField2.tsx`         | Variante antigua de FormField                             | Legacy |
| SaveStateBadge     | `src/components/admin/ui/SaveStateBadge.tsx`     | Estado corto de guardado/error                            | Activo |
| EditableIconInput  | `src/components/admin/ui/EditableIconInput.tsx`  | Input bloqueado con ícono editar y foco automático        | Activo |
| NumericSelectInput | `src/components/admin/ui/NumericSelectInput.tsx` | Input numérico sin spinners con select-all en click/focus | Activo |

### 3) Módulos reutilizables del editor de track (`src/components/admin/track`)

| Componente           | Ruta                                                      | Uso principal                  | Estado |
| -------------------- | --------------------------------------------------------- | ------------------------------ | ------ |
| TagModule            | `src/components/admin/track/TagModule.tsx`                | Wrapper de módulos de tags     | Activo |
| MoodChips            | `src/components/admin/track/MoodChips.tsx`                | Gestión de tags de moods       | Activo |
| UseChips             | `src/components/admin/track/UseChips.tsx`                 | Gestión de tags de usos        | Activo |
| CategoryChips        | `src/components/admin/track/CategoryChips.tsx`            | Gestión de tags de categorías  | Activo |
| CreativeForm         | `src/components/admin/track/CreativeForm.tsx`             | Módulo creativo del edit       | Activo |
| IdsForm              | `src/components/admin/track/IdsForm.tsx`                  | ISRC/ISWC/UPC                  | Activo |
| SyncMetaForm         | `src/components/admin/track/SyncMetaForm.tsx`             | Metadata comercial/sync        | Activo |
| DeliverablesForm     | `src/components/admin/track/DeliverablesForm.tsx`         | Entregables (versiones/stems)  | Activo |
| AudioAnalysisSection | `src/components/admin/track/AudioAnalysisSection.tsx`     | Visualización técnica de audio | Activo |
| CatalogTagsForm      | `src/components/admin/track/CatalogTagsForm.tsx`          | Flujo legacy de tags catálogo  | Legacy |
| DeleteTrackButton    | `src/components/admin/track/DeleteTrackButton.client.tsx` | Borrado de track en admin      | Activo |
| TrackEditForm        | `src/components/admin/track/TrackEditForm.tsx`            | Orquestador global de /edit    | Activo |
| RightsFormClient     | `src/components/admin/track/RightsFormClient.tsx`         | Módulo publishing/master       | Activo |

### 4) Subcomponentes reutilizables de Rights (`src/components/admin/track/rights`)

| Componente         | Ruta                                                       | Uso principal                    | Estado |
| ------------------ | ---------------------------------------------------------- | -------------------------------- | ------ |
| PublishingTable    | `src/components/admin/track/rights/PublishingTable.tsx`    | Tabla desktop writers/publishers | Activo |
| PublishingCards    | `src/components/admin/track/rights/PublishingCards.tsx`    | Cards mobile writers/publishers  | Activo |
| PublishingNewForms | `src/components/admin/track/rights/PublishingNewForms.tsx` | Alta de writer/publisher         | Activo |
| MasterTable        | `src/components/admin/track/rights/MasterTable.tsx`        | Tabla desktop master shares      | Activo |
| MasterCards        | `src/components/admin/track/rights/MasterCards.tsx`        | Cards mobile master shares       | Activo |
| MasterNewForm      | `src/components/admin/track/rights/MasterNewForm.tsx`      | Alta de titular master           | Activo |
| RightsToggles      | `src/components/admin/track/rights/RightsToggles.tsx`      | Toggles de derechos y flags      | Activo |

### 5) Componentes admin reutilizables (licensing/workflow)

| Componente          | Ruta                                           | Uso principal                       | Estado |
| ------------------- | ---------------------------------------------- | ----------------------------------- | ------ |
| AnalyzeActions      | `src/components/admin/AnalyzeActions.tsx`      | Acciones de análisis de solicitudes | Activo |
| AssigneePicker      | `src/components/admin/AssigneePicker.tsx`      | Asignación de responsable           | Activo |
| FollowUpPicker      | `src/components/admin/FollowUpPicker.tsx`      | Programación de seguimiento         | Activo |
| InternalNotesEditor | `src/components/admin/InternalNotesEditor.tsx` | Notas internas con autosave         | Activo |
| PriorityPicker      | `src/components/admin/PriorityPicker.tsx`      | Prioridad del caso                  | Activo |
| QuickAdminActions   | `src/components/admin/QuickAdminActions.tsx`   | Acciones rápidas de workflow        | Activo |
| ReplyTemplates      | `src/components/admin/ReplyTemplates.tsx`      | Plantillas de respuesta             | Activo |
| StatusPicker        | `src/components/admin/StatusPicker.tsx`        | Estado del caso/licencia            | Activo |

### 6) Catálogo y vista pública reutilizable

| Componente          | Ruta                                            | Uso principal                   | Estado |
| ------------------- | ----------------------------------------------- | ------------------------------- | ------ |
| CatalogView         | `src/components/catalog/CatalogView.tsx`        | Vista principal de catálogo     | Activo |
| TrackTags           | `src/components/catalog/TrackTags.tsx`          | Render de tags en catálogo      | Activo |
| CardView            | `src/components/catalog/views/CardView.tsx`     | Modo cards de catálogo          | Activo |
| SplitView           | `src/components/catalog/views/SplitView.tsx`    | Modo split de catálogo          | Activo |
| TableView           | `src/components/catalog/views/TableView.tsx`    | Modo tabla de catálogo          | Activo |
| CatalogFilterBar    | `src/components/public/CatalogFilterBar.tsx`    | Barra de filtros públicos       | Activo |
| TrackCard           | `src/components/public/TrackCard.tsx`           | Card pública de track           | Activo |
| TrackCardWave       | `src/components/public/TrackCardWave.tsx`       | Card con waveform               | Activo |
| TrackCardWavePlayer | `src/components/public/TrackCardWavePlayer.tsx` | Card + reproductor integrado    | Activo |
| TrackMetadataTable  | `src/components/public/TrackMetadataTable.tsx`  | Tabla metadata pública          | Activo |
| PublicPlayer        | `src/components/public/PublicPlayer.tsx`        | Reproductor público principal   | Activo |
| PublicAudioBar      | `src/components/public/PublicAudioBar.tsx`      | Barra de progreso/audio pública | Activo |
| WaveformScrubber    | `src/components/public/WaveformScrubber.tsx`    | Scrubber de waveform            | Activo |
| CopyLinkButton      | `src/components/public/CopyLinkButton.tsx`      | Copiar URL de track/catálogo    | Activo |
| LicensingDialog     | `src/components/public/LicensingDialog.tsx`     | Diálogo de licenciamiento       | Activo |
| PublicLicenseForm   | `src/components/public/PublicLicenseForm.tsx`   | Formulario público de licensing | Activo |
| SimilarTracks       | `src/components/public/SimilarTracks.tsx`       | Tracks relacionados             | Activo |

### 7) Audio reutilizable

| Componente     | Ruta                                      | Uso principal                    | Estado |
| -------------- | ----------------------------------------- | -------------------------------- | ------ |
| LinkedWaveform | `src/components/audio/LinkedWaveform.tsx` | Waveform sincronizado con player | Activo |
| QualityBadges  | `src/components/audio/QualityBadges.tsx`  | Badges de calidad/formatos       | Activo |
| Sparkline      | `src/components/audio/Sparkline.tsx`      | Visual mini de waveform          | Activo |

### 8) Comunes y layout reutilizable

| Componente            | Ruta                                              | Uso principal                  | Estado |
| --------------------- | ------------------------------------------------- | ------------------------------ | ------ |
| ClientOnly            | `src/components/common/ClientOnly.tsx`            | Render sólo en cliente         | Activo |
| ScrollToSectionButton | `src/components/common/ScrollToSectionButton.tsx` | Navegación por secciones       | Activo |
| SmoothScroll          | `src/components/common/SmoothScroll.tsx`          | Scroll suave global            | Activo |
| ThemeToggle (common)  | `src/components/common/ThemeToggle.tsx`           | Cambio de tema                 | Activo |
| Navbar                | `src/components/layout/Navbar.tsx`                | Barra superior principal       | Activo |
| Footer                | `src/components/layout/Footer.tsx`                | Pie de página                  | Activo |
| ThemeProvider         | `src/components/providers/ThemeProvider.tsx`      | Provider de tema               | Activo |
| FrontendShell         | `src/components/site/FrontendShell.tsx`           | Shell del frontend             | Activo |
| SiteHeader            | `src/components/site/SiteHeader.tsx`              | Header del sitio               | Activo |
| ThemeToggle (site)    | `src/components/site/ThemeToggle.tsx`             | Toggle tema en site shell      | Activo |
| SaveButton            | `src/components/forms/SaveButton.tsx`             | Botón reutilizable de guardado | Activo |
| copyable              | `src/components/copyable.tsx`                     | Wrapper para copiar contenido  | Activo |
| whitelist-dialog      | `src/components/whitelist-dialog.tsx`             | Dialog de whitelist            | Activo |

### 9) Dashboard reusable (`src/components/dashboard`)

| Componente                      | Ruta                                                | Uso principal                                                     | Estado |
| ------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------- | ------ |
| DashboardShell                  | `src/components/dashboard/DashboardShell.tsx`       | Shell reusable con sidebar/topbar/content y versión mobile drawer | Activo |
| DashboardSidebar                | `src/components/dashboard/DashboardSidebar.tsx`     | Sidebar desktop + navegación activa por pathname                  | Activo |
| DashboardMobileSidebar          | `src/components/dashboard/DashboardSidebar.tsx`     | Navegación mobile dentro de `Sheet`                               | Activo |
| DashboardTopbar                 | `src/components/dashboard/DashboardTopbar.tsx`      | Topbar con título contextual, breadcrumbs y acciones              | Activo |
| DashboardBreadcrumbs            | `src/components/dashboard/DashboardBreadcrumbs.tsx` | Breadcrumb reusable para rutas dashboard                          | Activo |
| DashboardContent (Main Content) | `src/components/dashboard/DashboardContent.tsx`     | Wrapper de ancho/spacing para contenido dashboard                 | Activo |
| adminDashboardSections          | `src/components/dashboard/nav-config.admin.ts`      | Config centralizada de navegación admin                           | Activo |
| Tipos de contrato nav           | `src/components/dashboard/types.ts`                 | `DashboardNavItem` y `DashboardSection` para escalabilidad        | Activo |

### 10) Admin List Kit reusable (`src/components/admin/list-kit`)

| Componente           | Ruta                                                     | Uso principal                                                                    | Estado |
| -------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------- | ------ |
| AdminListShell       | `src/components/admin/list-kit/AdminListShell.tsx`       | Contenedor base de listas admin (borde/fondo/sombra)                             | Activo |
| AdminListHeader      | `src/components/admin/list-kit/AdminListHeader.tsx`      | Header estándar (título/subtítulo/contador/acciones)                             | Activo |
| AdminListPanel       | `src/components/admin/list-kit/AdminListPanel.tsx`       | Panel interno reutilizable para filtros/bulk/secciones auxiliares                | Activo |
| AdminControlsRow     | `src/components/admin/list-kit/AdminControlsRow.tsx`     | Fila horizontal reutilizable de controles con alineación al bottom               | Activo |
| AdminFilterPanel     | `src/components/admin/list-kit/AdminFilterPanel.tsx`     | Estructura de filtros con título, estado y acciones                              | Activo |
| AdminBulkPanel       | `src/components/admin/list-kit/AdminBulkPanel.tsx`       | Estructura de acciones masivas con estado de selección                           | Activo |
| AdminDataTable       | `src/components/admin/list-kit/AdminDataTable.tsx`       | Tabla tipada por columnas (`AdminColumnDef<T>`)                                  | Activo |
| AdminListButton      | `src/components/admin/list-kit/AdminListButton.tsx`      | Botón unificado de listas (hover/tonos/tamaños row/control/pill)                 | Activo |
| AdminStatusBadge     | `src/components/admin/list-kit/AdminStatusBadge.tsx`     | Badge de estado unificado (`neutral/success/warning/danger`)                     | Activo |
| AdminIconBadge       | `src/components/admin/list-kit/AdminStatusBadge.tsx`     | Badge compacto con ícono + texto + tono (`neutral/success/warning/danger`)       | Activo |
| AdminRoleBadge       | `src/components/admin/list-kit/AdminStatusBadge.tsx`     | Badge compacto de rol con ícono + texto (`ADMIN/STAFF/CREATOR`)                  | Activo |
| AdminListEmptyState  | `src/components/admin/list-kit/AdminListEmptyState.tsx`  | Estado vacío estandarizado                                                       | Activo |
| AdminTableRowActions | `src/components/admin/list-kit/AdminTableRowActions.tsx` | Acciones por fila reutilizables (link/acción local)                              | Activo |
| Tipos list-kit       | `src/components/admin/list-kit/types.ts`                 | `AdminColumnDef`, `AdminRowAction`, `AdminFilterSchema`, `AdminBulkActionSchema` | Activo |

Guía rápida: crear una nueva lista admin con List Kit

1. Crear página server que obtenga datos + filtros desde `searchParams`.
2. En cliente, envolver la vista con `AdminListShell`.
3. Usar `AdminListHeader` para título, contador y acciones principales.
4. Montar filtros con `AdminFilterPanel` (+ `LabeledSelect` si aplica).
5. Si hay operaciones masivas, usar `AdminBulkPanel`.
6. Para desktop, renderizar tabla con `AdminDataTable<T>` + `AdminColumnDef<T>`.
7. Para mobile, mantener cards/paneles compactos sin overflow horizontal.
8. Mostrar estados vacíos con `AdminListEmptyState`.
9. Registrar acciones por fila con `AdminTableRowActions` o botón local.
10. Cerrar con smoke desktop/mobile y validar `typecheck`.

Definición operativa (para evitar ambigüedad):

- Desde ahora, **“List Kit” = vista de lista completa reutilizable**, no solo la tabla.
- Una lista “List Kit compliant” incluye como mínimo:
  1. `AdminListShell`
  2. `AdminListHeader`
  3. `AdminFilterPanel` + `AdminControlsRow`
  4. `AdminBulkPanel` + `AdminControlsRow` (si hay selección masiva)
  5. `AdminDataTable` (desktop) + cards mobile equivalentes
  6. `AdminListButton` + `AdminStatusBadge`/`AdminIconBadge` para interacción y estados

Regla UX/UI obligatoria (List Kit y módulos admin):

- No usar scrollers horizontales por defecto (desktop ni mobile), salvo requerimiento explícito del usuario.
- Los controles deben reflow (wrap) dentro del contenedor antes de forzar overflow.
- En mobile, priorizar cards/stack vertical en vez de tablas con scroll horizontal.
- Mantener legibilidad/accesibilidad: evitar recortes de información y evitar que acciones clave queden fuera de viewport.

Registro vigente de lugares donde usamos listas:

- Listas admin **con List Kit**:
  - `/admin/users` → `src/components/admin/users/UsersTableClient.tsx` (**base visual/fuente de verdad**)
  - `/admin/tracks` → `src/app/admin/tracks/page.tsx` + `src/components/admin/tracks/TracksTableClient.tsx`
  - `/admin/playlists` → `src/app/admin/playlists/page.tsx` + `src/components/admin/playlists/PlaylistsTableClient.tsx`
  - `/admin/sound-kits` → `src/app/admin/sound-kits/page.tsx` + `src/components/admin/sound-kits/SoundKitsTableClient.tsx`
  - `/admin/services` → `src/app/admin/services/page.tsx` + `src/components/admin/services/ServicesTableClient.tsx`
  - `/admin/contracts` → `src/app/admin/contracts/page.tsx` + `src/components/admin/contracts/ContractsTableClient.tsx`
  - `/admin/requests` → `src/app/admin/requests/page.tsx` + `src/app/admin/requests/_client.tsx`
  - `/admin/tickets` → `src/app/admin/tickets/page.tsx` + `src/components/admin/tickets/TicketsTableClient.tsx`
  - `/admin/licensing` → `src/app/admin/licensing/page.tsx` + `src/app/admin/licensing/_client.tsx`

- Listas/table-like **fuera de List Kit** (legacy o secundarias):
  - bloque “Invitaciones activas” dentro de `/admin/users` (`src/app/admin/users/page.tsx`)
  - tablas internas de edición por módulo (rights, deliverables, etc.) en `/admin/tracks/[id]/edit/*`

### 11) Módulos operativos nuevos (Playlists / Sound Kits / Services / Contracts)

Rutas admin activas:

- `src/app/admin/playlists/page.tsx` (lista)
- `src/app/admin/playlists/[id]/page.tsx` (detalle + edición rápida)
- `src/app/admin/sound-kits/page.tsx` (lista)
- `src/app/admin/sound-kits/[id]/page.tsx` (detalle + edición rápida)
- `src/app/admin/services/page.tsx` (lista)
- `src/app/admin/services/[id]/page.tsx` (detalle + edición rápida)
- `src/app/admin/contracts/page.tsx` (lista)
- `src/app/admin/contracts/[id]/page.tsx` (detalle + edición rápida)

Rutas playlist-as-catalog activas:

- `src/app/catalog/page.tsx` (catálogo principal desde playlist main)
- `src/app/playlist/[id]/page.tsx` (vista pública por `publicId`/`slug`/`id`, soporte `?embed=1`)
- `src/app/creator/playlists/page.tsx` (lista creator)
- `src/app/creator/playlists/[id]/page.tsx` (detalle creator)

Clientes List Kit por módulo:

- `src/components/admin/playlists/PlaylistsTableClient.tsx`
- `src/components/admin/sound-kits/SoundKitsTableClient.tsx`
- `src/components/admin/services/ServicesTableClient.tsx`
- `src/components/admin/contracts/ContractsTableClient.tsx`

Editores rápidos por módulo:

- `src/components/admin/playlists/PlaylistDetailEditor.tsx`
- `src/components/admin/playlists/PlaylistTrackManager.tsx`
- `src/components/admin/playlists/PlaylistShareManager.tsx`
- `src/components/admin/sound-kits/SoundKitDetailEditor.tsx`
- `src/components/admin/services/ServiceDetailEditor.tsx`
- `src/components/admin/contracts/ContractDetailEditor.tsx`

APIs admin (CRUD/bulk):

- `/api/admin/playlists`, `/api/admin/playlists/[id]`, `/api/admin/playlists/bulk`
- `/api/admin/playlists/[id]/tracks` (asignar/quitar/reordenar tracks)
- `/api/admin/playlists/[id]/share` (compartir por email + revocar)
- `/api/admin/sound-kits`, `/api/admin/sound-kits/[id]`, `/api/admin/sound-kits/bulk`
- `/api/admin/services`, `/api/admin/services/[id]`, `/api/admin/services/bulk`
- `/api/admin/contracts`, `/api/admin/contracts/[id]`, `/api/admin/contracts/bulk`

Modelos Prisma agregados para estos módulos:

- `Playlist` + pivote `PlaylistTrack` + ACL `PlaylistViewer`
- `SoundKit`
- `ServiceOffer`
- `ContractRecord`

Enums Prisma agregados:

- `PlaylistStatus`, `PlaylistVisibility`
- `SoundKitStatus`
- `ServiceOfferStatus`, `ServiceCategory`
- `ContractStatus`

Contrato playlist-as-catalog (vigente):

- `/catalog` renderiza la playlist marcada como main (`isMainCatalog=true`).
- Existe fallback temporal legacy en `/catalog` con flag `CATALOG_USE_LEGACY=1`.
- `PUBLIC + PUBLISHED` expone playlist públicamente.
- `INTERNAL/PRIVATE` requiere sesión/autorización (owner, admin/staff o compartido por `PlaylistViewer`).

 ### 12) Inventario de trabajo público: `/catalog`

Objetivo de esta sección:

- Tener una foto exacta de las piezas que hoy construyen la experiencia de catálogo.
- Separar explícitamente qué es reusable y qué es específico de la ruta.

| Elemento | Ruta | Tipo | Reuso | Estado |
| --- | --- | --- | --- | --- |
| CatalogPage (orquestador server) | `src/app/catalog/page.tsx` | Ruta pública | No reusable | Activo |
| CatalogClient (surface principal) | `src/app/catalog/CatalogClient.tsx` | Componente de página | No reusable (actual) | Activo |
| Header Hero Slider (autoplay + CTA + Play) | `src/app/catalog/CatalogClient.tsx` | Bloque interno | No reusable | Activo |
| AutoFill de slider (mínimo 10 slides) | `src/app/catalog/CatalogClient.tsx` | Lógica interna | No reusable | Activo |
| Filtro compacto (search, mood, uso, género, BPM) | `src/app/catalog/CatalogClient.tsx` | Bloque interno | No reusable | Activo |
| Toggle vista Grid/Lista (+ `localStorage`) | `src/app/catalog/CatalogClient.tsx` | Bloque interno | Reusable potencial `[ R ]` | Activo |
| Grid de tracks (desktop 5 columnas) | `src/app/catalog/CatalogClient.tsx` | Bloque interno | No reusable | Activo |
| Lista de tracks (modo list) | `src/app/catalog/CatalogClient.tsx` | Bloque interno | No reusable | Activo |
| Panel sticky de detalle seleccionado | `src/app/catalog/CatalogClient.tsx` | Bloque interno | Reusable potencial `[ R ]` | Activo |
| CatalogView (fallback legacy) | `src/components/catalog/CatalogView.tsx` | Componente reusable | Reusable | Activo |
| TrackTags | `src/components/catalog/TrackTags.tsx` | Componente reusable | Reusable | Activo |
| CardView / SplitView / TableView | `src/components/catalog/views/*.tsx` | Componentes reusable | Reusable | Activo |

Dependencias de runtime directas de `/catalog`:

- Resolver de slides activos: `src/lib/banner-promotions/service.ts` (`resolveShowcaseSlides`).
- Registro de eventos hero (view/click/play): `src/app/api/catalog/hero-events/route.ts`.

### 13) Inventario de trabajo público: `/track/[id]`

Objetivo de esta sección:

- Enumerar la ficha comercial de track y sus piezas para iterar diseño/UX sin perder contexto.

| Elemento | Ruta | Tipo | Reuso | Estado |
| --- | --- | --- | --- | --- |
| TrackPublicPage (orquestador + data shaping) | `src/app/track/[id]/page.tsx` | Ruta pública | No reusable | Activo |
| TrackHero | `src/app/track/[id]/TrackHero.tsx` | Componente de página | Reusable potencial `[ R ]` | Activo |
| DefinitionList | `src/app/track/[id]/page.tsx` | Interno de página | Reusable potencial `[ R ]` | Activo |
| Pill (chips metadata/restricciones) | `src/app/track/[id]/page.tsx` | Interno de página | Reusable potencial `[ R ]` | Activo |
| Bloque Opciones de licencia (cards comerciales) | `src/app/track/[id]/page.tsx` | Sección interna | No reusable (actual) | Activo |
| Bloque Términos clave (licensing) | `src/app/track/[id]/page.tsx` | Sección interna | No reusable (actual) | Activo |
| Bloque Metadata musical | `src/app/track/[id]/page.tsx` | Sección interna | No reusable (actual) | Activo |
| Bloque Restricciones de uso | `src/app/track/[id]/page.tsx` | Sección interna | No reusable (actual) | Activo |
| Bloque Derechos y autores | `src/app/track/[id]/page.tsx` | Sección interna | No reusable (actual) | Activo |
| Bloque Entregables (versiones/stems) | `src/app/track/[id]/page.tsx` | Sección interna | No reusable (actual) | Activo |
| Bloque Piezas similares (usa catálogo compacto) | `src/app/track/[id]/page.tsx` | Sección interna | Reusable potencial `[ R ]` | Activo |
| PublicAudioBar (waveform + seek) | `src/components/public/PublicAudioBar.tsx` | Componente reusable | Reusable | Activo |
| CopyLinkButton | `src/components/public/CopyLinkButton.tsx` | Componente reusable | Reusable | Activo |
| LicensingDialog | `src/components/public/LicensingDialog.tsx` | Componente reusable | Reusable | Activo |

Dependencias de runtime directas de `/track/[id]`:

- DB query/composición principal: `src/app/track/[id]/page.tsx`.
- Resolución URL pública de audio (R2/S3/fallback): `src/lib/storage/s3.ts`.
- Reuso de catálogo compacto para similares: `src/app/catalog/CatalogClient.tsx`.

### 14) Módulo admin de showcase/promociones (faltante agregado)

Rutas admin activas:

- `src/app/admin/showcase/page.tsx` (listado de slots)
- `src/app/admin/showcase/slots/[slotId]/page.tsx` (detalle de slot + campañas)
- `src/app/admin/showcase/campaigns/[id]/page.tsx` (editor de campaña y slides)
- `src/app/admin/promotions/banner/page.tsx` (redirect legacy a `/admin/showcase`)

Componentes UI principales:

- `src/components/admin/showcase/ShowcaseSlotsManager.tsx`
- `src/components/admin/showcase/ShowcaseSlotDetailManager.tsx`
- `src/components/admin/showcase/ShowcaseCampaignEditor.tsx`
- `src/components/admin/promotions/BannerPromotionsManager.tsx` (legacy/compat)

APIs asociadas:

- `/api/admin/banner-promotions`
- `/api/admin/banner-promotions/[id]`
- `/api/admin/banner-promotions/[id]/items`
- `/api/catalog/hero-events`


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

#### `EditableIconInput` (`src/components/admin/ui/EditableIconInput.tsx`)

- [ ] Interno: campo base (`Input`) de texto editable/bloqueable
- [ ] Interno: botón ícono editar (`SquarePen`)
- [ ] Prop clave: `value`
- [ ] Prop clave: `onChange(value)`
- [ ] Prop clave: `onCommit(value)` (async/sync)
- [ ] Prop clave: `placeholder`
- [ ] Prop clave: `lockOnInit`
- [ ] Prop clave: `commitOnEnter`
- [ ] Prop clave: `commitOnBlur`
- [ ] Prop clave: `relockOnCommit`
- [ ] Prop clave: `commitIfChanged`
- [ ] Comportamiento: click en ícono desbloquea + focus + select-all
- [ ] Comportamiento: click en input desbloquea sin select-all

#### `NumericSelectInput` (`src/components/admin/ui/NumericSelectInput.tsx`)

- [ ] Interno: input numérico sin spinners nativos
- [ ] Interno: select-all en focus/click
- [ ] Prop clave: `value`
- [ ] Prop clave: `onChange(value)`
- [ ] Prop clave: `onCommit(value)` (async/sync)
- [ ] Prop clave: `min` / `max` / `step`
- [ ] Prop clave: `commitOnEnter`
- [ ] Prop clave: `commitOnBlur`
- [ ] Prop clave: `commitIfChanged`
- [ ] Comportamiento: Enter dispara commit y evita submit global
- [ ] Comportamiento: blur dispara commit (si corresponde)

#### `SaveStateBadge` (`src/components/admin/ui/SaveStateBadge.tsx`)

- [ ] Estado: `idle`
- [ ] Estado: `saving`
- [ ] Estado: `saved`
- [ ] Estado: `error`
- [ ] Labels configurables por prop

#### `TagChips` (`src/components/ui/TagChips.tsx`)

- [ ] Interno: lista de asignados (chips seleccionados)
- [ ] Interno: botón quitar chip asignado (`X`)
- [ ] Interno: botón toggle panel (si `showToggleButton=true`)
- [ ] Interno: panel sugerencias (inline)
- [ ] Interno: input búsqueda
- [ ] Interno: botón limpiar búsqueda (`X`)
- [ ] Interno: botón `Añadir` desde input
- [ ] Interno: CTA `Crear y añadir` (si `allowCreate`)
- [ ] Interno: lista chips sugeridos
- [ ] Interno: botón eliminar sugerido (`X`, si `allowDeleteCatalog`)
- [ ] Interno: diálogo confirmación eliminar sugerido
- [ ] Prop clave: `selected`
- [ ] Prop clave: `onChange(chips)`
- [ ] Prop clave: `fetchAll`
- [ ] Prop clave: `fetchSuggestions`
- [ ] Prop clave: `normalize`
- [ ] Prop clave: `onCreate`
- [ ] Prop clave: `onDeleteCatalog`
- [ ] Prop clave: `renderAboveAssigned`
- [ ] Prop clave: `renderAboveToggle`
- [ ] Prop clave: `defaultOpen` / `showToggleButton`

#### `MoodChips` (`src/components/admin/track/MoodChips.tsx`)

- [ ] Wrapper reusable sobre `TagChips` + `useTagCatalog`
- [ ] Endpoint catálogo: `GET/POST /api/moods`
- [ ] Endpoint asignación: `GET/POST /api/tracks/:id/moods`
- [ ] Normalización: UPPERCASE
- [ ] Interno: botón `Guardar Moods`
- [ ] Interno: hidden input serializado (`name="moods"`)
- [ ] Interno: `onSaveState` para badge de módulo

#### `UseChips` (`src/components/admin/track/UseChips.tsx`)

- [ ] Wrapper reusable sobre `TagChips` + `useTagCatalog`
- [ ] Endpoint catálogo: `GET/POST /api/uses`
- [ ] Endpoint asignación: `GET/POST /api/tracks/:id/uses`
- [ ] Normalización: UPPERCASE (actual)
- [ ] Interno: botón `Guardar Usos`
- [ ] Interno: hidden input serializado (`name="uses"`)
- [ ] Interno: `onSaveState` para badge de módulo

#### `CategoryChips` (`src/components/admin/track/CategoryChips.tsx`)

- [ ] Wrapper reusable sobre `TagChips` + `useTagCatalog`
- [ ] Endpoint catálogo: `GET/POST/DELETE /api/categories`
- [ ] Endpoint asignación: `GET/POST /api/tracks/:id/categories`
- [ ] Normalización: UPPERCASE + `slugify`
- [ ] Interno: botón `Guardar Categorías`
- [ ] Interno: hidden input serializado (`name="catalogTags"` por default en `/edit`)
- [ ] Interno: rehidratación inicial desde API solo si SSR llega vacío
- [ ] Interno: bloqueo delete de categoría si está asignada

#### Subcomponentes Rights reutilizables (`src/components/admin/track/rights/*`)

- [ ] `PublishingTable` (desktop WRITER/PUBLISHER)
- [ ] `PublishingCards` (mobile WRITER/PUBLISHER)
- [ ] `PublishingNewForms` (alta WRITER/PUBLISHER)
- [ ] `MasterTable` (desktop MASTER)
- [ ] `MasterCards` (mobile MASTER)
- [ ] `MasterNewForm` (alta MASTER)
- [ ] `RightsToggles` (toggles/flags derechos)


## Revisión de Cobertura (faltantes detectados)

Resultado de comparación entre `src/components/**/*.{ts,tsx}` y los paths inventariados previamente en `PROJECT_GENERAL_CONTEXT`.

Componentes/archivos no inventariados previamente (33):

- `src/components/admin/list-kit/ListKitTableComposer.tsx`
- `src/components/admin/list-kit/filter-utils.ts`
- `src/components/admin/list-kit/index.ts`
- `src/components/admin/list-kit/selection-utils.ts`
- `src/components/admin/track/edit/ModuleSaveBar.tsx`
- `src/components/admin/track/edit/TrackEditModulePlaceholder.tsx`
- `src/components/admin/track/edit/TrackEditPlaceholderPage.tsx`
- `src/components/admin/track/rights/types.ts`
- `src/components/admin/track/rights/useMasterShares.ts`
- `src/components/admin/track/rights/usePublishingShares.ts`
- `src/components/admin/track/rights/utils.ts`
- `src/components/admin/ui/LabeledSelect.tsx`
- `src/components/admin/users/UsersInviteDialog.tsx`
- `src/components/auth/AuthTurnstileField.tsx`
- `src/components/creator/CreatorDashboardLayoutClient.tsx`
- `src/components/dashboard/ViewAsControl.tsx`
- `src/components/dashboard/nav-config.creator.ts`
- `src/components/home/CatalogSection.tsx`
- `src/components/home/ContactSection.tsx`
- `src/components/home/HeroSection.tsx`
- `src/components/home/HomeDotsNav.tsx`
- `src/components/home/HomeSnap.tsx`
- `src/components/home/PortfolioSection.tsx`
- `src/components/home/ServicesSection.tsx`
- `src/components/home/homeSections.ts`
- `src/components/home/usePrefersReducedMotion.ts`
- `src/components/sections/About.tsx`
- `src/components/sections/Catalog.tsx`
- `src/components/sections/Contact.tsx`
- `src/components/sections/Gallery.tsx`
- `src/components/sections/Hero copy.tsx`
- `src/components/sections/Hero.tsx`
- `src/components/support/SupportTicketDialog.tsx`

## 15) Collection System reusable (Core + Adapters)

Objetivo de esta sección:

- Documentar el sistema plug-and-play para listas `grid/list` + detalle, desacoplado por dominio.
- Registrar qué piezas son genéricas y cuáles son adapter de tracks para `/catalog`.

### Core genérico (`src/components/collection`)

| Componente / Hook | Ruta | Rol | Estado |
| --- | --- | --- | --- |
| `CollectionBrowser` | `src/components/collection/CollectionBrowser.tsx` | Layout reusable de colección (grid/list + detalle) mediante render slots | Activo |
| `CollectionFilterShell` | `src/components/collection/CollectionFilterShell.tsx` | Shell reusable de filtros (mobile colapsable + desktop visible) | Activo |
| `CollectionToolbar` | `src/components/collection/CollectionToolbar.tsx` | Barra reusable (contador, toggle vista, limpiar, toggle filtros mobile) | Activo |
| `useCollectionState` | `src/components/collection/useCollectionState.ts` | Estado reusable de selección y modo vista (controlado/no controlado) | Activo |
| `types` | `src/components/collection/types.ts` | Contratos genéricos (`CollectionViewMode`, render contexts, props core) | Activo |
| `index` | `src/components/collection/index.ts` | API de exports del core | Activo |

### Adapter de tracks (`src/components/catalog/adapters`)

| Componente | Ruta | Rol | Estado |
| --- | --- | --- | --- |
| `TrackCollectionBrowser` | `src/components/catalog/adapters/TrackCollectionBrowser.tsx` | Orquestador adapter que conecta estado/handlers de catálogo al core | Activo |
| `TrackFilterControls` | `src/components/catalog/adapters/TrackFilterControls.tsx` | Controles de filtro específicos de tracks (search/mood/uso/género/BPM) | Activo |
| `TrackGridItem` | `src/components/catalog/adapters/TrackGridItem.tsx` | Render item de track en vista grid | Activo |
| `TrackListItem` | `src/components/catalog/adapters/TrackListItem.tsx` | Render item de track en vista lista | Activo |
| `TrackDetailPanel` | `src/components/catalog/adapters/TrackDetailPanel.tsx` | Panel detalle seleccionado (metadata, acciones y licencias) | Activo |
| `types` + `index` | `src/components/catalog/adapters/types.ts`, `src/components/catalog/adapters/index.ts` | Tipos/exports del adapter | Activo |

### Integración actual

- `src/app/catalog/CatalogClient.tsx`:
  - Mantiene orquestación de dominio (datos, banner, tracking).
  - Delega bloque de filtros + lista grid/list + detalle en `TrackCollectionBrowser`.
- Queda explícitamente fuera del core:
  - Hero/banner.
  - Player sticky global (se monta desde shell).
  - Tracking de hero (`/api/catalog/hero-events`).

## 16) Player global (ODR)

Objetivo de esta sección:

- Dejar trazable la arquitectura de reproducción única para rutas públicas.
- Evitar regresiones donde una vista local vuelva a “adueñarse” del audio.

| Componente / Hook | Ruta | Rol | Estado |
| --- | --- | --- | --- |
| `GlobalPlayerProvider` | `src/components/player/global-player-context.tsx` | Host único de estado + `<audio>` + cola/persistencia | Activo |
| `useGlobalPlayerState` | `src/components/player/global-player-context.tsx` | Lectura de estado global de reproducción | Activo |
| `useGlobalPlayer` | `src/components/player/global-player-context.tsx` | API de control global (play/seek/next/prev/volume/close) | Activo |
| `GlobalPlayerHost` | `src/components/player/GlobalPlayerHost.tsx` | Render visual del player global usando `CatalogBottomPlayerV2` | Activo |
| `FrontendShell` (integración) | `src/components/site/FrontendShell.tsx` | Monta provider/host en rutas públicas y los excluye de `/admin`/`/creator` | Activo |
| `CatalogBottomPlayerV2` | `src/components/catalog/CatalogBottomPlayerV2.tsx` | Skin/UI del player global | Activo |
| `TrackSimpleAudioPlayer` | `src/components/track/TrackSimpleAudioPlayer.tsx` | Control remoto de player global en `/track/[id]` (`queuePolicy: keep`) | Activo |
| `CatalogClient` (integración) | `src/app/catalog/CatalogClient.tsx` | Control remoto en catálogo (`queuePolicy: replace`), sin host local | Activo |
