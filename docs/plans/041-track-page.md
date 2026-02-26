# 041 - Track Page Licenses-First (ODR) + Data Model de Licencias por Track

## Objetivo
Rediseñar `/track/[id]` para que el foco comercial principal sea el sistema de licencias (no pricing genérico), con experiencia sobria y compacta, y base de datos escalable para manejar licencias dinámicas por track.

## Alcance
- Incluye:
  - Modelo Prisma de licencias por track (`LicenseTemplate` + `TrackLicenseAssignment`).
  - Backoffice mínimo para CRUD de plantillas y asignación por track.
  - Rediseño de `/track/[id]` con UI licenses-first.
  - Dummy data de licencias para visualización.
  - Actualización de contexto estratégico en `docs/PROJECT_GENERAL_CONTEXT.md`.
- No incluye:
  - Integración de pagos.
  - Firma digital/flujo legal avanzado.
  - Generación PDF de contrato final.

## Decisiones cerradas
1. Modelo de negocio de licencias: **Plantillas + Asignación**.
2. Máximo operativo de licencias activas por track: **6**.
3. `/track/[id]`:
   - Hero grande y sobrio.
   - Reproductor simple con slider (sin waveform).
   - Entregables en modal (sin sección fija visible).
   - Licencias en modal central con 3 niveles de lectura.
4. Se mantiene el bloque final **Más beats para explorar** con Collection completo.
5. `Track.licenseType`, `pricingTier`, `budget*` se mantienen por compatibilidad, pero dejan de ser foco visual principal en track page.

## Arquitectura propuesta
1. Datos:
   - `User 1:N LicenseTemplate`
   - `Track N:M LicenseTemplate` vía `TrackLicenseAssignment`
2. UI track page:
   - Izquierda: hero + player simple + CTA de modales.
   - Derecha: snapshot, perfil creativo, cumplimiento/restricciones, entrada de licencias.
3. Modal de licencias:
   - Tab `Resumen`
   - Tab `Mapa completo`
   - Tab `Contrato`
4. Fallback de licencias:
   - Prioridad 1: asignaciones activas del track.
   - Prioridad 2: plantillas activas del owner.
   - Prioridad 3: plantillas activas globales (`ownerUserId = null`).

## Contratos (types/props)
### Prisma
1. `LicenseTemplateStatus` enum:
   - `DRAFT`, `ACTIVE`, `ARCHIVED`
2. `LicenseTemplate`:
   - `id`, `ownerUserId`, `name`, `slug`, `status`, `sortOrder`, `isPopular`
   - `priceAmount`, `currency`, `formats`
   - `summaryJson`, `termsMatrixJson`, `agreementText`, `notes`
3. `TrackLicenseAssignment`:
   - `id`, `trackId`, `licenseTemplateId`, `sortOrder`, `isEnabled`
   - `priceOverride`, `summaryOverrideJson`, `termsOverrideJson`, `agreementOverrideText`
   - `@@unique([trackId, licenseTemplateId])`

### Frontend
1. `TrackLicenseViewModel`
2. `LicenseSummaryItem`
3. `LicenseTermRow`
4. `TrackLicenseDialogTab` = `summary | map | agreement`

## Plan de implementación por fases
### Fase 1 — Documento 041 y baseline
1. Completar este plan con alcance/decisiones/fases/checklist.
2. Registrar hallazgos del estado actual.

### Fase 2 — Prisma + migración
1. Agregar enum/modelos y relaciones en `prisma/schema.prisma`.
2. Crear migración versionada SQL.
3. Regenerar Prisma Client.

### Fase 3 — Validación y utilidades
1. Crear schemas Zod para plantillas y asignaciones.
2. Normalizar/parsear JSON de resumen/mapa/contrato.
3. Aplicar guardas de máximo 6 activas por track.

### Fase 4 — Backoffice mínimo (admin)
1. Ruta admin para CRUD básico de plantillas.
2. Editor de asignación de licencias dentro de metadata de track.
3. Guardado con validación de límite y consistencia.

### Fase 5 — Dummy data / seed
1. Extender `prisma/seed.ts` para crear plantillas.
2. Asignar 2-4 licencias dummy por track seed.

### Fase 6 — UI Track Page V2 (licenses-first)
1. Rediseñar `src/app/track/[id]/page.tsx`.
2. Quitar foco visible de pricing tier/presupuesto/precio guía.
3. Reemplazar waveform por slider simple.
4. Implementar `EntregablesDialog`.
5. Implementar `TrackLicensesDialog` con tabs.

### Fase 7 — Integración de datos
1. Cargar licencias reales asignadas desde DB.
2. Resolver fallback owner/global.
3. Render dinámico por cantidad de licencias.

### Fase 8 — Contexto estratégico
1. Añadir sección `VISIÓN y DIFERENCIACIÓN DE MERCADO` en `docs/PROJECT_GENERAL_CONTEXT.md`.

### Fase 9 — QA y cierre
1. Ejecutar `npm run typecheck`
2. Ejecutar `npm run build`
3. Ejecutar `npm test` (documentar prerequisito si aplica).
4. Registrar resultado técnico y checklist manual.

## Riesgos y mitigaciones
1. Riesgo: complejidad de términos.
   - Mitigación: schemas tipados y parser robusto para JSON.
2. Riesgo: sobrecarga visual en track page.
   - Mitigación: modales para contenido profundo.
3. Riesgo: tracks sin owner o sin asignaciones.
   - Mitigación: fallback a plantillas globales.
4. Riesgo: regresión en Collection embebido.
   - Mitigación: no tocar contrato del bloque final.

## Checklist de validación
- [x] `npm run typecheck`
- [x] `npm run build`
- [x] `npm run test` (ejecutado con `npm run dev` activo en `localhost:3000`)
- [x] `/track/[id]` sin waveform y con slider simple.
- [x] Entregables en modal.
- [x] Modal licencias con tabs `Resumen/Mapa/Contrato`.
- [x] Licencias dinámicas por cantidad (2,4,0+fallback).
- [x] `Más beats para explorar` funcional y sin overflow.
- [x] `docs/PROJECT_GENERAL_CONTEXT.md` actualizado con visión/diferenciación.

## Registro de avances (fecha, cambios, estado)
- 2026-02-26
  - Fase completada: **Fase 1 — Documento 041 y baseline**
  - Archivos tocados:
    - `docs/plans/041-track-page.md`
  - Validación ejecutada:
    - Revisión manual de estado inicial del repo y del modelo actual de licencias.
  - Estado: `completado`

- 2026-02-26
  - Fase completada: **Fase 2 — Prisma + migración**
  - Archivos tocados:
    - `prisma/schema.prisma`
    - `prisma/migrations/20260226110000_track_license_templates/migration.sql`
  - Validación ejecutada:
    - `npx prisma generate`
  - Estado: `completado`

- 2026-02-26
  - Fase completada: **Fase 3 — Validación y utilidades**
  - Archivos tocados:
    - `src/lib/licenses/types.ts`
    - `src/lib/licenses/schemas.ts`
    - `src/app/admin/track/actions/licenses.ts`
  - Validación ejecutada:
    - `npm run typecheck`
  - Estado: `completado`

- 2026-02-26
  - Fase completada: **Fase 4 — Backoffice mínimo (admin)**
  - Archivos tocados:
    - `src/app/admin/license-templates/page.tsx`
    - `src/app/admin/license-templates/actions.ts`
    - `src/components/dashboard/nav-config.admin.ts`
    - `src/app/admin/tracks/[id]/edit/metadata/page.tsx`
    - `src/components/admin/track/edit/TrackLicenseAssignmentsForm.tsx`
  - Validación ejecutada:
    - `npm run typecheck`
    - `npm run build`
  - Estado: `completado`

- 2026-02-26
  - Fase completada: **Fase 5 — Dummy data / seed**
  - Archivos tocados:
    - `prisma/seed.ts`
  - Validación ejecutada:
    - Revisión de tipos y consistencia con Prisma Client generado.
  - Estado: `completado`

- 2026-02-26
  - Fase completada: **Fase 6 — UI Track Page V2 (licenses-first)**
  - Archivos tocados:
    - `src/app/track/[id]/page.tsx`
    - `src/components/track/TrackSimpleAudioPlayer.tsx`
    - `src/components/track/TrackDeliverablesDialog.tsx`
    - `src/components/track/TrackLicensesDialog.tsx`
  - Validación ejecutada:
    - `npm run typecheck`
    - `npm run build`
  - Estado: `completado`

- 2026-02-26
  - Fase completada: **Fase 7 — Integración de datos**
  - Archivos tocados:
    - `src/app/track/[id]/page.tsx`
    - `src/server/track-edit/queries.ts`
  - Validación ejecutada:
    - Validación manual de estrategia asignación/fallback (asignadas -> owner -> global -> legacy).
  - Estado: `completado`

- 2026-02-26
  - Fase completada: **Fase 8 — Contexto estratégico**
  - Archivos tocados:
    - `docs/PROJECT_GENERAL_CONTEXT.md`
  - Validación ejecutada:
    - Revisión manual de sección `VISIÓN y DIFERENCIACIÓN DE MERCADO`.
  - Estado: `completado`

- 2026-02-26
  - Fase completada: **Fase 9 — QA y cierre**
  - Archivos tocados:
    - `docs/plans/041-track-page.md`
  - Validación ejecutada:
    - `npm run typecheck` ✅
    - `npm run build` ✅
    - `npm run test` ✅ (con `npm run dev` activo)
  - Estado: `completado`
