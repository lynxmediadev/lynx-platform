# 003 · Vercel Deploy Runbook (Fase 5)

Este runbook deja Landing y Platform como dos proyectos de Vercel separados.

## 0) Prerrequisitos

- Repo conectado a Vercel.
- Dominio `lynxmedia.cl` en Cloudflare activo.
- Brevo operativo (dominio autenticado).

## 1) Crear proyecto Landing

1. En Vercel: `Add New` → `Project`.
2. Seleccionar el mismo repo.
3. Configurar:
   - Project name: `lynx-landing`
   - Root Directory: `apps/landing`
   - Framework: Next.js (auto)
4. Cargar variables desde `apps/landing/.env.production.example`.
5. Deploy.

Resultado esperado:
- Build exitoso.
- URL preview funcional.

## 2) Crear proyecto Platform

1. En Vercel: `Add New` → `Project`.
2. Seleccionar el mismo repo.
3. Configurar:
   - Project name: `lynx-platform`
   - Root Directory: `.` (estado transitorio actual)
4. Cargar variables desde `apps/platform/.env.production.example`.
5. Deploy.

Resultado esperado:
- Build exitoso.
- `/admin` y auth funcionando.

## 3) Dominios

Landing:
- Dominio principal: `lynxmedia.cl`
- Opcional: `www.lynxmedia.cl` redirect → apex.

Platform:
- Subdominio recomendado: `app.lynxmedia.cl` (o dominio separado futuro).

## 4) Smoke post-deploy

Landing:
- `GET /` responde 200.
- Formulario contacto crea lead en Supabase Landing.
- Notificación interna llega por Brevo.
- Auto-reply (si activo) llega al usuario.

Platform:
- Login admin OK.
- Crear invitación y envío Brevo OK.
- Rutas admin críticas cargan sin error.

## 5) Rollback básico

Landing:
- Desactivar `LANDING_CONTACT_EMAIL_PROVIDER=brevo` → `console` si falla envío.

Platform:
- Volver `AUTH_EMAIL_PROVIDER=console` si Brevo falla en producción inicial.

## 6) Criterio de Fase 5 completada

- Existen dos proyectos Vercel separados.
- Cada uno con variables propias.
- Deploy de ambos sin regresión crítica.
