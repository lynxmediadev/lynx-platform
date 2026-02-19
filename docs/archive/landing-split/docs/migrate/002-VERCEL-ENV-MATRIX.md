# 002 · Vercel Env Matrix (Landing + Platform)

Objetivo: separar variables por proyecto para evitar cruces entre Landing y Platform.

## 1) Proyecto Vercel: Landing (`lynx-landing`)

Root Directory sugerido: `apps/landing`

Variables mínimas:
- `LANDING_PUBLIC_URL`
- `LANDING_DATABASE_URL`
- `LANDING_CONTACT_NOTIFY_EMAIL`
- `LANDING_CONTACT_EMAIL_PROVIDER`
- `LANDING_CONTACT_FROM_EMAIL`
- `LANDING_CONTACT_FROM_NAME`
- `LANDING_BREVO_API_KEY`
- `LANDING_CONTACT_SEND_AUTOREPLY`
- `LANDING_CONTACT_AUTOREPLY_SUBJECT`
- `LANDING_CONTACT_RATE_LIMIT_MAX`
- `LANDING_CONTACT_RATE_LIMIT_WINDOW_MS`

Referencia de plantilla:
- `apps/landing/.env.production.example`

## 2) Proyecto Vercel: Platform (`lynx-platform`)

Root Directory actual (transitorio): `.`  
Root Directory futuro (post-migración interna): `apps/platform`

Variables mínimas:
- `APP_BASE_URL`
- `DATABASE_URL`
- `AUTH_SESSION_SECRET`
- `AUTH_BOOTSTRAP_ADMIN_EMAIL`
- `AUTH_BOOTSTRAP_ADMIN_PASSWORD`
- `AUTH_ENFORCE_VERIFIED_EMAIL`
- `AUTH_EMAIL_PROVIDER`
- `AUTH_EMAIL_FROM`
- `AUTH_EMAIL_DEBUG_LINKS`
- `BREVO_API_KEY`
- `TURNSTILE_ENABLED`
- `TURNSTILE_SECRET_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

Referencia de plantilla:
- `apps/platform/.env.production.example`

## 3) Regla de separación

- Landing NO usa `DATABASE_URL`, `AUTH_*`, `TURNSTILE_*` de Platform.
- Platform NO usa `LANDING_*`.
- Si una variable existe en ambos contextos (ej: Brevo), se configura por proyecto en Vercel.

## 4) Verificación antes de deploy

Landing:
- `npm run landing:preflight`
- `npm run build:landing`

Platform:
- `npm run auth:preflight`
- `npm run typecheck`
- `npm run build`
