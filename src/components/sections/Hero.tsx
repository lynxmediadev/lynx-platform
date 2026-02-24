// src/components/sections/Hero.tsx

type HeroProps = {
  eyebrow?: string;
  slantLeft?: string;
  headlineMain?: string;
  slantRight?: string;
  headlineSub?: string;
  description?: string;
  projectTitle?: string;
  projectCategory?: string;
  ctaText?: string;
  ctaHref?: string;
  backgroundImageUrl?: string;
};

const DEFAULTS: Required<HeroProps> = {
  eyebrow: "SYNC LICENSING & MUSIC CATALOGUE",
  slantLeft: "the",
  headlineMain: "SOUND",
  slantRight: "of",
  headlineSub: "LYNX MUSIC",
  description:
    "En ODR Records concebimos la música como un lenguaje de emociones al servicio de la imagen. Cada proyecto es una oportunidad para trazar atmósferas únicas, donde la técnica y la sensibilidad convergen en un diálogo creativo con directores, agencias y marcas. Nuestro catálogo curado y la composición a medida buscan que cada nota encuentre su lugar exacto en la historia que quieres contar.",
  projectTitle: "Featured Reel",
  projectCategory: "Film / TV / Ads",
  ctaText: "Explorar catálogo",
  ctaHref: "/catalog",
  backgroundImageUrl: "/images/hero/hero-bg-2.png",
};

export default function Hero(props: HeroProps) {
  const {
    eyebrow,
    slantLeft,
    headlineMain,
    slantRight,
    headlineSub,
    description,
    projectTitle,
    projectCategory,
    ctaText,
    ctaHref,
    backgroundImageUrl,
  } = { ...DEFAULTS, ...props };

  return (
    <section
      id="hero"
      aria-label="Hero principal de ODR Records"
      className="relative min-h-screen w-full overflow-hidden"
    >
      {/* Fondo + overlays (sin máscara) */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {/* Fondo (imagen) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
        />

        {/* Overlay 1: unifica tono, oscurece sutil con multiply */}
        <div
          className="absolute inset-0"
          style={{
            mixBlendMode: "multiply",
            // Ajusta 30–45% según gusto; no toques el tramo final
            background:
              "color-mix(in srgb, var(--color-dark) 38%, transparent)",
          }}
        />

        {/* Overlay 2 (clave): FADE A SÓLIDO var(--color-dark) en el borde inferior */}
        <div
          className="absolute inset-0"
          style={{
            // Gradiente normal (sin blend): en el último tramo se vuelve 100% var(--color-dark)
            background:
              "linear-gradient(to bottom, color-mix(in srgb, var(--color-dark) 0%, transparent) 0%, color-mix(in srgb, var(--color-dark) 100%, transparent) 100%)",
          }}
        />
      </div>

      {/* Contenido */}
      <div className="relative z-10 mx-auto grid min-h-screen max-w-screen grid-cols-12 items-end px-6 pb-8 md:px-8 md:pb-12">
        {/* Izquierda: Reel info (pegado al borde) */}
        <div className="col-span-6 flex flex-col justify-end gap-0 text-left md:col-span-3">
          <div className="font-display scale-y-120 text-lg font-black tracking-normal text-[var(--color-light)]/90 uppercase">
            {projectTitle}
          </div>
          <div className="font-ui text-[0.625rem] tracking-wider text-[var(--color-light)]/80 uppercase">
            {projectCategory}
          </div>
        </div>

        {/* Centro: Eyebrow + Títulos + Descripción */}
        <div className="col-span-12 flex flex-col items-center text-center md:col-span-6">
          {/* Eyebrow */}
          <div className="font-ui mb-3 text-xs tracking-[0.25em] text-[var(--color-light)]/85 uppercase md:text-sm">
            {eyebrow}
          </div>

          {/* Línea 1 */}
          <div className="flex items-baseline justify-center gap-3 pr-2 md:gap-2">
            <span className="font-elegant text-2xl leading-none text-[var(--color-light)]/85 italic md:text-3xl lg:text-4xl">
              {slantLeft}
            </span>
            <h1 className="font-cinema-title text-t-1 leading-[0.95] font-black tracking-wide text-[var(--color-light)] md:text-6xl lg:text-7xl">
              {headlineMain}
            </h1>
            <span className="font-elegant text-2xl leading-none text-[var(--color-light)]/85 italic md:text-3xl lg:text-4xl">
              {slantRight}
            </span>
          </div>

          {/* Línea 2 */}
          <h2 className="font-cinema-title mt-1 text-5xl leading-[0.95] font-black tracking-wide text-[var(--color-light)] md:text-6xl lg:text-7xl">
            {headlineSub}
          </h2>

          {/* Descripción */}
          <p className="font-ui text-justify-center mt-4 max-w-full text-xs leading-[0.625rem] text-[var(--color-light)]/90 uppercase md:text-[0.6rem]">
            {description}
          </p>
        </div>

        {/* Derecha: CTA (pegado al borde) */}
        <div className="col-span-6 flex items-end justify-end md:col-span-3">
          <a
            href={ctaHref}
            className="font-ui inline-flex items-center gap-3 rounded-md border border-[var(--color-light)] px-5 py-3 text-[0.625rem] font-bold tracking-wide text-[var(--color-light)] uppercase transition hover:bg-[var(--color-light)] hover:text-[var(--color-dark)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-light)] focus-visible:ring-offset-2"
          >
            <span>{ctaText}</span>
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="rotate-45 transform"
            >
              <path d="M12 2v2h6.59L3 19.59 4.41 21 20 5.41V12h2V2z"></path>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
