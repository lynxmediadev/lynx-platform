# Backup y restore lógico

Los backups deben vivir fuera del repositorio. Nunca subas dumps, URLs de conexión ni contraseñas a Git. Usa una versión mayor de `pg_dump` igual a la del servidor y una conexión directa compatible con Supabase.

## Crear y verificar

```bash
mkdir -p /RUTA/FUERA/DEL/REPO
read -rsp "DIRECT_URL: " LYNX_BACKUP_DATABASE_URL; echo
export LYNX_BACKUP_DATABASE_URL
pg_dump --dbname="$LYNX_BACKUP_DATABASE_URL" \
  --format=custom --no-owner --no-privileges \
  --schema=public --schema=auth \
  --file=/RUTA/FUERA/DEL/REPO/lynx-AAAAmmdd-HHMMSS.dump
chmod 600 /RUTA/FUERA/DEL/REPO/lynx-AAAAmmdd-HHMMSS.dump
sha256sum /RUTA/FUERA/DEL/REPO/lynx-AAAAmmdd-HHMMSS.dump \
  > /RUTA/FUERA/DEL/REPO/lynx-AAAAmmdd-HHMMSS.dump.sha256
chmod 600 /RUTA/FUERA/DEL/REPO/lynx-AAAAmmdd-HHMMSS.dump.sha256
sha256sum --check /RUTA/FUERA/DEL/REPO/lynx-AAAAmmdd-HHMMSS.dump.sha256
pg_restore --list /RUTA/FUERA/DEL/REPO/lynx-AAAAmmdd-HHMMSS.dump >/dev/null
unset LYNX_BACKUP_DATABASE_URL
```

Registra fecha, ruta, tamaño, checksum y resultado de `pg_restore --list`, nunca la conexión. Supabase Auth vive en `auth`; los perfiles, roles, catálogo, `TrackAsset` y `AudioJob` viven en `public`.

## Probar restore

1. Crea una base PostgreSQL aislada y vacía, nunca uses la base activa.
2. Verifica primero el checksum y el índice del dump.
3. Restaura con `pg_restore --clean --if-exists` únicamente sobre esa base aislada.
4. Comprueba conteos, relaciones, roles, perfiles, tracks, assets y jobs.
5. Elimina la base aislada solo después de registrar el resultado.

Un dump verificado es rollback de datos, no reemplaza el rollback de código mediante tag/commit. Antes de cualquier `DROP`, repite el backup y prueba la restauración en un entorno aislado.
