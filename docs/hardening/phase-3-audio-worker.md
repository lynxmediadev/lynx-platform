# FASE 3 — Cola PostgreSQL y worker local de audio

La web ya no ejecuta FFmpeg ni FFprobe dentro de una petición. Al verificar un asset o pedir análisis, crea o reutiliza un `AudioJob` y responde `202 Accepted`. La tabla PostgreSQL conserva los jobs aunque el computador esté apagado.

```text
upload / análisis -> AudioJob PENDING -> worker local -> R2 + Track/TrackAsset -> READY
```

## Operación inicial: USD 0

No hay Redis, SaaS de colas, Cloudflare Workers, GitHub Actions, Vercel Workflow ni servicio remoto. El worker solo hace conexiones salientes hacia Supabase/PostgreSQL y R2; no expone ningún puerto.

1. Ejecuta un job disponible y termina: `npm run worker:audio:once`.
2. Para trabajar continuamente: `npm run worker:audio`.
3. Para detenerlo de forma segura usa `Ctrl+C`. Un job en curso conserva su lease; tras diez minutos otro worker lo recuperará, o quedará `FAILED` al agotar tres intentos.

Si el PC se apaga, los jobs nuevos permanecen `PENDING` en PostgreSQL. Al iniciar de nuevo el worker, continúa con ellos. No se pierde el master ni se abre acceso público al bucket privado.

### Prueba segura de desarrollo

Con un track de prueba que ya tenga un preview verificado, este comando crea un **master privado de prueba** bajo `e2e/`, registra un job y no modifica el original:

```bash
npm run worker:audio:e2e -- --track ID_DEL_TRACK_DE_PRUEBA --apply
npm run worker:audio:once
```

Comprueba después el `AudioJob` en estado `READY`, un `TrackAsset MASTER/PRIVATE` y un preview `processed/...` en `lynx-previews`. No lo ejecutes sobre un track de producción.

## Docker portable

Docker no viene instalado en este computador de desarrollo, por lo que este repositorio no puede construir la imagen localmente aún. Cuando Docker esté disponible:

```bash
docker build -f Dockerfile.audio-worker -t lynx-audio-worker .
docker run --rm --env-file .env.local --name lynx-audio-worker lynx-audio-worker
docker logs -f lynx-audio-worker
docker stop lynx-audio-worker
```

El `Dockerfile.audio-worker` instala FFmpeg/FFprobe dentro de la imagen y no copia `.env.local`. `--env-file` solo lo inyecta en tiempo de ejecución.

## Seguridad, concurrencia e idempotencia

- PostgreSQL reclama una sola fila por worker con `FOR UPDATE SKIP LOCKED`.
- Cada asset usa una `idempotencyKey` única; reintentos o peticiones duplicadas reutilizan el job.
- Un lease expira a los diez minutos; el job vuelve a `PENDING` o a `FAILED` según sus intentos.
- Backoff: 30 s, 60 s, 120 s… hasta 15 min; máximo inicial de tres intentos.
- Errores se limitan a 500 caracteres y eliminan URLs firmadas/credenciales.
- Los temporales se crean con `mkdtemp` y se eliminan en `finally`.
- Masters se leen desde `lynx-private-assets`; previews generados se escriben en `lynx-previews`. El original nunca se sobrescribe.

## Estado y recuperación

`GET /api/audio-jobs/:id` devuelve el estado a un usuario que tenga acceso al track. `POST /api/audio-jobs/:id/retry` reintenta un job no procesando. Desde Fase 5 no existe modo síncrono: toda petición HTTP encola y responde `202`.

## Cuándo evaluar mover el worker

El costo sigue siendo USD 0 mientras el PC pueda cumplir el plazo de trabajo. Evalúa infraestructura remota solo si se mide alguno de estos límites durante dos semanas: backlog sostenido superior a 20 jobs, más de 10 jobs/día, trabajos de más de 10 minutos, archivos que saturen CPU/RAM, o necesidad real de procesamiento 24/7. En ese momento se comparará una opción pagada indicando costo, límites gratuitos, alternativa gratuita y umbral exacto; esta fase no activa ni contrata nada.
