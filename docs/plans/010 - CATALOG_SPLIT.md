# DIVISIÓN DE CATÁLOGO SEGÚN CATEGORÍA

## A. OBJETIVO
Mira, mi idea principal es la siguiente:
ODR Records ofrecerá dos tipos de catálogos musicales:
1. Catálogo 1: Beats/Instrumentales para artistas, para componer canciones sobre ellos.
Alojado en /beats
2. Catálogo 2: Música para Sync Licensing, para proyectos audiovisuales y comerciales.
Alojado en /sync

Actualmente tenemos la ruta /catalog que muestra un catálogo único con todos los tracks subidos.
- Para conseguirlo, lo que haría sería hacer que este catálogo sea reutilizable, y poner un "TAG" a los tracks o algo que permita decir: el catálogo de beats (/beats) tiene sólo tracks que tienen el TAG "BEAT", o algo así.
- Así mismo con el catálogo SYNC, donde lo que haría sería mostrar en ese catálogo sólo los tracks que tengan el TAG "SYNC" (/sync).
Entonces, para el catálogo reutilizable, sería buena idea que muestre según tags, o según otra cosa que pueda definir más adelante, como artista, género, etc. Entiendo que esto es como aplicar un filtro, pero quiero escalarlo para después poder decir: "hagamos un catálogo de sync sólo de música SAD, y poder embedear ese catálogo en cualquier parte del sitio web.
Junto con este principio, todo lo que no tenga un tag correspondiente, no se muestra en ningún catálogo.

Entonces, quisiera saber antes de continuar:
- ¿Existe una mejor forma de hacer esto? Si existe, explícame cómo sería, en base a qué parámetros se filtraría, etc.
- Mi idea para resolver esto, no es que el catálogo se filtre a través de la URL tipo /catalog?artist=nombre_artista, al menos eso creo, si no que pueda ser como un prop o algo así de un componente reutilizable (catálogo).
Básicamente es eso.
- Para implementar esto, supongo que sería necesario crear nuevos campos en la BD y el schema para cada track, revisa si es así o no.


## B. TU TAREA
Entonces, para implementar este sistema, quisiera que:
1. Me expliques si esta es o no la mejor forma de hacerlo, de acuerdo a buenas prácticas, escalabilidad, soporte y mantención.
2. Si no es la mejor forma de implementarlo, explícame cuál es.
3. Una vez sepamos cuál es la mejor forma de implementarlo, necesito un plan estratégico con pasos a seguir (igual como lo hicimos en /MIX_FORM_PLAN.md) en un documento llamado "CATALOG_SPLIT_PLAN.md", osea que cada paso sea un prompt para yo copiar y pegar aquí en esta conversación. Este paso a paso debe cubrir todo lo necesario para que el sistema quede implementado.
4. Agrega cualquier otra cosa que esté obviando o no esté considerando.







Resultado propuesto (Paso 1):

Modelo
Tag (id, slug, name, type: "catalog" | "mood" | "use" | …).
TrackTag (trackId, tagId) para relación many‑to‑many.
Catalog (id, slug, name, description, filterJson). filterJson permite filtros futuros (ej. {tags:["beat","sad"]}).
Catálogos iniciales: registros en Catalog con slug = beats, sync; y tags beat, sync de type catalog.
Tags dedicados: sí, type="catalog" para no mezclar con moods/uses existentes.
Política: si un track no tiene tag catalog, no aparece en ningún catálogo.
Multipertenencia: un track puede tener múltiples tags de catálogo; por tanto, puede salir en beats y sync (u otros futuros).
/catalog: mantener como alias opcional (wrapper que lista todo con filtro vacío) o redirigir a uno de los catálogos; lo implementaremos como wrapper “all” para no romper links.
Si confirmas, paso a la implementación de schema/migración (Paso 2).