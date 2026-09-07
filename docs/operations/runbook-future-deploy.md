# Runbook de deploy futuro (sin proveedor seleccionado)

Este documento no autoriza un despliegue. Sirve para preparar una decisión posterior con métricas reales.

## Pasos comunes previos

1. Define un dominio HTTPS, `APP_BASE_URL` y `APP_URL`.
2. Añade `https://DOMINIO/auth/callback` y el origen correspondiente en Supabase Auth.
3. Configura SPF/DKIM/remitente en Brevo si se enviará email real.
4. Crea conjuntos de variables separados para web, worker y migración; nunca copies `.env.local` a imágenes o paneles compartidos.
5. Haz backup antes de migrar. Ejecuta una sola vez `npx prisma migrate deploy` con `DIRECT_URL` y confirma estado.
6. Despliega web y worker como procesos distintos. El worker no recibe tráfico HTTP.
7. Comprueba `/api/health`, login/callback, preview público, descarga privada autorizada y un `AudioJob` de prueba.
8. Ten rollback al commit/imagen anterior y no elimines assets ni columnas durante un rollback.

## Vercel Pro futuro

Vercel puede construir Next.js directamente y soporta las rutas Node requeridas. Configura todas las variables web, Node runtime, Supabase redirects y R2. No ejecutes el worker FFmpeg en Vercel; mantenlo como contenedor/proceso externo. Verifica precios, límites comerciales, funciones, egress y presupuesto antes de activar Pro. Vercel Hobby no es el destino de producción comercial de LYNX.

## Host Docker/Node genérico futuro

```bash
docker build -f Dockerfile.web -t lynx-web \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=URL_PUBLICA_DE_SUPABASE \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=KEY_PUBLICA_DE_SUPABASE .
docker run --env-file WEB_ENV_FILE -p 3000:3000 lynx-web
docker build -f Dockerfile.audio-worker -t lynx-audio-worker .
docker run --env-file WORKER_ENV_FILE lynx-audio-worker
```

Un reverse proxy o el proveedor debe terminar HTTPS y reenviar Host/X-Forwarded-Proto. El contenedor web no usa disco persistente; Supabase guarda datos y R2 guarda assets. Ejecuta migrations como tarea separada, no en el arranque. Configura healthcheck, logs, límites de CPU/memoria y un restart policy en el host elegido.
