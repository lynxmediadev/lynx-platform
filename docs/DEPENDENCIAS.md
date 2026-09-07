# Dependencias de LYNX Platform

La fuente canónica de versiones es `package.json`/`package-lock.json`; instala siempre con `npm ci`.

## Runtime local

- Node `>=20.20 <23` y npm 10.
- Acceso saliente a Supabase PostgreSQL/Auth, Cloudflare R2, Turnstile y Brevo cuando estén habilitados.
- FFmpeg/FFprobe son necesarios únicamente para `npm run worker:audio`. La web nunca ejecuta binarios de audio.
- Docker es opcional durante desarrollo local y todavía no se ha probado en este equipo.

## Configuración

1. Copia `.env.example` a `.env.local`.
2. Completa únicamente los servicios que usarás; nunca publiques el archivo.
3. Consulta [environment-matrix.md](operations/environment-matrix.md) para separar web, worker y migraciones.
4. Usa Supabase PostgreSQL como base canónica; el antiguo script de base Docker local fue retirado en Fase 5 porque no tenía consumidores y podía confundirse con la arquitectura actual.

## Comandos esenciales

```bash
npm ci
npx prisma generate
npx prisma migrate status
npm run dev -- --hostname 0.0.0.0
npm run worker:audio
npm run check
npm test
npm run build
```

Para operación detallada consulta el [runbook local](operations/runbook-local.md), el [worker](hardening/phase-3-audio-worker.md) y el [cierre de Fase 5](hardening/phase-5-final.md).
