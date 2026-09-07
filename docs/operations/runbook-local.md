# Runbook local

## Requisitos

- Node 20 (la línea base actual es Node 20.20).
- npm 10 y acceso saliente a Supabase y Cloudflare R2.
- No se necesita Docker para operar la web o el worker localmente.

## Arranque desde cero

```bash
git clone git@github.com:lynxmediadev/lynx-platform.git
cd lynx-platform
npm ci
cp .env.example .env.local
# Completa los valores locales sin publicar este archivo.
npx prisma generate
npx prisma migrate status
npm run dev -- --hostname 0.0.0.0
```

La web usa `http://localhost:3000`. Desde otro dispositivo Wi-Fi usa la IP/puerto que exponga tu host WSL/Windows; Next debe ejecutarse con `--hostname 0.0.0.0`. La apertura o bridge de red del host es una decisión local y no la configura este repositorio.

En otra terminal, inicia el procesador de audio:

```bash
npm run worker:audio
```

Detén web o worker con `Ctrl+C`. Si el worker está apagado, los jobs quedan `PENDING` en PostgreSQL y se retoman al iniciarlo.

## Comprobaciones

```bash
curl http://localhost:3000/api/health
npx prisma migrate status
npm run check
npm test
```

Al subir un preview/master desde administración, la web valida el objeto R2 y crea un `AudioJob`. Para procesar uno puntualmente: `npm run worker:audio:once`. Comprueba su estado mediante el endpoint autorizado `GET /api/audio-jobs/ID_DEL_JOB` o en Prisma Studio.

Audita mantenimiento sin cambiar datos ni objetos:

```bash
npm run maintenance:r2 -- --dry-run
npm run maintenance:audio-jobs -- --dry-run
```

No uses `--apply` sin backup reciente, revisión del inventario y aprobación manual. `maintenance:r2` nunca considera borrables objetos legacy y protege todo asset enlazado o `VERIFIED`.

## Problemas frecuentes

- **Puerto ocupado:** inspecciona el listener antes de cerrarlo: `ss -ltnp '( sport = :3000 )'`.
- **R2 no configurado:** compara nombres, sin valores, con la matriz de variables; confirma ambos buckets y CORS de uploads.
- **Job pendiente:** inicia el worker y revisa `errorMessage` sanitizado; no hay procesamiento si el PC está apagado.
- **Callback Auth incorrecto:** añade exactamente el origen y `/auth/callback` usados a Supabase Redirect URLs.
- **Producción/HTTPS:** define `APP_BASE_URL`, `APP_URL` y `CSRF_SECRET`; no uses el fallback de desarrollo.
- **Restore/backup:** usa el [runbook dedicado](backup-restore.md); no pruebes restores sobre la base activa.
