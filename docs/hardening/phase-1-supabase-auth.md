# FASE 1 — Supabase Auth reversible

## Estado implementado

- Prisma conserva perfiles, roles, estado y relaciones.
- Supabase Auth pasa a custodiar identidad, password, recuperación y cookies SSR.
- `AUTH_MODE=legacy` es el default seguro mientras falten llaves.
- `AUTH_MODE=hybrid` prueba Supabase primero y conserva el fallback legacy.
- `AUTH_MODE=supabase` rechaza `app_session`, `admin_session` y la clave legacy.
- La migración `20260906160000_add_supabase_auth_link` fue aplicada sin eliminar datos.
- `passwordHash` ahora es nullable; los 32 hashes scrypt existentes permanecen intactos.
- `anon` y `authenticated` continúan sin grants sobre las tablas Prisma.

## Activación manual, en orden

### 1. Configurar Supabase Auth

En Supabase Dashboard:

1. Abre **Authentication > Providers > Email** y habilita Email/Password.
2. Mantén la confirmación de email habilitada.
3. Evita signup público irrestricto; LYNX usa invitaciones administradas.
4. En **Authentication > URL Configuration**, configura:
   - Site URL local: `http://localhost:3004`
   - Redirect local: `http://localhost:3004/auth/callback`
   - Agrega después los callbacks exactos de staging/producción.
5. Copia Project URL, publishable key y service-role key. La service-role nunca va al navegador.

### 2. Configurar Brevo Free como SMTP

El SMTP de prueba de Supabase no sirve para usuarios reales. En Brevo verifica primero el
remitente o dominio y configura SPF/DKIM. Luego, en **Supabase > Authentication > Emails > SMTP**:

- Host: `smtp-relay.brevo.com`
- Puerto: `587`
- Usuario: el login SMTP entregado por Brevo.
- Password: una SMTP key de Brevo, no la contraseña de la cuenta.
- From: una dirección verificada.

Brevo Free admite 300 envíos diarios. Supabase parte con un límite de Auth de 30 emails por
hora al usar SMTP personalizado. No se requiere contratar un plan.

### 3. Completar `.env.local`

```dotenv
APP_BASE_URL=http://localhost:3004
AUTH_MODE=legacy
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

No borres todavía `AUTH_SESSION_SECRET`, `ADMIN_ACCESS_KEY` ni las variables legacy.

### 4. Seleccionar y aprovisionar el primer administrador

Primero revisa sin modificar ni enviar correos:

```bash
npm run auth:provision-supabase
```

Después aplica solamente al email administrativo real:

```bash
npm run auth:provision-supabase -- --apply --email admin@tu-dominio.cl
```

El comando exige emails explícitos, omite suspendidos, no imprime tokens y es idempotente.
Supabase/Brevo enviará una invitación o recuperación para definir la password.
Si una cuenta ya está correctamente enlazada, una nueva ejecución solo informa
`already_linked`: no crea otro usuario ni vuelve a enviar correo.

### 5. Transición y corte

1. Cambia a `AUTH_MODE=hybrid` y reinicia `npm run dev -- --hostname 0.0.0.0`.
2. Abre el enlace recibido, completa el perfil y comprueba `/admin`.
3. Prueba logout, recuperación y los roles necesarios.
4. Cuando todas las cuentas reales estén enlazadas, cambia a `AUTH_MODE=supabase`.
5. Conserva el modo legacy hasta una fase posterior; no elimines todavía sus tablas o secretos.

## Rollback

1. Define `AUTH_MODE=legacy`.
2. Reinicia la aplicación.
3. Las cuentas y sesiones antiguas vuelven a funcionar porque no fueron eliminadas.

No es necesario revertir las columnas nuevas. Si existiera un incidente de datos, el dump previo
está fuera del repositorio en `/home/legion/dev/odr/.backups/lynx-platform/`.

## Restricciones de costo

- FASE 1 agrega USD 0/mes dentro de Supabase Free y Brevo Free.
- No se activó hosting, worker, cola externa ni add-on.
- Evalúa Supabase Pro solamente al acercarse a 400 MB, 80% de egress, o cuando la pausa por
  inactividad y la ausencia de backup administrado ya no sean aceptables.
