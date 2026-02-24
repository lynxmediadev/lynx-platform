# Contexto de ODR Records

## Que es ODR Records
- Plataforma y estudio orientado a clientes audiovisuales y marcas.
- Servicios principales:
  - Musica original para contenido audiovisual (sync licensing, composicion a medida, instrumentales, stems, alt mixes, cutdowns).
  - Produccion y postproduccion de audio: mezcla, masterizacion, edicion, restauracion, diseno sonoro, foley.
  - Sonido directo y registro en terreno (field recording / location sound).
  - Amplificacion/sonorizacion y soporte tecnico de audio para eventos/rodajes (segun oferta).
- Objetivo del sitio: transmitir estetica cinematografica y confiable, y permitir que un cliente encuentre, escuche y licencie musica o solicite servicios de audio sin friccion.

## Producto y arquitectura (alto nivel)
- Sitio publico: home, servicios, catalogo de musica (sync) y contacto.
- Catalogo sync: exploracion, escucha y licenciamiento de tracks.
- Back-office/admin: ingestion de tracks, metadata tecnica, gestion de catalogo, assets y licencias.

## Rutas actuales (resumen operativo)
- Publico:
  - `/` homepage con secciones (Servicios, Catalogo, Contacto).
- Catálogo público: `/catalog` (canónica). Landings `/beats`, `/sync`, `/games` cargan filtro pero canonical apunta a `/catalog`.
- Tracks: URL canónica `/track/[id]`. Alias segmentadas redirigen/usan canonical a la ruta base.
  - `/track/[id]` ficha de track con modal "Licenciar / Contacto".
- Admin:
  - `/admin/tracks` es el panel tecnico principal (antes /admin/analyze).
  - `/admin/track/[id]/edit` es la ficha completa (creativo, IDs, derechos, resumen tecnico + asset).
  - `/admin/uploads` es el flujo de ingesta (wrapper principal).
  - `/admin/licensing` bandeja de solicitudes con link a detalle en `/admin/licensing/[id]`.
  - `/admin/insights` eliminado (no existe).
  - `/admin/track/new` eliminado (usar /admin/uploads).

## Flujos clave (usuario/admin)
- Solicitud de licencia:
  - Usuario: en `/track/[id]` usa el dialog "Licenciar / Contacto".
  - Backend: POST `/api/contact` guarda en `LicensingRequest`.
  - Admin: `/admin/licensing` lista solicitudes y detalle en `/admin/licensing/[id]`.
- Contacto general:
  - Usuario: formulario en homepage (dialog).
  - Backend: POST `/api/contact-request` guarda en `ContactRequest`.

## Stack tecnico
- Next.js (App Router) + TypeScript.
- Tailwind CSS v4.
- Prisma + Postgres (Supabase).
- Assets de audio y waveforms en Cloudflare R2.
- Entorno recomendado: Node 20 LTS en WSL.
 - FFmpeg/FFprobe: usar rutas de Linux en WSL via `FFMPEG_PATH` y `FFPROBE_PATH`.

## Reglas estrictas para cambios
- No exponer secretos: nunca pegar valores de `DATABASE_URL`, API keys, tokens, etc. Solo listar nombres y ubicacion (.env.local).
- Cambios acotados: evitar refactors masivos sin justificar. Respeta estructura y estilos existentes.
- No reestructurar carpetas sin motivo claro.
- Mantener tipado estricto y validaciones coherentes.
- Accesibilidad obligatoria: labels, focus states, roles, y contraste adecuado.

## Convenciones de trabajo con Codex
- Rama de trabajo: `codex1`.
- Commits por bloques de trabajo (cuando se solicite).
- Comandos tipicos permitidos (previa confirmacion):
  - `npm run dev`
  - `npm run build`
  - `npx prisma generate` (cuando se toque Prisma)
  - `npm run test` si aplica
- Validacion minima esperada:
  - `npm run dev`
  - `npm run build` si aplica
  - `npx prisma generate` si hay cambios en Prisma

## Notas operativas
- Archivo local no versionado: `PRE_PROD.md` (checklist antes de prod).
- Ruta de licencia duplicada eliminada: no existe `/tracks/[id]/license`.

## Responsivo (guía rápida)
- Helpers en `globals.css`: `.stack-sm` (columna en mobile), `.table-scroll` (scroll-x amable), `.touch-gap`, `.full-sm` (botón full en sm), `.btn-touch` (hit-area ≥40px).
- Catálogo/track: tablas con scroll-x y waveform bajo; hero del track apila cover/waveform/botones en mobile.
- Admin: headers con wrap, listas (requests, tracks) con scroll-x; track edit usa `table-scroll` para shares/master y botón guardar adaptable.
- Mantener radio global 2px; no hardcodear colores (usar tokens).

## Buenas practicas de UX
- Estetica cinematografica, elegante, minimalista, dark-by-default.
- Alto contraste y jerarquia tipografica clara.
- Copy sobrio y tecnico cuando corresponda; evitar clutter.
- Performance y accesibilidad como prioridades.

## Estado UI actual (catálogo público)
- Página `/catalog` con tabla compacta: colgroup 22% (Title), 48% (Waveform + play), 10% (Length), 20% (Actions).
- Bordes casi cuadrados: radio 2px en contenedores, cards, modals; botones de Actions son redondos. Player/badges en lista usan 2px salvo los íconos de Actions (round).
- Waveform: “Artlist-style” (`WaveformScrubber`), base gris temático, progreso `--foreground`, altura ~28px en la lista, 26px en stems, sin bordes; responde al theme sin refrescar. Usar este nombre en futuros flujos para evitar confusión.
- Play del track en la lista: botón 8x8 a la izquierda del waveform. Fila con padding vertical 8px (py-2), hover con ring suave y separador horizontal fino.
- Tooltips (shadcn): delay 200ms, alineados arriba centrado, offset pequeño, colores `bg-card/text-foreground/border`, flecha reducida.
- Actions actuales: Ver track (ojo) → `/track/[id]`, Ver licencia (card), Stems (card), Probar video (placeholder), Copiar link, Más (dropdown); tooltips cortos.
- Footer player fijo al bottom del viewport; layout sin `min-h-screen` para evitar scroll fantasma.
- Catalog header global visible (FrontendShell ya no oculta header en `/catalog`).
- Navegación segmentada: enlaces desde catálogos usan `/slug/track/[id]`; botón back en la ficha usa el slug activo; canonical apunta a la ruta segmentada cuando existe (fallback `/track/[id]`).

## Ficha pública `/track/[id]` (estado actual)
- Migrada a tokens del theme (`bg-background`, `text-foreground`, `bg-card`, `border`), radio 2px en cards/pills.
- Reproductor `PublicAudioBar` con waveform Artlist-style (base/progreso según theme), metrics en cards con border 2px.
- Pills para moods/uses/restrictions con `border border-border` y fondo `bg-card`.
- Sugerencias y descripción usan cards `bg-card`/`border`; links con hover underline sutil.
- Hero en iteración: cover a la izquierda, texto/acciones a la derecha; waveform inline (con timer) ocupa el ancho inferior. Bordes debug activos en título/botones/bloque intermedio y un bloque dummy (d) entre header y waveform mientras se define metadata inicial de primera vista.

## Notas de consistencia visual
- Preferir radios 2px salvo botones circulares (Actions).
- Fondos: `bg-background` general, `bg-card` para superficies, `border` para delinear.
- Waveforms: siempre usar `WaveformScrubber/PublicAudioBar` con esquema base gris + progreso foreground; referirlo como “waveform Artlist-style”.
- Tooltip shadcn: padding vertical 2, flecha size-2, delay 200ms, colores del tema.

- Admin track: sección Derechos & explotación ahora usa lista de PublishingShare (múltiples writers/publishers), guardado inmediato y suma de 
- Admin track: sección Derechos & explotación ahora usa lista de PublishingShare (múltiples writers/publishers), guardado inmediato y suma de porcentajes por rol.
- Admin track: Master ahora se gestiona solo con la tabla de MasterShare (múltiples titulares, suma de % y guardado inmediato); el campo de texto de master quedó oculto/legacy.
