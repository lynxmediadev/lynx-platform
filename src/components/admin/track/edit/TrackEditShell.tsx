import Link from "next/link";

import { cn } from "@/lib/utils";

export type TrackEditModuleNavItem = {
  id: string;
  label: string;
  href: string;
  disabled?: boolean;
};

export function TrackEditShell({
  title,
  artist,
  trackId: _trackId,
  headerActions,
  modules,
  activeModuleId,
  children,
}: {
  title: string | null;
  artist: string | null;
  trackId: string;
  headerActions?: React.ReactNode;
  modules: TrackEditModuleNavItem[];
  activeModuleId: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col gap-4">
      <header className="flex flex-col gap-3 border-b border-border pb-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Editar track</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {title ?? "(sin titulo)"} —{" "}
            <span className="text-muted-foreground">
              {artist ?? "(sin artista)"}
            </span>
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Gestión editorial y comercial del track.</p>
        </div>

        {headerActions ? (
          <div className="w-full md:w-auto">
            <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
              {headerActions}
            </div>
          </div>
        ) : null}
      </header>

      <nav
        aria-label="Navegacion de modulos de edicion"
        className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-2"
      >
        {modules.map((item) => {
          const active = item.id === activeModuleId;
          return item.disabled ? (
            <span
              key={item.id}
              aria-disabled="true"
              className={cn(
                "inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium",
                "w-full justify-center md:w-auto",
                "border-border bg-muted/30 text-muted-foreground opacity-70",
              )}
            >
              {item.label}
            </span>
          ) : (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium transition-colors",
                "w-full justify-center md:w-auto",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-foreground hover:bg-muted/40",
              )}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex min-h-0 flex-1 flex-col gap-4">{children}</div>
    </div>
  );
}
