# Auditoría e implementación · Lynx Platform

Fecha: 2026-09-05  
Checkpoint previo: `94ac428` (`checkpoint: preserve platform setup before audit`)

## Objetivo del producto

Platform debe volver a ser fácil de entender y operar. Su núcleo es un catálogo
digital de música con capacidad profesional de metadata, audio, derechos y
licencias. Un catálogo futuro de merchandising puede convivir con él, pero no
justifica aumentar hoy la complejidad del dominio musical.

Se conservó intencionalmente el lenguaje visual del catálogo: banner principal,
grilla, filtros, selección lateral y reproductor. La intervención se concentró
en jerarquía, carga, seguridad y reducción de código.

## Diagnóstico

### Catálogo

- La página solicitaba hasta 220 tracks y sus waveforms antes de ser interactiva.
- Cada tarjeta montaba dos textos animados con observadores, timers y listeners.
- La búsqueda actualizaba toda la colección en cada pulsación.
- Tracks y banners se consultaban de forma secuencial.

### Ficha de track

- La información necesaria competía visualmente al mismo nivel.
- Las licencias mostraban demasiadas condiciones abiertas simultáneamente.
- La zona de recomendaciones volvía a montar el catálogo completo, incluidos
  filtros, panel de detalle, banners y estado de reproducción duplicado.
- Algunas consultas independientes se ejecutaban una después de otra.

### Reproductor y audio

- El reproductor serializaba la cola completa y los waveforms en
  `sessionStorage` durante cada actualización de tiempo.
- La grilla transportaba la forma de onda binaria de todos los tracks aunque
  sólo se necesita al abrir una ficha. El reproductor admite un fallback visual.
- La firma de uploads aceptaba solicitudes sin comprobar sesión o rol.
- El análisis con FFmpeg sigue ocurriendo dentro de una petición HTTP; es válido
  para un catálogo pequeño, pero no es la arquitectura final para masters largos
  o procesamiento concurrente.

### Backend y mantenimiento

- Existían copias de respaldo y seis variantes completas de la ficha dentro de
  `src`, por lo que TypeScript y ESLint las procesaban.
- Había una pila tRPC/React Query y dependencias drag-and-drop sin consumidores.
- Varias páginas y APIs de demostración estaban publicadas junto al producto.
- El panel de tracks ofrecía siempre una vista completa gigante además de sus
  módulos, duplicando caminos para hacer el mismo trabajo.
- Las versiones instaladas de Next.js, AWS SDK y una dependencia de metadata de
  audio acumulaban alertas de seguridad evitables.

## Soluciones implementadas

### 1. Catálogo más rápido, sin rediseñarlo

- Consultas de tracks y banner ejecutadas en paralelo.
- Límite de consulta reducido de 220 a 120 registros.
- Render inicial de 30 tracks y carga progresiva en lotes de 30 con `Ver más`.
- Búsqueda diferida para que escribir no bloquee la interfaz.
- Tarjetas simplificadas a truncado CSS, eliminando decenas o cientos de
  observadores y timers.
- Waveforms excluidos del payload de la grilla; la ficha individual mantiene la
  forma de onda real y el player usa un fallback visual liviano en el catálogo.
- Imágenes críticas marcadas con prioridad y decodificación asíncrona; tarjetas
  y recomendaciones mantienen carga diferida.

### 2. Ficha de track con información progresiva

- Resumen principal reducido a datos de decisión: identidad, BPM, tonalidad,
  duración, disponibilidad y licencias.
- Perfil creativo y restricciones conservados dentro de secciones desplegables.
- Comparador de licencias compacto: muestra cuatro condiciones clave y deriva el
  detalle exhaustivo al diálogo `Ver licencias`.
- Recomendaciones reemplazadas por una tira liviana de ocho tracks.
- Relevancia calculada por coincidencias de mood, uso y género usando una sola
  consulta acotada, en vez de encadenar consultas y montar otro catálogo.

### 3. Reproductor y audio

- Persistencia de sesión limitada a una vez cada dos segundos y al abandonar la
  página, en vez de escribir en cada `timeupdate`.
- Waveforms eliminados de la copia persistida de track y cola.
- Firma de uploads restringida a `ADMIN` y `STAFF`.
- Directorios de upload limitados a una lista cerrada y nombre de archivo
  acotado, conservando tipos MIME, tamaño máximo y expiración de 60 segundos.
- Operación masiva de borrado de solicitudes restringida a administradores.

### 4. Backend y panel más pequeños

- Eliminadas copias de catálogo, siete variantes/implementaciones antiguas de
  ficha, demos públicas, endpoints de debug, mocks y componentes que sólo
  soportaban demos o pantallas archivadas.
- Eliminados tRPC, React Query, SuperJSON, dnd-kit y `music-metadata` porque no
  tenían consumidores.
- Los endpoints generales de tracks ahora requieren autenticación; el catálogo
  público conserva sus rutas específicas.
- Navegación administrativa reagrupada en español y orientada al flujo real:
  subir audio, completar metadata, publicar catálogo y gestionar licencias.
- Editor normal reducido a seis módulos: Resumen, Creativo, Derechos, Metadata,
  Entregables y Revisión. La vista completa se conserva sólo como ruta de
  compatibilidad para no perder funcionalidad.

### 5. Plataforma y dependencias

- Next.js actualizado a 16.3.4 y migración de `middleware` a `proxy`.
- Build migrado a Turbopack con FFmpeg/FFprobe como paquetes externos de servidor.
- AWS SDK actualizado y Prisma alineado en 6.19.3.
- `npm audit fix` aplicado únicamente a actualizaciones compatibles.
- Más de 9.700 líneas obsoletas eliminadas; reducción neta aproximada del
  cambio completo: 7.800 líneas.

## Resultado técnico verificado

- TypeScript: pasa sin errores.
- ESLint: pasa sin errores ni advertencias.
- Pruebas unitarias: 6 de 6 pasan.
- Build de producción con Next.js 16/Turbopack: pasa; el proyecto conserva 65
  módulos de página y 70 route handlers.
- Smoke test del build: `/` y `/catalog` responden 200; tracks, firma de uploads
  y borrado masivo responden 401 sin sesión.
- Auditoría npm: bajó de 23 alertas iniciales a 3 altas, todas asociadas a
  `deepmerge-ts` dentro del tooling de Prisma. `npm audit` propone una regresión
  de Prisma como supuesto arreglo; no se forzó porque sería menos segura para la
  estabilidad del proyecto.

Las pruebas de contrato se separaron en `npm run test:contract`, porque requieren
un servidor activo, base configurada y una sesión válida. Ya no hacen fallar las
pruebas unitarias cuando el entorno local no está encendido.

## Audio: siguiente fase recomendada

Estas tareas no se improvisaron en esta intervención porque requieren decidir
infraestructura, migrar datos y disponer de credenciales reales:

1. Guardar masters, stems y entregables en acceso privado.
2. Generar un preview MP3/OGG separado para reproducción pública.
3. Mover FFmpeg a una cola con estados `PENDING`, `PROCESSING`, `READY` y
   `FAILED`, reintentos idempotentes y logs.
4. Añadir multipart reanudable para masters grandes y verificar checksum.
5. Agregar paginación real de servidor cuando el catálogo supere los 120 tracks.
6. Modelar merchandising como un módulo de productos separado, compartiendo
   navegación y campañas, sin mezclarlo con la tabla `Track`.

El detalle de arquitectura y checklist vive en
[`TODO_05092026.md`](./TODO_05092026.md).

## Cómo volver al checkpoint sin perder este trabajo

Para inspeccionar el estado anterior de forma segura, crear una rama desde el
checkpoint:

```bash
git switch -c platform-antes-auditoria 94ac428
```

No es necesario usar `reset --hard`; el checkpoint queda guardado en el historial.
