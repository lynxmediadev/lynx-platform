# LYNX Platform

Catálogo musical de LYNX con Next.js, Supabase, Prisma y Cloudflare R2. La web y el procesamiento de audio son procesos separados para que el catálogo responda rápido y el costo inicial se mantenga en USD 0.

```text
Web Next.js -> Supabase Auth + PostgreSQL + R2
AudioJob PostgreSQL -> worker local/Docker -> FFmpeg -> R2 previews
```

## Estado actual

- Desarrollo local/Wi-Fi en puerto `3000`.
- Web portable con `output: "standalone"` y `Dockerfile.web`.
- Worker de audio independiente en `Dockerfile.audio-worker`.
- R2: previews públicos y masters/entregables privados.
- No existe hosting, despliegue ni plan pagado activado.

## Inicio local

```bash
npm ci
cp .env.example .env.local
# Completa .env.local sin subirlo al repositorio.
npx prisma generate
npx prisma migrate status
npm run dev -- --hostname 0.0.0.0
```

Abre `http://localhost:3000` y comprueba la web con:

```bash
curl http://localhost:3000/api/health
```

En otra terminal, procesa la cola de audio:

```bash
npm run worker:audio
```

Si el worker está detenido, los jobs no se pierden: quedan `PENDING` en Supabase/PostgreSQL hasta reiniciarlo.

## Variables y seguridad

No publiques `.env.local`, credenciales R2, URL de base de datos, service role de Supabase, Brevo ni secretos de sesión. Solo las variables `NEXT_PUBLIC_*` están disponibles para el navegador y no deben contener secretos.

Consulta la [matriz de variables](docs/operations/environment-matrix.md) para saber qué recibe web, worker o migraciones. En producción debes configurar HTTPS, `APP_BASE_URL`, `APP_URL` y `CSRF_SECRET`.

## Operación y despliegue futuro

- [Runbook local](docs/operations/runbook-local.md)
- [Fase 4: portabilidad web](docs/hardening/phase-4-portability.md)
- [Worker de audio](docs/hardening/phase-3-audio-worker.md)
- [Runbook de deploy futuro](docs/operations/runbook-future-deploy.md)
- [Revisión y deuda técnica](docs/hardening/post-phase-4-review.md)

No despliegues el worker dentro del runtime de la web ni ejecutes migrations en el arranque del contenedor. El procedimiento de despliegue futuro separa web, migraciones y worker.

## Validación

```bash
npm run check
npm test
npm run test:contract
npm run build
npx prisma validate
npx prisma migrate status
```

Docker no está instalado en el equipo de desarrollo actual. Los Dockerfiles quedan listos para validarse cuando se autorice Docker, pero no se instaló ni se ejecutó ningún contenedor durante esta fase.
