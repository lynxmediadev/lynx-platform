"use client";

/**
 * src/components/site/FrontendShell.tsx
 * =========================================================
 * PERAS Y MANZANAS (qué hace este archivo)
 * - Es el “cascarón” público del sitio.
 * - Decide si muestra el header (lo oculta en áreas dashboard: /admin y /creator).
 * - Mantiene estructura simple: header arriba + main abajo.
 * - NO implementa Snap; Snap vive solo en el homepage (page.tsx).
 * =========================================================
 */

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import GlobalPlayerHost from "@/components/player/GlobalPlayerHost";
import {
  GlobalPlayerProvider,
  useGlobalPlayerState,
} from "@/components/player/global-player-context";
import SiteHeader from "@/components/site/SiteHeader";

interface FrontendShellProps {
  children: ReactNode;
}

export default function FrontendShell({ children }: FrontendShellProps) {
  const pathname = usePathname();

  const isDashboardRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/creator");
  const hideHeader = isDashboardRoute;

  if (isDashboardRoute) {
    return (
      <div className="min-h-dvh">
        <main>{children}</main>
      </div>
    );
  }

  return (
    <GlobalPlayerProvider>
      <PublicShellContent hideHeader={hideHeader}>
        {children}
      </PublicShellContent>
    </GlobalPlayerProvider>
  );
}

function PublicShellContent({
  children,
  hideHeader,
}: {
  children: ReactNode;
  hideHeader: boolean;
}) {
  const { currentTrack } = useGlobalPlayerState();

  return (
    <div className="min-h-dvh">
      {!hideHeader && <SiteHeader />}
      <main
        className={`px-4 sm:px-6 ${currentTrack ? "pb-[116px] sm:pb-[124px]" : ""}`}
      >
        {children}
      </main>
      <GlobalPlayerHost />
    </div>
  );
}
