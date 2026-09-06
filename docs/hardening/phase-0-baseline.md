# FASE 0 — Línea base y guardrails de costo

Fecha: 2026-09-06

Rama: `hardening/phase-0-1`

Checkpoint: `f73bf4a`
Tag de recuperación: `checkpoint/pre-hardening-2026-09-06`

## Respaldo

- Dump lógico: `/home/legion/dev/odr/.backups/lynx-platform/lynx-platform-pre-phase1-20260906.dump`
- Formato: custom de PostgreSQL 17.11, schemas `public` y `auth`.
- Tamaño: 880.307 bytes.
- Contenido legible: 468 entradas comprobadas con `pg_restore --list`.
- Permisos: `600`.
- Integridad: checksum SHA-256 guardado junto al dump y validado.
- El respaldo está deliberadamente fuera del repositorio y nunca se sube a GitHub.

## Inventario previo a FASE 1

- PostgreSQL 17.4; tamaño total observado: 30.903.443 bytes (~29,5 MiB).
- Usuarios de aplicación: 37 — 4 ADMIN, 16 STAFF, 15 CREATOR y 2 CLIENT.
- Estados: 27 ACTIVE, 7 INVITED y 3 SUSPENDED.
- Credenciales legacy: 32 hashes scrypt y 5 placeholders de invitación.
- Supabase `auth.users`: 0.
- Sesiones/tokens legacy: 70 sesiones, 2 resets, 33 invitaciones y 64 verificaciones.
- Catálogo: 12 tracks, 1 versión y 0 stems; 10 assets con referencia `external://`.
- Schema público: 33 tablas, 0 con RLS; `anon` y `authenticated` tienen 0 grants directos.

## Línea base de calidad

- `npm run check`: aprobado antes de hardening.
- `npm test`: 6 pruebas aprobadas antes de hardening.
- `npm run build`: aprobado antes de hardening.
- Auditoría npm: 3 vulnerabilidades altas transitivas del tooling Prisma. No se ejecutará `npm audit fix --force` porque propone una regresión mayor.

## Prioridad de costos

- Costo añadido por FASE 0 y FASE 1: USD 0/mes.
- Supabase permanece en Free mientras la DB esté bajo 400 MB, el egress bajo 80% y sea aceptable que el proyecto pueda pausarse por inactividad.
- Brevo Free será suficiente hasta 300 emails diarios; Supabase custom SMTP limita inicialmente los emails de Auth a 30 por hora.
- No se activa hosting, cola, worker remoto ni observabilidad de pago en estas fases.
- El pooler gratuito reportó un máximo de 15 clientes simultáneos durante pruebas con dos
  servidores Next.js paralelos; durante desarrollo se debe mantener una sola instancia activa.
- Todo upgrade futuro requiere costo, problema medido, límite gratuito, alternativa sin costo y condición concreta de activación.
