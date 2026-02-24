import type { ReactNode } from "react";

interface CatalogLayoutProps {
  children: ReactNode;
}

/**
 * Layout mínimo para catálogo público.
 * Se deja sin sidebar ni app-bar para permitir un lienzo completo al page.
 */
export default function CatalogLayout({ children }: CatalogLayoutProps) {
  return (
    <div className="-mx-4 min-h-[calc(100dvh-var(--header-h))] bg-background text-foreground sm:-mx-6">
      {children}
    </div>
  );
}
