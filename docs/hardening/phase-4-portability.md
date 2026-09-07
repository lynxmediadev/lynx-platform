# FASE 4 — Portabilidad web y hosting-agnostic

## Resultado

La web conserva el desarrollo local y ahora genera `output: "standalone"`. El build crea `.next/standalone`, que contiene el servidor Node y únicamente los archivos trazados por Next.js. Esto no cambia `next dev`, las rutas API, Server Components, Proxy, Prisma, Supabase Auth ni R2; Vercel puede ignorar esta salida y continuar construyendo Next.js de forma nativa.

```text
Browser
  -> Next.js web (local, Vercel futuro, o Docker genérico)
       -> Supabase PostgreSQL + Auth
       -> R2 previews públicos / URLs firmadas privadas

AudioJob -> worker Docker/local separado -> FFmpeg + R2
```

El worker no se inicia desde la web, no abre puertos y no entra al `Dockerfile.web`. Desde Fase 5 la cola es la única arquitectura soportada; la web no importa procesamiento pesado ni necesita binarios FFmpeg/FFprobe.

## Runtime y responsabilidades

| Componente | Runtime | Motivo |
|---|---|---|
| App Routes, Server Components y Proxy autenticado | Node.js | Prisma, SDK R2, cookies de servidor y crypto de Node. |
| Cliente React | Navegador | Solo recibe variables `NEXT_PUBLIC_*` explícitas. |
| Worker de audio | Node.js + FFmpeg/FFprobe | Descarga masters, crea waveform/preview y actualiza `AudioJob`. |
| Healthcheck | Node.js, sin DB | Respuesta pequeña y no cacheable; no revela configuración. |

No se debe configurar estas rutas como Edge: Prisma, S3/R2 y filesystem/binarios no son compatibles con Edge. El build actual usa los runtimes Node por defecto de los Route Handlers. `src/proxy.ts` también requiere Node por su consulta de perfil Prisma.

## Contenedor web futuro

`Dockerfile.web` usa un build multi-stage Debian/Node 20, ejecuta como usuario no-root, expone `3000`, usa `node server.js` de la salida standalone y trae un healthcheck interno. No copia `.env.local`; las variables se inyectan al ejecutar el contenedor.

```bash
docker build -f Dockerfile.web -t lynx-web \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=URL_PUBLICA_DE_SUPABASE \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=KEY_PUBLICA_DE_SUPABASE \
  --build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY=SITE_KEY_PUBLICA_OPCIONAL .
docker run --rm --env-file WEB_ENV_FILE -p 3000:3000 --name lynx-web lynx-web
curl http://localhost:3000/api/health
docker logs -f lynx-web
docker stop lynx-web
```

`WEB_ENV_FILE` debe contener únicamente las variables de la web; las exclusivas de audio permanecen en el entorno del worker. El servidor actual no tiene Docker instalado, por lo que el Dockerfile fue revisado por inspección pero **no fue construido ni iniciado localmente**. No se instaló Docker ni se realizó despliegue alguno.

## R2, auth y proxy

- `lynx-previews` se consume como URL pública; la web no guarda previews en disco local.
- Masters y demás assets privados usan URLs firmadas cortas emitidas por una ruta autorizada; Next.js no los proxea.
- Las credenciales R2, `SUPABASE_SERVICE_ROLE_KEY`, secretos de sesión, Brevo y Turnstile son exclusivamente de servidor.
- Las cookies de aplicación son `httpOnly`, `sameSite=lax` y pasan a `secure` cuando `NODE_ENV=production`; el hosting final debe terminar HTTPS antes de exponer login público.
- Configura `APP_BASE_URL` y `APP_URL` con el origen HTTPS final. En Supabase añade exactamente `https://DOMINIO/auth/callback` a Redirect URLs. Conserva `http://localhost:3000/auth/callback` solo para desarrollo.
- Un reverse proxy debe reenviar `Host` y `X-Forwarded-Proto`; TLS/HTTPS vive en el proxy o proveedor, no dentro del contenedor.

## Prisma y Supabase PostgreSQL

- `DATABASE_URL`: conexión de runtime, normalmente al pooler de Supabase.
- `DIRECT_URL`: conexión directa para `prisma migrate deploy`; no sustituye `DATABASE_URL` en la web.
- Antes de un deploy futuro: backup, `npx prisma migrate deploy` desde una tarea administrativa de una sola vez y luego iniciar web/worker. Nunca ejecutar `migrate dev` ni `db push` contra producción.
- La web no debe ejecutar migraciones al arrancar. La imagen tampoco contiene secretos.

## Costos y decisión de hosting

Costo actual: **USD 0/mes de hosting**, sin servicios activados durante esta fase. Mantén desarrollo local/Wi-Fi hasta observar durante al menos dos semanas uno de estos umbrales: acceso público requerido 24/7, usuarios externos bloqueados por la disponibilidad local, más de 99% de uptime deseado, tráfico/egress que el equipo local no pueda servir, reinicios manuales frecuentes, necesidad real de SSL/rollback/previews administrados o más de 2 horas semanales de operación manual.

Cuando exista evidencia, compara Vercel Pro y un host Docker/Node. Cualquier recomendación debe indicar costo, free tier, restricciones comerciales, alternativa gratuita y el umbral medido. No se eligió proveedor ni se contrató plan.

## Rollback

- Web: volver al commit anterior o desactivar la imagen nueva; no hay migración en esta fase.
- Audio: los jobs ya creados permanecen durables. Si el worker falla, se detiene y se repara; no existe rollback a procesamiento FFmpeg dentro de HTTP.
- Datos y R2: no se modificaron por Fase 4.
