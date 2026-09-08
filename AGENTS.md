# LYNX Platform — instrucciones para agentes

## Fuentes de verdad

- `docs/AI_CONTEXT.md` es el resumen canónico del estado técnico y operativo. Léelo cuando la tarea dependa del estado actual del proyecto.
- El código actual, Git, `prisma/schema.prisma`, migraciones y configuración vigente tienen prioridad ante cualquier contradicción documental.
- Después de leer el contexto, inspecciona solamente los archivos relacionados con la tarea; no audites el repositorio completo sin una razón concreta.

## Contexto y documentación

- Actualiza `docs/AI_CONTEXT.md` solo por cambios materiales de arquitectura, infraestructura, esquema/migraciones, Auth, R2/assets, AudioJob/worker, runtime, comandos, flujos centrales, restricciones o deuda técnica relevante.
- No lo actualices por ajustes visuales menores, copy, spacing, refactors internos o correcciones triviales.
- Mantén el documento compacto y actualizado de forma incremental. Debe explicar cómo funciona LYNX ahora, no ser un changelog.
- Nunca publiques contexto que describa código nuevo que aún no esté incluido en el mismo checkpoint lógico de Git.

## Git y sincronización

- Agrupa cambios relacionados durante una tarea. Crea commit y push solo en checkpoints lógicos, antes de operaciones riesgosas o cuando el usuario lo pida. No uses force push.
- Nunca incluyas `.env.local`, secretos, credenciales, dumps ni backups.
- `SYNC` significa: revisar estado y diff, determinar el bloque lógico, comprobar secretos, actualizar `AI_CONTEXT.md` solo si aplica, ejecutar checks proporcionales, `git diff --check`, crear commits coherentes y hacer push normal a la rama actual. Si no hay un checkpoint seguro, explica el bloqueo sin crear un commit artificial.

## Seguridad y eficiencia

- No expongas secretos ni valores de entorno en terminal, documentación o Git.
- Reutiliza `AI_CONTEXT.md`, el diff y los archivos relevantes para evitar relecturas y pruebas innecesarias; no sacrifiques seguridad ni validación en cambios de datos, Auth o storage.
