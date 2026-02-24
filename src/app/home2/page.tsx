import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

type SimpleService = {
  title: string;
  description: string;
};

type DetailedService = {
  id: number;
  title: string;
  description: string;
  category: "Audiovisual" | "Musical" | "Sync";
};

type ProcessStep = {
  id: number;
  title: string;
  description: string;
};

type ProjectType = {
  label: string;
  title: string;
  description: string;
};

type BlogPost = {
  category: string;
  title: string;
  excerpt: string;
};

const AUDIOVISUAL_SERVICES: SimpleService[] = [
  {
    title: "Audio directo en locación",
    description:
      "Captura de sonido en set para comerciales, documentales, cortometrajes, series y piezas digitales.",
  },
  {
    title: "Postproducción de sonido",
    description:
      "Edición, limpieza, restauración, mezcla y master según estándares broadcast y plataformas.",
  },
  {
    title: "Diseño sonoro y Foley",
    description:
      "Creación de ambientes, FX y Foley originales para potenciar la narrativa y el lenguaje visual.",
  },
  {
    title: "Composición musical para imagen",
    description:
      "Música original alineada al ritmo de montaje, tono emocional y objetivos del proyecto.",
  },
];

const MUSIC_SERVICES: SimpleService[] = [
  {
    title: "Mezcla y masterización",
    description:
      "Mix y master profesionales para singles y álbumes listos para distribución digital y físico.",
  },
  {
    title: "Grabación en calidad estudio",
    description:
      "Sesiones de grabación para voces e instrumentos con cadena profesional de estudio.",
  },
  {
    title: "Beats e instrumentales originales",
    description:
      "Creación de beats y bases exclusivas para artistas, sellos y proyectos de sync.",
  },
  {
    title: "Producción completa de proyectos",
    description:
      "Acompañamiento integral: preproducción, grabación, edición, mezcla y entrega final.",
  },
];

const DETAILED_SERVICES: DetailedService[] = [
  {
    id: 1,
    title: "Producción de sonido para Audiovisual",
    description:
      "Desde el audio directo hasta la mezcla final. Un pipeline completo para cine, TV, publicidad y contenido digital.",
    category: "Audiovisual",
  },
  {
    id: 2,
    title: "Postproducción, diseño sonoro y Foley",
    description:
      "Edición detallada, FX, ambientes y Foley diseñados a medida para construir mundos sonoros sólidos.",
    category: "Audiovisual",
  },
  {
    id: 3,
    title: "Producción y mezcla musical",
    description:
      "Producción artística, mezcla y master para lanzamientos discográficos y piezas musicales para sincronización.",
    category: "Musical",
  },
  {
    id: 4,
    title: "Catálogo y Sync Licensing",
    description:
      "Catálogo propio de obras listas para sincronizar, con gestión de metadata y derechos desde ODR Records.",
    category: "Sync",
  },
  {
    id: 5,
    title: "Contenido para marcas y redes",
    description:
      "Producción de audio y video para campañas, reels, podcast y activaciones digitales.",
    category: "Audiovisual",
  },
  {
    id: 6,
    title: "Proyectos a medida",
    description:
      "Soluciones específicas para proyectos híbridos de arte, instalación, experiencias inmersivas y más.",
    category: "Sync",
  },
];

const PROCESS_STEPS: ProcessStep[] = [
  {
    id: 1,
    title: "Brief y diagnóstico",
    description:
      "Escuchamos el proyecto, definimos objetivos, contexto de exhibición y alcances técnicos y creativos.",
  },
  {
    id: 2,
    title: "Diseño y planificación",
    description:
      "Levantamos necesidades de sonido, música y producción, proponiendo un plan de trabajo claro y ordenado.",
  },
  {
    id: 3,
    title: "Producción y postproducción",
    description:
      "Ejecutamos grabaciones, diseño sonoro, mezcla, master y entregas técnicas según especificaciones.",
  },
  {
    id: 4,
    title: "Entrega y seguimiento",
    description:
      "Entregamos los masters finales, stems y documentación técnica, acompañando los ajustes finales del proyecto.",
  },
];

const PROJECT_TYPES: ProjectType[] = [
  {
    label: "Comerciales & Branded Content",
    title: "Campañas para TV, cine y redes",
    description:
      "Spots, piezas para redes, campañas integradas y contenido de marca que requieren sonido y música alineados a la identidad.",
  },
  {
    label: "Cine, Documental & Series",
    title: "Narrativas long form",
    description:
      "Largometrajes, cortos y series donde el diseño sonoro, los diálogos y la música cuentan la historia junto a la imagen.",
  },
  {
    label: "Videojuegos & Experiencias",
    title: "Interactividad y diseño inmersivo",
    description:
      "Diseño sonoro y música adaptativa para juegos, instalaciones interactivas y experiencias inmersivas.",
  },
  {
    label: "Música & Catálogo",
    title: "Lanzamientos y obras para sync",
    description:
      "Producción musical y catálogo de obras enfocadas en sincronización, listas para licenciamiento.",
  },
];

const BLOG_POSTS: BlogPost[] = [
  {
    category: "Notas de estudio",
    title: "Cómo pensar el sonido en un spot de 15 segundos",
    excerpt:
      "Timing, ritmo y claridad: claves para que la pieza funcione igual de bien con y sin imagen.",
  },
  {
    category: "Sync & Industria",
    title: "Elementos básicos de un buen master para sincronización",
    excerpt:
      "Loudness, headroom, stems y metadata: aspectos que facilitan el trabajo de supervisores y postproductoras.",
  },
  {
    category: "Procesos creativos",
    title: "Diseño sonoro como narrativa, no solo como efecto",
    excerpt:
      "Cómo construir ambientes y transiciones sonoras que acompañen el montaje y la historia.",
  },
];

function SectionShell({ children }: { children: ReactNode }) {
  return (
    <section className="lm-section">
      <div className="lm-container">{children}</div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      {/* 1) HERO PRINCIPAL – inspirado en hero de Antra */}
      <section className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 bg-auto bg-center"
          style={{ backgroundImage: "url('/images/hero/hero7.jpg')" }}
        />
        <div className="lm-hero-overlay absolute inset-0" />

        <div className="lm-container relative flex min-h-[80vh] flex-col justify-center py-24">
          <div className="max-w-xl space-y-5">
            <p className="lm-chip">
              <span className="bg-primary h-1 w-1 rounded-full" />
              Estudio de sonido · Música · Imagen
            </p>

            <h1 className="text-foreground text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Diseñamos el sonido
              <br />
              que sostiene tu imagen.
            </h1>

            <p className="lm-hero-lead">
              ODR Records integra producción sonora, postproducción, diseño
              sonoro y música original para proyectos audiovisuales, contenido
              de marca y lanzamientos musicales.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/catalog"
                className="lm-btn lm-btn-primary px-6 py-2.5"
              >
                Explorar catálogo para Sync
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="#services"
                className="lm-btn lm-btn-ghost px-5 py-2.5"
              >
                Ver servicios
              </Link>
            </div>
          </div>

          <div className="mt-16 flex items-center">
            <a
              href="#services"
              className="lm-icon-btn group"
              aria-label="Bajar a servicios"
            >
              <span className="translate-y-0.5 text-lg transition-transform group-hover:translate-y-1">
                ↓
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* 2) SECCIÓN: QUÉ HACEMOS – tarjetas de servicios principales (4 + 4) */}
      <SectionShell>
        <div id="services" className="space-y-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <p className="lm-kicker lm-kicker-muted">Quiénes somos</p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Experiencia en audio{" "}
                <span className="text-foreground">para imagen y música</span>.
              </h2>
              <p className="lm-prose">
                ODR Records es un estudio de audio para imagen y música. Nos
                enfocamos en criterio técnico, estética sonora y entregas
                consistentes para equipos de post y marcas.
              </p>
            </div>

            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Entregables: master + stems por destino.</li>
              <li>• QC: loudness / true peak / compatibilidad.</li>
              <li>• Metadata lista para sync y post.</li>
            </ul>
          </div>

          {/* Tarjetas – Audiovisual */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {AUDIOVISUAL_SERVICES.map((service) => (
              <article
                key={service.title}
                className="lm-card flex h-full flex-col justify-between"
              >
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">{service.title}</h3>
                  <p className="lm-prose-xs">{service.description}</p>
                </div>

                <div className="text-muted-foreground mt-4 flex items-center justify-between text-xs">
                  <span>Audiovisual</span>
                  <span className="border-accent bg-accent h-7 w-7 rounded-full border" />
                </div>
              </article>
            ))}
          </div>

          {/* Tarjetas – Musical */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {MUSIC_SERVICES.map((service) => (
              <article
                key={service.title}
                className="lm-card flex h-full flex-col justify-between"
              >
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">{service.title}</h3>
                  <p className="lm-prose-xs">{service.description}</p>
                </div>

                <div className="text-muted-foreground mt-4 flex items-center justify-between text-xs">
                  <span>Musical</span>
                  <span className="border-border h-7 w-7 rounded-full border" />
                </div>
              </article>
            ))}
          </div>

          {/* Servicios detallados (integrado para evitar redundancias) */}
          <div className="grid gap-10 pt-2 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)] lg:items-center">
            <div className="space-y-4">
              <p className="lm-kicker lm-kicker-muted">Servicios detallados</p>
              <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Seis líneas, una sola{" "}
                <span className="text-primary">casa de producción</span>.
              </h3>
              <p className="lm-prose">
                Contrata por módulo o integra un flujo completo según alcance.
              </p>

              <div className="border-border bg-card relative mt-2 overflow-hidden rounded-[1.75rem] border">
                <div
                  className="aspect-[16/10] w-full bg-cover bg-center"
                  style={{
                    backgroundImage: "url('/images/home/services-audio.jpg')",
                  }}
                />
                <div className="lm-caption">
                  Diseño, mezcla, música y catálogo integrados, con estándar de
                  entrega para post.
                </div>
              </div>
            </div>

            <div className="lm-card-tight space-y-3">
              {DETAILED_SERVICES.map((service) => (
                <div
                  key={service.id}
                  className="hover:bg-accent/55 flex items-start gap-4 rounded-2xl px-3 py-3 transition-colors"
                >
                  <div className="text-muted-foreground mt-1 text-xs font-semibold">
                    {String(service.id).padStart(2, "0")}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">{service.title}</h3>
                      <span className="text-primary text-[0.7rem] font-semibold tracking-[0.16em] uppercase">
                        {service.category}
                      </span>
                    </div>
                    <p className="lm-prose-xs">{service.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionShell>

      {/* 3) BLOQUE “ESTUDIO” – ahora invertido (contraste correcto) */}
      <section className="lm-invert">
        <SectionShell>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)] lg:items-center">
            <div className="space-y-6">
              <p className="lm-kicker lm-kicker-accent">Estudio · ODR Records</p>

              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Estándar de entrega{" "}
                <span className="text-primary">para post y sync</span>.
              </h2>

              <div className="text-muted-foreground grid gap-3 text-sm sm:grid-cols-2">
                <ul className="space-y-2">
                  <li>• Brief con alcance y formatos definidos.</li>
                  <li>• QC por destino (loudness / peak / compatibilidad).</li>
                  <li>• Masters, stems y versiones cuando aplica.</li>
                </ul>
                <ul className="space-y-2">
                  <li>• Naming y organización listos para post.</li>
                  <li>• Feedback claro, cambios trazables.</li>
                  <li>• Coordinación hasta entrega final.</li>
                </ul>
              </div>

              <p className="text-muted-foreground text-xs">
                Menos fricción en post, más consistencia en entrega.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/catalog"
                  className="lm-btn lm-btn-primary px-5 py-2.5"
                >
                  Ver catálogo para Sync
                </Link>

                <a
                  href="#process"
                  className="lm-btn lm-btn-outline px-5 py-2.5"
                >
                  Ver proceso de trabajo
                </a>
              </div>
            </div>

            <div className="border-border bg-card relative h-72 overflow-hidden rounded-[2rem] border sm:h-80 lg:h-96">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: "url('/images/home/studio-lynx.jpg')",
                }}
              />
              <div className="lm-media-overlay absolute inset-0" />
            </div>
          </div>
        </SectionShell>
      </section>

      {/* 5) PROCESO – tarjetas numeradas */}
      <SectionShell>
        <div id="process" className="space-y-10">
          <div className="max-w-3xl space-y-3">
            <p className="lm-kicker lm-kicker-muted">Cómo trabajamos</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Un proceso claro{" "}
              <span className="text-primary">para proyectos complejos</span>.
            </h2>
            <p className="lm-prose">
              Nuestro flujo acompaña al equipo creativo y técnico desde la
              definición del proyecto hasta la entrega final, cuidando tiempos,
              estándares y comunicación.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {PROCESS_STEPS.map((step) => (
              <article
                key={step.id}
                className="lm-card flex h-full flex-col justify-between p-5"
              >
                <div className="space-y-3">
                  <p className="text-primary text-xs font-semibold">
                    {String(step.id).padStart(2, "0")}.
                  </p>
                  <h3 className="text-sm font-semibold">{step.title}</h3>
                  <p className="lm-prose-xs">{step.description}</p>
                </div>
                <p className="text-muted-foreground/25 mt-4 text-right text-4xl font-semibold">
                  {String(step.id).padStart(2, "0")}
                </p>
              </article>
            ))}
          </div>
        </div>
      </SectionShell>

      {/* 6) PROYECTOS / TIPOS DE TRABAJO – cards grandes */}
      <SectionShell>
        <div className="space-y-10">
          <div className="max-w-3xl space-y-3">
            <p className="lm-kicker lm-kicker-muted">Proyectos</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Tipos de proyectos{" "}
              <span className="text-primary">que trabajamos habitualmente</span>
              .
            </h2>
            <p className="lm-prose">
              Cada categoría tiene exigencias distintas en términos de timing,
              narrativa y especificaciones técnicas. Adaptamos nuestro flujo a
              cada una.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {PROJECT_TYPES.slice(0, 3).map((project) => (
              <article
                key={project.title}
                className="lm-card-frame flex h-full flex-col"
              >
                <div
                  className="aspect-[4/3] w-full bg-cover bg-center"
                  style={{
                    backgroundImage: "url('/images/home/project-generic.jpg')",
                  }}
                />
                <div className="flex flex-1 flex-col justify-between px-5 pt-4 pb-5">
                  <div className="space-y-2">
                    <span className="lm-badge">{project.label}</span>
                    <h3 className="text-base font-semibold">{project.title}</h3>
                    <p className="lm-prose-xs">{project.description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </SectionShell>

      {/* EQUIPO / SOBRE LYNX – layout tipo Antra “Meet the experts” */}
      <SectionShell>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)] lg:items-center">
          <div className="space-y-4">
            <p className="text-xs font-semibold tracking-[0.22em] text-[var(--lm-text-muted)] uppercase">
              Estudio Lynx
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Un estudio pequeño{" "}
              <span className="text-[var(--lm-accent)]">
                con mentalidad de casa de post
              </span>
              .
            </h2>
            <p className="text-sm leading-relaxed text-[var(--lm-text-muted)]">
              ODR Records nace desde la ingeniería en sonido, la producción
              musical y la experiencia trabajando junto a productoras, artistas
              y equipos de postproducción. El foco está en resolver proyectos
              con detalle y comunicación clara.
            </p>

            <ul className="mt-4 space-y-2 text-sm text-[var(--lm-text-main)]">
              <li>01 · Dirección de sonido y mezcla final.</li>
              <li>02 · Diseño sonoro, Foley y ambientes.</li>
              <li>03 · Producción musical para artistas y sync.</li>
              <li>04 · Coordinación técnica y entrega a postproductoras.</li>
            </ul>
          </div>

          <div className="flex flex-col gap-4 rounded-3xl border border-[var(--lm-surface-border)] bg-[var(--lm-surface-bg)] p-5 shadow-sm sm:flex-row sm:items-center">
            <div className="h-40 w-40 flex-shrink-0 overflow-hidden rounded-2xl bg-[color-mix(in_oklab,white_6%,transparent)] sm:h-48 sm:w-48">
              <div
                className="h-full w-full bg-cover bg-center"
                style={{
                  backgroundImage: "url('/images/home/team-diego.jpg')",
                }}
              />
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.22em] text-[var(--lm-accent)] uppercase">
                  Dirección
                </p>
                <p className="text-base font-semibold">
                  Diego Fernández · ODR Records
                </p>
                <p className="text-xs text-[var(--lm-text-muted)]">
                  Ingeniería en sonido, mezcla, diseño sonoro y producción
                  musical.
                </p>
              </div>

              <p className="text-xs leading-relaxed text-[var(--lm-text-muted)]">
                Para proyectos de mayor escala trabajamos con una red de
                colaboradores en cámara, diseño, animación, música y
                postproducción, conformando equipos a la medida según cada
                proyecto.
              </p>
            </div>
          </div>
        </div>
      </SectionShell>

      {/* BLOG / NOTAS – cards (placeholder, inspirado en sección blog) */}
      <SectionShell>
        <div className="space-y-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-semibold tracking-[0.22em] text-[var(--lm-text-muted)] uppercase">
              Notas y recursos
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Miradas sobre sonido,{" "}
              <span className="text-[var(--lm-accent)]">
                música y sincronización
              </span>
              .
            </h2>
            <p className="text-sm leading-relaxed text-[var(--lm-text-muted)]">
              Una selección de ideas, aprendizajes de proyectos y conceptos
              técnicos explicados de forma clara para equipos creativos y de
              producción.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {BLOG_POSTS.map((post) => (
              <article
                key={post.title}
                className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-[var(--lm-surface-border)] bg-[var(--lm-surface-bg)] shadow-sm"
              >
                <div
                  className="aspect-[4/3] w-full bg-cover bg-center"
                  style={{
                    backgroundImage: "url('/images/home/blog-placeholder.jpg')",
                  }}
                />
                <div className="flex flex-1 flex-col justify-between px-5 pt-4 pb-5">
                  <div className="space-y-2">
                    <span className="inline-flex rounded-full bg-[var(--lm-accent-soft)] px-3 py-1 text-[0.7rem] font-semibold tracking-[0.16em] text-[var(--lm-accent)] uppercase">
                      {post.category}
                    </span>
                    <h3 className="text-base font-semibold">{post.title}</h3>
                    <p className="text-xs leading-relaxed text-[var(--lm-text-muted)]">
                      {post.excerpt}
                    </p>
                  </div>

                  <p className="mt-4 text-xs font-medium text-[var(--lm-accent)]">
                    Próximamente · Blog de ODR Records
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </SectionShell>

      {/* CTA NEWSLETTER / CONTACTO – inspirado en “Join our newsletter” */}
      <SectionShell>
        <div className="space-y-6 rounded-3xl border border-[var(--lm-surface-border)] bg-[var(--lm-surface-bg)] px-6 py-10 text-center shadow-sm md:px-10">
          <p className="text-xs font-semibold tracking-[0.22em] text-[var(--lm-text-muted)] uppercase">
            Mantente al tanto
          </p>

          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Únete a las novedades de{" "}
            <span className="text-[var(--lm-accent)]">ODR Records</span>.
          </h2>

          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[var(--lm-text-muted)]">
            Próximamente compartiremos notas técnicas, publicaciones de catálogo
            y convocatorias para colaboraciones. Mientras tanto, puedes
            escribirnos directamente para hablar de tu proyecto.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
            <Link
              href="mailto:contacto@lynxmedia.cl"
              className="lm-btn lm-btn-primary px-6 py-2.5"
            >
              Escribir a ODR Records
              <ArrowRight className="h-4 w-4" />
            </Link>

            <p className="text-xs text-[var(--lm-text-muted)]">
              También podemos coordinar una reunión para revisar tu proyecto en
              detalle.
            </p>
          </div>
        </div>
      </SectionShell>

      {/* FOOTER OSCURO – inspirado en footer de Antra */}
      <footer className="lm-footer-dark">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 text-sm lg:flex-row lg:justify-between lg:px-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.22em] text-[var(--lm-accent)] uppercase">
              ODR Records
            </p>
            <p className="max-w-sm text-sm text-[color-mix(in_oklab,white_88%,transparent)]">
              Estudio de audio, diseño sonoro, música original y catálogo para
              sincronización en cine, TV, publicidad, videojuegos y proyectos
              musicales.
            </p>
            <p className="text-xs text-[color-mix(in_oklab,white_55%,transparent)]">
              Santiago de Chile · Trabajo remoto y presencial según proyecto.
            </p>
          </div>

          <div className="grid gap-8 text-xs sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <p className="font-semibold text-[color-mix(in_oklab,white_92%,transparent)]">
                Servicios
              </p>
              <ul className="space-y-2 text-[color-mix(in_oklab,white_70%,transparent)]">
                <li>Mix & Master para proyectos musicales</li>
                <li>Audio directo y postproducción</li>
                <li>Diseño sonoro y Foley</li>
                <li>Composición y producción musical</li>
                <li>Catálogo y Sync Licensing</li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-[color-mix(in_oklab,white_92%,transparent)]">
                Enlaces
              </p>
              <ul className="space-y-2 text-[color-mix(in_oklab,white_70%,transparent)]">
                <li>
                  <Link href="/catalog" className="hover:text-white">
                    Catálogo público
                  </Link>
                </li>
                <li>Servicios para audiovisual</li>
                <li>Servicios para música</li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-[color-mix(in_oklab,white_92%,transparent)]">
                Contacto
              </p>
              <ul className="space-y-2 text-[color-mix(in_oklab,white_70%,transparent)]">
                <li>
                  <a
                    href="mailto:contacto@lynxmedia.cl"
                    className="hover:text-white"
                  >
                    contacto@lynxmedia.cl
                  </a>
                </li>
                <li>Redes · Próximamente</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-[color-mix(in_oklab,white_10%,transparent)]">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-4 text-[0.7rem] text-[color-mix(in_oklab,white_55%,transparent)] sm:flex-row lg:px-6">
            <p>
              © {new Date().getFullYear()} ODR Records. Todos los derechos
              reservados.
            </p>
            <p>Audio · Música · Imagen · Sync Licensing.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
