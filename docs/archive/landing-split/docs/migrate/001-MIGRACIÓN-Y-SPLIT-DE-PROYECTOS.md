# 001 · MIGRACIÓN Y SPLIT DE PROYECTOS (Lynx Media Landing + Plataforma)

Estado: **Planificación cerrada + implementación avanzada. Landing casi lista V1 (pendiente cierre final y deploy).**  
Ruta oficial: `docs/migrate/001-MIGRACIÓN-Y-SPLIT-DE-PROYECTOS.md`

---

## 1) Respuestas rápidas a tus preguntas (decisiones guía)

### 1. ¿La mejor forma es crear un nuevo repo en GitHub?
Sí, pero por etapas.  
**Decisión:** usar **Fase Híbrida**:
- etapa 1: un mono-repo con dos apps (`landing` y `platform`) para migrar rápido y reutilizar visual,
- etapa 2: split físico a dos repos cuando Landing MVP esté estable.

**Peras y manzanas:** primero separas ambientes dentro de la misma casa; luego haces dos casas.

### 2. ¿Misma cuenta Supabase/Prisma o cuentas nuevas?
Puedes usar la misma cuenta, pero separando proyectos de DB.  
**Decisión:** **2 proyectos Supabase** (Landing y Plataforma), misma organización/cuenta.

**Peras y manzanas:** misma cuenta principal, dos cajas de datos distintas.

### 3. ¿Mismo Vercel para deploy de ambos?
Sí.  
**Decisión:** mismo team/cuenta Vercel, dos proyectos separados, cada uno con su dominio.

### 4. Landing no necesita tracks/playlists/contracts, solo contacto
Correcto.  
**Decisión:** Landing tendrá esquema mínimo de contacto/leads + notificación email.

### 5. ¿Esta aproximación general es correcta?
Sí, con una regla clave: compartir visual sí, compartir lógica de dominio no.

### 6. ¿Mantener todo en un repo con dos dominios es posible?
Sí, y de hecho es la fase híbrida recomendada para no frenar avance.  
No debe ser estado permanente si el objetivo final es separación total.

---

## 2) Contexto consolidado

- El proyecto inició como landing de Lynx Media.
- Evolucionó a una plataforma operativa (tracks/playlists/users/licensing/tickets).
- La landing comercial quedó pendiente.
- Ahora se separa en:
  - **A. Plataforma**: producto operativo (nombre y dominio futuros).
  - **B. Lynx Media Landing**: sitio público de marca (one-page + contacto).

Objetivo: separar sin perder velocidad ni calidad.

---

## 3) Objetivo del plan

Separar técnicamente Landing y Plataforma para que:
- evolucionen en paralelo,
- desplieguen por separado,
- no compartan datos sensibles de negocio,
- reutilicen estilo visual de forma controlada.

---

## 4) Arquitectura objetivo

## A) App Landing (Lynx Media)
- Dominio: `lynxmedia.cl`
- Función: presentación comercial + formulario de contacto
- DB: proyecto Supabase propio (landing)
- Backend: mínimo y enfocado en captación

## B) App Plataforma (nuevo nombre)
- Dominio: por definir
- Función: operación de producto (tracks, playlists, users, licensing, etc.)
- DB: proyecto Supabase propio (platform)
- Backend: dominio completo

## C) Compartición permitida
- Sí: tokens de diseño, componentes UI neutrales, estilos.
- No: modelos de negocio (track/playlist/licensing), lógica interna de dominio.

---

## 5) Instrucciones para mí (agente) durante la migración

- No mezclar DB entre apps.
- No meter modelos de Plataforma dentro de Landing.
- Si Landing requiere datos de Plataforma en el futuro, debe ser por API pública.
- Separar env vars, sesiones y deploys desde el inicio.
- Priorizar MVP Landing (one-page + contacto) antes de features extra.

---

## 6) Sección especial para el futuro chat de LYNX MEDIA / LANDING

## Prompt recomendado de arranque

> Lee primero `docs/migrate/001-MIGRACIÓN-Y-SPLIT-DE-PROYECTOS.md`.  
> Este proyecto es solo Landing Lynx Media.  
> No uses modelos de negocio de Plataforma (tracks/playlists/contracts).  
> Reutiliza solo capa visual autorizada (tokens + UI base).  
> Prioriza conversión, rendimiento, SEO básico y formulario de contacto seguro.  
> Si necesitas catálogo u otros datos de Plataforma, intégralo por API pública con contrato explícito.

---

## 7) Plan completo (paso a paso marcable)

## Fase 0 · Congelar alcance y decisiones
- [ ] Confirmar nombre final de Plataforma.
- [ ] Confirmar dominios final/temporal de ambas apps.
- [ ] Confirmar Landing MVP: one-page + contacto.

Peras y manzanas: sin fronteras claras, después todo se mezcla y toca rehacer.

## Fase 1 · Estructura híbrida inicial (sin romper la app actual)
- [x] Crear estructura de trabajo:
  - [x] `apps/landing`
  - [x] `apps/platform`
  - [x] `packages/brand-ui`
  - [x] `packages/brand-tokens`
- [x] Bootstrap mínimo de `apps/landing` (Next app shell inicial).
- [x] Inicializar workspaces npm en `package.json`.
- [ ] Mantener app actual funcional durante transición.

Peras y manzanas: se prepara la mudanza sin botar la casa donde ya vives.

### Inventario inicial: se queda / migra / descarta

#### Se queda en Plataforma (A)
- Todo el dominio operativo actual:
  - tracks, playlists, users, requests, tickets, contracts, services, sound kits.
- Auth actual de plataforma y dashboard admin.
- DB operativa actual (Supabase Plataforma).

#### Migra a Landing (B)
- Identidad visual de marca (gradualmente vía `brand-tokens` y `brand-ui`).
- Home/hero y secciones comerciales (cuando se implementen en `apps/landing`).
- Formulario(s) de contacto.

#### Se descarta de Landing (no entra)
- Schemas y backend de dominio de Plataforma:
  - tracks/playlists/contracts/licensing/users internos.

---

## Registro de ejecución (implementación real)

- [x] Documento de migración reescrito y normalizado:
  - `docs/migrate/001-MIGRACIÓN-Y-SPLIT-DE-PROYECTOS.md`
- [x] Alias legacy creado para evitar confusión de ruta:
  - `docs/migate/001-MIGRACIÓN-Y-SPLIT-DE-PROYECTOS.md`
- [x] Estructura de carpetas creada:
  - `apps/landing`
  - `apps/platform`
  - `packages/brand-ui`
  - `packages/brand-tokens`
- [x] `apps/landing` inicializada con shell Next (layout/page/globals).
- [x] `package.json` raíz actualizado con `workspaces` y scripts `*:landing`.
- [x] Baseline visual extraído a paquetes compartidos:
  - `packages/brand-tokens/src/tokens.css`
  - `packages/brand-ui/src/*` (panel + button + styles)
- [x] `apps/landing` conectado a `@lynx/brand-tokens` y `@lynx/brand-ui`.
- [x] Infra de datos Landing inicializada:
  - `apps/landing/prisma/schema.prisma` con `ContactLead`
  - scripts DB de Landing (`landing:db:*`)
  - `apps/landing/.env.example` con `LANDING_DATABASE_URL`
- [x] Fase 4 baseline implementada:
  - `POST /api/contact` (JSON + form submit)
  - validación + honeypot + rate-limit
  - persistencia en `ContactLead`
  - notificación en modo consola + proveedor Brevo opcional por env
  - auto-reply opcional al usuario (feature flag por env)
  - bridge `POST /api/contact-request` para compatibilidad con HomeSnap compartido
- [x] Landing alineado con homepage de Platform:
  - `HomeSnap` + `FrontendShell` reutilizados desde `src/`
  - tema, header y estructura visual unificados
- [x] Preparación Fase 5 (deploy separado):
  - `scripts/landing-preflight.mjs`
  - `docs/migrate/002-VERCEL-ENV-MATRIX.md`
  - `docs/migrate/003-VERCEL-DEPLOY-RUNBOOK.md`
  - plantillas `.env.production.example` para Landing/Platform

## Fase 2 · Extracción visual reutilizable
- [x] Mover colores, tipografía y spacing a `brand-tokens` (baseline inicial).
- [x] Mover componentes UI neutros a `brand-ui` (baseline inicial).
- [ ] Verificar que Plataforma no cambie visualmente por accidente.

Peras y manzanas: se comparte el uniforme, no el cerebro del negocio.

## Fase 3 · Infra y datos separados
- [x] Crear Supabase Landing (`lynx-landing-dev`).
- [x] Mantener Supabase Plataforma separado (separación explícita de env y schema Landing).
- [x] Definir esquema Landing mínimo:
  - [x] `ContactLead` (name, email, company?, message, source, status, createdAt).

Peras y manzanas: si separas datos bien, los problemas de uno no contaminan al otro.

## Fase 4 · Contacto Landing
- [x] Implementar `POST /api/contact`.
- [x] Validación server + anti-spam + rate limit.
- [x] Persistencia en DB Landing.
- [x] Notificación por email (console + Brevo configurable por env).

Peras y manzanas: formulario útil = guardar + proteger + avisar.

## Fase 5 · Deploy separado
- [ ] Crear proyecto Vercel para Landing.
- [ ] Crear proyecto Vercel para Plataforma.
- [~] Configurar dominios y env vars por app (plantillas y runbook listos; falta ejecución en Vercel).

Peras y manzanas: dos apps, dos paneles de control.

## Fase 6 · Integración futura controlada
- [ ] Definir API pública de Plataforma si Landing consume datos futuros.
- [ ] Prohibir acoplamiento directo a DB Plataforma desde Landing.

Peras y manzanas: Landing toca timbre (API), no entra por la ventana (DB).

## Fase 7 · QA manual completo
- [ ] Landing carga bien (desktop/mobile).
- [ ] Contacto crea lead y notifica.
- [ ] Anti-spam operativo.
- [ ] Plataforma intacta (auth, listas, módulos críticos).
- [ ] Sin env/cookies/sesiones cruzadas.

Peras y manzanas: si una app falla, la otra no se debe caer.

## Fase 8 · Split físico final a dos repos
- [ ] Definir fecha de corte.
- [ ] Crear repos definitivos separados.
- [ ] Migrar CI/CD independiente.
- [ ] Cerrar modo híbrido.

Peras y manzanas: el híbrido es puente, no destino final.

---

## 8) Pruebas manuales verificables (con esperado)

1) Landing home  
- Acción: abrir home landing.  
- Esperado: responsive y sin errores JS.

2) Contacto válido  
- Acción: enviar formulario con datos válidos.  
- Esperado: lead persistido + mensaje éxito + notificación.

3) Anti-spam  
- Acción: múltiples envíos rápidos.  
- Esperado: bloqueo controlado (`429` o equivalente).

4) Aislamiento de datos  
- Acción: revisar DB landing y plataforma.  
- Esperado: Landing no usa tablas de negocio de Plataforma.

5) Aislamiento de sesión/env  
- Acción: revisar cookies y env por app.  
- Esperado: no hay contaminación cruzada.

6) Plataforma intacta  
- Acción: smoke en módulos clave.  
- Esperado: sin regresiones funcionales.

---

## 9) Riesgos y mitigación

- Riesgo: acoplamiento oculto por “copiar rápido”.  
  Mitigación: regla estricta de separación de dominio.
- Riesgo: duplicación de UI sin control.  
  Mitigación: `brand-ui` + `brand-tokens` como fuente única.
- Riesgo: sobrecargar Landing de features.  
  Mitigación: mantener MVP estricto.
- Riesgo: quedarse en híbrido eternamente.  
  Mitigación: fase 8 con fecha y criterio de salida.

---

## 10) Criterio de éxito

La migración se considera exitosa cuando:
- Landing opera independiente y capta contactos.
- Plataforma opera independiente sin regresiones.
- Deploy, env y DB están separados.
- Ambos pueden evolucionar sin bloquearse.
