Quiero llevar LYNX Platform a una arquitectura de producción sólida y resolver varios problemas técnicos detectados en una auditoría previa.

REPOSITORIO ACTUAL:
https://github.com/lynxmediadev/lynx-platform

Estás trabajando directamente sobre el repositorio local, por lo que NO debes asumir que la auditoría previa es 100% correcta. Primero inspecciona el código real, dependencias, Prisma schema, rutas API, auth, almacenamiento, procesamiento de audio, configuración de Next.js, variables de entorno y documentación.

## ARQUITECTURA OBJETIVO

Quiero mantener esta arquitectura general:

- WEB / FULL-STACK APP → Vercel
- Framework → Next.js
- Database → Supabase PostgreSQL
- ORM / acceso a datos de negocio → Prisma
- Authentication / sessions → Supabase Auth
- Audio / archivos → Cloudflare R2
- Anti-bot → Cloudflare Turnstile
- Audio analysis / transcoding → FFmpeg + FFprobe
- Email → Brevo

Supabase NO debe reemplazar Prisma como capa general de acceso a los datos de negocio.

Quiero utilizar Supabase principalmente para:
1. PostgreSQL administrado.
2. Supabase Auth.

Prisma debe seguir manejando tracks, catálogo, metadata, licencias, playlists, permisos de aplicación, perfiles y demás datos de negocio cuando corresponda.

---

# OBJETIVOS PRINCIPALES

Necesitamos solucionar cuatro áreas.

## 1. MIGRAR EL AUTH PROPIO A SUPABASE AUTH

Actualmente existe un sistema de autenticación propio que maneja parte o todo lo siguiente:

- usuarios
- passwords
- sesiones
- login/logout
- email verification
- password reset/recovery
- invitaciones
- roles
- autorización

Quiero dejar de mantener criptografía, passwords y sesiones críticas manualmente.

Objetivo:

SUPABASE AUTH:
- identidad
- password authentication
- hashes de password
- sesiones
- refresh tokens
- email verification
- password recovery
- mecanismos de autenticación sensibles

LYNX / PRISMA:
- perfil de usuario
- ADMIN / STAFF / CREATOR / CLIENT
- permisos de aplicación
- ownership
- relaciones con tracks/playlists/licencias/etc.
- reglas de negocio
- invitaciones específicas de LYNX si siguen siendo necesarias

Antes de migrar:

1. Identifica exactamente cómo funciona el auth actual.
2. Identifica algoritmo de hashing y estructura de sesiones.
3. Identifica todas las tablas Prisma relacionadas.
4. Identifica middleware, cookies, API routes, server actions y helpers que dependan del auth actual.
5. Determina cómo migrar usuarios existentes SIN perder cuentas innecesariamente.
6. NO asumas que los passwords actuales pueden importarse directamente a Supabase Auth.
7. Si no se pueden migrar hashes de forma segura, diseña una estrategia de transición/reset de password.
8. Mantén los IDs y relaciones existentes cuando sea viable, o diseña una tabla/profile mapping segura entre Supabase `auth.users.id` y el usuario de aplicación.
9. No elimines tablas/código legacy hasta confirmar que la migración funciona.
10. Mantén Cloudflare Turnstile donde siga teniendo sentido.

Utiliza los patrones actuales recomendados para Supabase Auth + Next.js App Router/SSR.

Nunca expongas service-role keys al browser.

---

# 2. SEPARAR MASTERS / STEMS / PREVIEWS EN CLOUDFLARE R2

Actualmente debemos endurecer el almacenamiento.

Quiero conceptualmente:

PRIVATE:
- masters/
- stems/
- deliverables/
- archivos originales

PREVIEWS:
- previews optimizados para reproducción web

Los masters y stems NO deben quedar públicamente descargables mediante una URL permanente.

Implementa o diseña:

- R2 privado para originales.
- autorización server-side antes de entregar acceso.
- URLs firmadas/presigned de duración limitada cuando corresponda.
- validación de permisos antes de downloads.
- uploads directos seguros mediante presigned URLs/POST cuando sea apropiado.
- restricciones de MIME/type.
- restricciones de tamaño.
- nombres/keys seguros.
- evitar path traversal.
- no confiar en filenames suministrados por el cliente.

La DB debería preferentemente guardar STORAGE KEYS / metadata del objeto y no depender de URLs firmadas permanentes.

Los previews deben estar separados de los masters.

Evalúa si los previews deben:
A) ser públicos mediante CDN/custom domain;
o
B) seguir privados pero servirse mediante signed URLs.

Elige según la lógica actual del catálogo y documenta la decisión.

Debe quedar preparado para que un track pueda tener:

- master
- preview
- stems
- alternate versions
- deliverables

sin mezclar sus permisos.

---

# 3. SACAR FFMPEG DEL REQUEST HTTP PRINCIPAL

Actualmente FFmpeg/FFprobe no debe bloquear una request larga mientras:

- descarga un master
- analiza audio
- calcula LUFS/LRA/True Peak
- obtiene metadata
- genera waveform
- genera preview
- transcodifica archivos

Quiero un pipeline ASÍNCRONO.

Flujo conceptual:

UPLOAD COMPLETADO
        ↓
crear AUDIO JOB
        ↓
respuesta HTTP rápida
        ↓
JOB EN BACKGROUND
        ↓
obtener master desde R2
        ↓
FFprobe
        ↓
FFmpeg
        ↓
análisis
        ↓
generar preview si corresponde
        ↓
guardar preview en R2
        ↓
actualizar metadata en PostgreSQL
        ↓
READY

Estados mínimos:

PENDING
PROCESSING
READY
FAILED

Considera también:

- attempts
- timestamps
- errorMessage
- retries
- idempotencia
- evitar procesar dos veces el mismo asset
- observabilidad/logs
- recuperación después de fallos
- procesamiento concurrente seguro

NO quiero simplemente reemplazar una request HTTP larga por otra request HTTP larga escondida.

Necesitamos desacoplamiento real.

Como la web estará en Vercel, evalúa las opciones actuales disponibles para background processing.

Puedes considerar Vercel Queues / Workflow u otra solución si existe una razón técnica clara.

IMPORTANTE:
No agregues arbitrariamente otro SaaS si no es necesario.

Si FFmpeg pesado no debería ejecutarse dentro de las Functions de Vercel por límites, tamaño de binarios, CPU, duración o costo, propón explícitamente un worker separado.

Vercel seguirá siendo el host de la aplicación Next.js aunque el worker de audio termine viviendo fuera de Vercel.

La arquitectura debe separar claramente:

WEB/API
de
AUDIO PROCESSING WORKER.

---

# 4. PREPARAR NEXT.JS PARA VERCEL

Quiero que la aplicación web quede preparada para desplegarse correctamente en Vercel.

Audita:

- next.config
- runtime Node vs Edge
- FFmpeg/static binaries
- Prisma
- conexión serverless a Supabase/Postgres
- pooler/direct URLs
- environment variables
- filesystem temporal
- APIs
- streaming de archivos
- Server Components
- middleware/proxy
- headers
- caching
- R2
- CORS
- secrets
- build
- migrations

Clasifica las variables de entorno:

VERCEL / SERVER ONLY
PUBLIC
SUPABASE
R2
TURNSTILE
BREVO
DATABASE
AUDIO WORKER

No pongas secretos en variables NEXT_PUBLIC_*.

---

# SEGURIDAD

Durante toda la migración:

- No elimines datos de producción.
- No ejecutes migraciones destructivas sin indicarlo.
- No borres auth legacy antes de completar la transición.
- No hardcodees secrets.
- No muestres secrets en logs.
- No desactives verificaciones para “hacer que funcione”.
- No hagas públicas las buckets de masters.
- No permitas confiar en roles enviados desde el frontend.
- Toda autorización sensible debe verificarse server-side.
- Las acciones ADMIN deben comprobar el rol en servidor.
- Revisa exposición de endpoints internos.
- Revisa cookies.
- Revisa CSRF cuando corresponda.
- Revisa rate limiting.
- Mantén Turnstile donde aporte protección.
- Valida input con el sistema existente (por ejemplo Zod si ya se usa).

---

# COMPATIBILIDAD

Es MUY importante evitar romper funcionalidades existentes.

Antes de modificar algo identifica:

- login
- logout
- signup/invitations
- password reset
- catálogo
- reproducción de audio
- uploads
- edición de tracks
- análisis de audio
- downloads
- playlists
- permisos
- panel admin
- APIs usadas por frontend
- integraciones existentes

Preserva contratos/API existentes cuando sea razonable.

Si necesitas romper uno, documenta por qué y migra todos sus consumidores.

---

# TESTING

Al terminar cada fase quiero:

- TypeScript
- ESLint
- tests existentes
- nuevos tests de los flujos críticos
- production build

Y pruebas específicas para:

AUTH:
- usuario no autenticado
- usuario autenticado
- roles
- sesión expirada
- logout
- acceso ADMIN
- password recovery

R2:
- master privado
- preview
- upload autorizado
- download autorizado
- download rechazado

AUDIO:
- job creado
- procesamiento correcto
- failure
- retry
- job duplicado/idempotencia

---

# DOCUMENTACIÓN

Actualiza la documentación técnica del repo.

Quiero un documento final que explique:

LYNX INFRASTRUCTURE

WEB:
Vercel + Next.js

DATABASE:
Supabase PostgreSQL

ORM:
Prisma

AUTH:
Supabase Auth

OBJECT STORAGE:
Cloudflare R2

ANTI-BOT:
Cloudflare Turnstile

AUDIO:
FFmpeg/FFprobe + background processing

EMAIL:
Brevo

También:

- flujo de upload
- flujo de reproducción
- flujo de procesamiento
- auth
- dónde vive cada secreto
- variables necesarias
- procedimiento de deploy
- procedimiento de migration
- rollback

El README antiguo debe corregirse si contiene tecnologías que ya no utiliza el proyecto.

---

# FORMA DE TRABAJO

NO quiero que intentes cambiar todo simultáneamente.

Primero haz una auditoría del ESTADO REAL del repo.

Después genera un plan de implementación dividido como mínimo en:

FASE 0 — Baseline / backup / tests
FASE 1 — Supabase Auth
FASE 2 — R2 private masters + previews
FASE 3 — Background audio jobs / FFmpeg
FASE 4 — Vercel production readiness
FASE 5 — Hardening, tests y documentación

Para cada fase especifica:

1. problema actual
2. arquitectura propuesta
3. archivos afectados
4. cambios en Prisma
5. migrations necesarias
6. variables de entorno nuevas/eliminadas
7. riesgos
8. compatibilidad
9. estrategia de rollback
10. criterios de aceptación
11. tests a ejecutar

Identifica dependencias entre fases.

Si descubres que el orden anterior no es técnicamente correcto, propón uno mejor y explica brevemente por qué.

## IMPORTANTE PARA ESTA PRIMERA EJECUCIÓN

Estamos en PLAN MODE.

NO modifiques archivos todavía.

NO ejecutes migraciones.

NO cambies producción.

NO borres código.

Inspecciona exhaustivamente el repositorio y entrégame el PLAN concreto basado en el código REAL.

Evita explicaciones genéricas. Cita rutas, módulos, tablas, funciones y dependencias reales del repositorio.

Al final entrega:

1. Arquitectura actual encontrada.
2. Problemas/riesgos encontrados.
3. Arquitectura objetivo final.
4. Plan por fases.
5. Lista de decisiones que deben quedar resueltas antes de ejecutar.
6. Lista exacta de servicios/configuración externa que yo tendré que crear o configurar manualmente.
7. Qué puede realizar Codex completamente por código y qué requiere intervención mía en Supabase, Cloudflare o Vercel.