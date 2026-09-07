



Evalúa, registra, planifica, ejecuta, implementa, soluciona y resuelve.




# PROMPT PARA SIGUIENTE CHAT (MODIFICAR SEGÚN NECESIDAD)
- Lee y respeta `docs/AI_CONTEXT.md` en este repo y trabaja estrictamente bajo sus reglas (contiene reglas, estado UI actual, estética y naming del waveform Artlist-style). No repitas cambios ya asentados. No expongas secretos. Prioriza UX minimalista y accesible.
- Objetivo actual: rehacer la ficha pública `/track/[id]` con la estética vigente (tokens bg-background/text-foreground/bg-card/border, radios 2px salvo íconos circulares).
- Waveforms: usar SIEMPRE el “waveform Artlist-style” (WaveformScrubber/PublicAudioBar), base gris + progreso foreground, responsive a light/dark, sin bordes.
- Catálogo base (referencia de consistencia): tabla con colgroup 22/48/10/20, bordes 2px, buttons actions redondos con tooltips shadcn (delay 200ms, bg-card/text-foreground/border, arrow size-2).
- Fondos y bordes: `bg-background` general, `bg-card` para superficies, `border` para delinear; radios 2px en cards/inputs/pills; tooltips y modals alineados a estos tokens.
- Mantén accesibilidad (labels, focus visibles), copy sobrio, UX cinematográfica/minimal, dark-by-default pero bien en light.

## Prompt de arranque en PC2 (copiar/pegar)
- Abrir y leer `docs/AI_CONTEXT.md` y `DEPENDENCIAS.md` para respetar reglas, estado UI y dependencias (waveform Artlist-style, hero en iteración con bordes debug y bloque dummy).
- Objetivo: seguir avanzando el hero de `/track/[id]` (cover izquierda, texto/acciones derecha, bloque intermedio dummy, waveform inline con timer y separador). Bordes debug activos en título/botones/bloque intermedio hasta nuevo aviso.
- No exponer secretos; usar tokens `bg-background`, `text-foreground`, `bg-card`, `border`; radios 2px salvo íconos circulares. Waveform siempre con `WaveformScrubber/PublicAudioBar`, base gris + progreso foreground.
- Rama de trabajo: verifica la rama activa antes de cambiarla. Si cambias schema Prisma → `npx prisma generate`. Comandos usuales: `npm run dev`, `npm run build`, `npm run test` (si aplica).
- Variables esperadas (sin valores): `DATABASE_URL`, `DIRECT_URL`, R2 (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PREVIEWS_BUCKET`, `R2_PRIVATE_BUCKET`, `R2_ENDPOINT`) y, solo para worker, `FFMPEG_PATH`/`FFPROBE_PATH`. Consulta `docs/operations/environment-matrix.md`.
