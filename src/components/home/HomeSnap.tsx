"use client";

/**
 * src/components/home/HomeSnap.tsx
 * =========================================================
 * PERAS Y MANZANAS
 * - Implementa el Homepage como “diapositivas” con CSS Scroll Snap:
 *   - El scroll NO ocurre en la ventana, sino en un contenedor interno.
 *   - Cada sección ocupa 1 viewport visible: height = calc(100dvh - --header-h).
 * - Evita doble scrollbar bloqueando overflow en html/body mientras está montado.
 * - Maneja:
 *   - active section (IntersectionObserver)
 *   - navegación lateral (dots + texto)
 *   - navegación por hash (#services, etc.)
 *   - “hint” del primer panel (Servicios + flecha) que se oculta al scrollear
 * - Renderiza cada sección desde su propio archivo.
 * =========================================================
 */

import { useEffect, useMemo, useRef, useState } from "react";
import HomeDotsNav from "@/components/home/HomeDotsNav";
import { SECTIONS } from "@/components/home/homeSections";
import { usePrefersReducedMotion } from "@/components/home/usePrefersReducedMotion";

import HeroSection from "@/components/home/HeroSection";
import ServicesSection from "@/components/home/ServicesSection";
import CatalogSection from "@/components/home/CatalogSection";
import PortfolioSection from "@/components/home/PortfolioSection";
import ContactSection from "@/components/home/ContactSection";

export default function HomeSnap() {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const [activeId, setActiveId] = useState<string>("hero");
  const [hideHint, setHideHint] = useState<boolean>(false);

  // 1 pantalla visible debajo del header (sin overlay)
  const panelStyle = useMemo(
    () => ({ height: "calc(100dvh - var(--header-h))" as const }),
    [],
  );

  /**
   * Fix doble scrollbar:
   * - Queremos que SOLO el contenedor snap scrollee.
   * - Si html/body puede scrollear aunque sea 1px, aparece un segundo scrollbar.
   */
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

  function scrollToSection(id: string) {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const el = scroller.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (!el) return;

    el.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });

    // Actualiza el hash sin disparar “jump” de navegador (más controlado)
    try {
      window.history.replaceState(null, "", `#${id}`);
    } catch {
      // Fallback (poco probable)
      window.location.hash = id;
    }
  }

  // Hint: se oculta al comenzar a scrollear dentro del contenedor snap
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onScroll = () => setHideHint(scroller.scrollTop > 24);

    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  // Active section: IntersectionObserver dentro del contenedor snap
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const els = SECTIONS.map((s) =>
      scroller.querySelector<HTMLElement>(`#${CSS.escape(s.id)}`),
    ).filter(Boolean) as HTMLElement[];

    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0),
          );

        if (visible[0]?.target?.id) setActiveId(visible[0].target.id);
      },
      { root: scroller, threshold: [0.55, 0.65, 0.75] },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Hash navigation: si entras con /#services, nos movemos al panel correcto
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const goHash = () => {
      const raw = window.location.hash || "";
      const id = raw.startsWith("#") ? raw.slice(1) : raw;
      if (!id) return;

      const el = scroller.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
      if (!el) return;

      el.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    };

    goHash();
    window.addEventListener("hashchange", goHash);
    return () => window.removeEventListener("hashchange", goHash);
  }, [prefersReducedMotion]);

  return (
    <main className="relative">
      {/* NAV lateral (dots + texto) */}
      <HomeDotsNav
        sections={SECTIONS}
        activeId={activeId}
        onNavigate={scrollToSection}
      />

      {/* Contenedor Snap (único scroll del homepage) */}
      <div
        ref={scrollerRef}
        className={[
          "overflow-y-auto",
          // Mobile: más suave; Desktop: más “diapositiva”
          "snap-y snap-proximity md:snap-mandatory",
          "overscroll-y-contain",
        ].join(" ")}
        style={panelStyle}
      >
        <HeroSection
          panelStyle={panelStyle}
          hideHint={hideHint}
          onHintClick={() => scrollToSection("services")}
        />

        <ServicesSection panelStyle={panelStyle} />
        <CatalogSection panelStyle={panelStyle} />
        <PortfolioSection panelStyle={panelStyle} />
        <ContactSection panelStyle={panelStyle} />
      </div>
    </main>
  );
}
