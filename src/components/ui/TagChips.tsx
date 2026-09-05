"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Plus, Sparkles } from "lucide-react";

/**
 * Contrato común para cualquier dominio de chips (moods, usos, categorías, etc.).
 * - TagChip: unidad mínima. `value` sirve como clave de unicidad; si falta, se usa `label`.
 * - fetchAll: obtiene catálogo completo (opcional). Si no se pasa, el panel puede quedar vacío.
 * - fetchSuggestions: búsqueda remota opcional; se combina con filtrado local por query.
 * - normalize: transforma texto libre en TagChip (ej. mayúsculas). Devuelve null si se debe ignorar.
 * - onCreate: crea un nuevo ítem si `allowCreate` está habilitado. Debe devolver el chip creado o null.
 * - maxItems: límite de selección; el componente bloquea añadir cuando se alcanza.
 */
export type TagChip = {
  id?: string;
  label: string;
  value?: string;
  meta?: unknown;
};

export type TagChipsProps = {
  selected: TagChip[];
  onChange: (chips: TagChip[]) => void;
  placeholder?: string;
  maxItems?: number;
  toggleLabel?: string;
  defaultOpen?: boolean;
  showToggleButton?: boolean;
  headingAssigned?: string;
  headingSuggestions?: string;
  fetchSuggestions?: (query: string) => Promise<TagChip[]>;
  fetchAll?: () => Promise<TagChip[]>;
  normalize?: (raw: string) => TagChip | null;
  allowCreate?: boolean;
  onCreate?: (label: string) => Promise<TagChip | null> | TagChip | null;
  allowDeleteCatalog?: boolean;
  onDeleteCatalog?: (chip: TagChip) => Promise<boolean | void> | boolean | void;
  deleteConfirmText?: string;
  /** Catálogo precargado (SSR) para evitar fetch inicial de sugeridos */
  initialCatalogItems?: TagChip[];
  /** Permite sobreescribir el toggle button de sugeridos (para colocar botón Guardar arriba si se desea) */
  renderAboveAssigned?: React.ReactNode;
  renderAboveToggle?: React.ReactNode;
};

const defaultNormalize = (raw: string): TagChip | null => {
  const clean = raw.trim();
  if (!clean) return null;
  return { label: clean, value: clean.toUpperCase() };
};

export function TagChips({
  selected,
  onChange,
  placeholder = "Buscar mood",
  maxItems = 20,
  toggleLabel = "Moods",
  defaultOpen = false,
  showToggleButton = true,
  headingAssigned = "Asignados",
  headingSuggestions = "Sugerencias",
  fetchSuggestions,
  fetchAll,
  normalize = defaultNormalize,
  allowCreate = true,
  onCreate,
  allowDeleteCatalog = false,
  onDeleteCatalog,
  deleteConfirmText,
  initialCatalogItems = [],
  renderAboveAssigned,
  renderAboveToggle,
}: TagChipsProps) {
  const [query, setQuery] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<TagChip[]>([]);
  const [allItems, setAllItems] =
    React.useState<TagChip[]>(initialCatalogItems);
  const [panelOpen, setPanelOpen] = React.useState(defaultOpen);
  const [loading, setLoading] = React.useState(false);
  const [hovered, setHovered] = React.useState<string | null>(null);
  const [confirmChip, setConfirmChip] = React.useState<TagChip | null>(null);
  const canAddMore = selected.length < maxItems;
  const selectedKeys = React.useMemo(
    () => new Set(selected.map((c) => (c.value ?? c.label).toLowerCase())),
    [selected],
  );

  // Items visibles en el catálogo (se filtran con el input)
  const availableItems = allItems.length > 0 ? allItems : suggestions;
  const filteredCatalog = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return (availableItems ?? [])
      .filter(
        (item) => !selectedKeys.has((item.value ?? item.label).toLowerCase()),
      )
      .filter((item) =>
        q ? (item.label ?? "").toLowerCase().includes(q) : true,
      );
  }, [availableItems, query, selectedKeys]);

  // debounce suggestions
  React.useEffect(() => {
    if (!fetchSuggestions) return;
    const controller = new AbortController();
    const handle = setTimeout(() => {
      void (async () => {
        const q = query.trim();
        if (!q) {
          setSuggestions([]);
          return;
        }
        try {
          setLoading(true);
          const res = await fetchSuggestions(q);
          if (!controller.signal.aborted) setSuggestions(res ?? []);
        } catch {
          if (!controller.signal.aborted) setSuggestions([]);
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      })();
    }, 200);
    return () => {
      controller.abort();
      clearTimeout(handle);
    };
  }, [fetchSuggestions, query]);

  // Actualiza catálogo inicial si cambia la prop (SSR → client)
  React.useEffect(() => {
    if (initialCatalogItems && initialCatalogItems.length > 0) {
      setAllItems(initialCatalogItems);
    }
  }, [initialCatalogItems]);

  // Si el panel está abierto y no hay catálogo cargado, precarga sugerencias.
  React.useEffect(() => {
    if (!panelOpen || !fetchAll || allItems.length > 0) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await fetchAll();
        if (!cancelled) setAllItems(res ?? []);
      } catch {
        if (!cancelled) setAllItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [panelOpen, fetchAll, allItems.length]);

  const upsertCatalogItem = React.useCallback((chip: TagChip) => {
    const key = (chip.value ?? chip.label).toLowerCase();
    setAllItems((prev) => {
      if (prev.some((c) => (c.value ?? c.label).toLowerCase() === key))
        return prev;
      return [...prev, chip];
    });
    setSuggestions((prev) => {
      if (prev.some((c) => (c.value ?? c.label).toLowerCase() === key))
        return prev;
      return [...prev, chip];
    });
  }, []);

  const addChip = (raw: string | TagChip) => {
    if (!canAddMore) return;
    const chip = typeof raw === "string" ? normalize(raw) : raw;
    if (!chip) return;
    const valueKey = (chip.value ?? chip.label).toLowerCase();
    const exists = selected.some(
      (c) => (c.value ?? c.label).toLowerCase() === valueKey,
    );
    if (exists) return;
    onChange([...selected, chip]);
    upsertCatalogItem(chip);
    setQuery("");
  };

  const removeChip = (chip: TagChip) => {
    const valueKey = (chip.value ?? chip.label).toLowerCase();
    onChange(
      selected.filter((c) => (c.value ?? c.label).toLowerCase() !== valueKey),
    );
  };

  const handleEnter: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && query.trim()) {
      e.preventDefault();
      addChip(query);
    }
  };

  const handleCreate = async () => {
    if (!allowCreate || !onCreate) return;
    const chip = await onCreate(query.trim());
    if (chip) addChip(chip);
  };

  const togglePanel = async () => {
    const next = !panelOpen;
    setPanelOpen(next);
    if (next && allItems.length === 0 && fetchAll) {
      setLoading(true);
      try {
        const res = await fetchAll();
        setAllItems(res ?? []);
      } catch {
        setAllItems([]);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex h-full flex-col space-y-3">
      {!canAddMore && (
        <p className="text-destructive text-xs">Máximo {maxItems} elementos.</p>
      )}

      <div className="border-border/70 bg-card/60 space-y-2 rounded-md border p-3">
        {renderAboveAssigned}
        <div className="flex items-center justify-between gap-2">
          <Label className="text-muted-foreground text-[11px] font-semibold">
            {headingAssigned}
          </Label>
        </div>
        <div className="flex flex-wrap gap-2">
          {selected.length === 0 && (
            <span className="text-muted-foreground text-xs">Vacío.</span>
          )}
          {selected.map((chip) => {
            const keyVal = (chip.value ?? chip.label).toLowerCase();
            const isHover = hovered === keyVal;
            const setHover = (on: boolean) => setHovered(on ? keyVal : null);

            return (
              <span
                key={keyVal}
                className={`group/chip inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-sm transition-colors ${
                  isHover
                    ? "text-destructive border-destructive bg-destructive/20"
                    : "text-foreground border-border bg-muted/40 dark:bg-muted/30"
                }`}
              >
                <button
                  type="button"
                  onMouseEnter={() => setHover(true)}
                  onMouseLeave={() => setHover(false)}
                  onClick={() => removeChip(chip)}
                  className="text-inherit transition-colors"
                  aria-label={`Quitar ${chip.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
                {chip.label}
              </span>
            );
          })}
        </div>
      </div>

      {fetchAll && showToggleButton && (
        <div className="flex gap-2">
          {renderAboveToggle}
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => void togglePanel()}
            className="text-foreground hover:bg-foreground/10 dark:hover:bg-foreground/15 h-7 w-full items-center justify-center border border-current bg-transparent px-3 transition-colors"
          >
            <Plus className="mr-[-5px] h-2.5 w-3.5" /> {toggleLabel}
          </Button>
        </div>
      )}
      {fetchAll && !showToggleButton && renderAboveToggle && (
        <div className="flex gap-2">{renderAboveToggle}</div>
      )}

      {panelOpen && (
        <div className="border-border/70 bg-card/70 w-full space-y-3 overflow-hidden rounded-md border p-3 md:flex md:min-h-0 md:flex-1 md:flex-col">
          <p className="text-muted-foreground text-[11px] font-semibold">
            {headingSuggestions}
          </p>
          <div className="flex w-full items-start gap-2">
            <div className="relative min-w-0 flex-1">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleEnter}
                placeholder={placeholder}
                className="h-9 pr-8 text-sm"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-2 flex items-center transition-colors"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => addChip(query)}
              disabled={!query.trim() || !canAddMore}
              className="h-9 px-3"
            >
              <Plus className="mr-1 h-4 w-4" /> Añadir
            </Button>
          </div>

          {allowCreate &&
            onCreate &&
            query.trim().length > 0 &&
            filteredCatalog.length === 0 && (
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => void handleCreate()}
                  disabled={!canAddMore}
                >
                  <Sparkles className="mr-1 h-4 w-4" /> Crear y añadir
                </Button>
                {loading && <span>Buscando…</span>}
              </div>
            )}

          {fetchAll && (
            <div className="border-border/60 max-h-[40vh] overflow-auto border-t pt-2 md:max-h-none md:min-h-0 md:flex-1">
              <div className="flex max-w-full flex-wrap gap-2">
                {filteredCatalog.length === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    Sin items para mostrar.
                  </p>
                ) : (
                  filteredCatalog.map((item) => {
                    const key = (item.value ?? item.label).toLowerCase();
                    return (
                      <div
                        key={key}
                        className="group border-border/70 bg-card/60 text-foreground hover:bg-foreground/10 dark:hover:bg-foreground/20 relative inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-sm transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => addChip(item)}
                          className="text-inherit"
                          title="Añadir"
                        >
                          {item.label}
                        </button>
                        {allowDeleteCatalog && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmChip(item);
                            }}
                            className="hover:text-destructive text-inherit opacity-70 transition-colors hover:opacity-100"
                            title="Eliminar del catálogo"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {allowDeleteCatalog && confirmChip && (
        <Dialog
          open={!!confirmChip}
          onOpenChange={(open) => !open && setConfirmChip(null)}
        >
          <DialogContent className="bg-card border-border text-foreground border">
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                {deleteConfirmText ??
                  `Eliminar “${confirmChip.label}” del catálogo.`}
              </DialogDescription>
            </DialogHeader>
            <div className="border-border/60 bg-background rounded-md border px-3 py-2 text-sm">
              <div className="font-semibold">{confirmChip.label}</div>
              {(confirmChip.value ?? confirmChip.label) !==
              confirmChip.label ? (
                <div className="text-muted-foreground text-xs">
                  Valor: {confirmChip.value}
                </div>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setConfirmChip(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="h-8"
                onClick={async () => {
                  const proceed = onDeleteCatalog
                    ? await onDeleteCatalog(confirmChip)
                    : true;
                  if (proceed === false) return;
                  const key = (
                    confirmChip.value ?? confirmChip.label
                  ).toLowerCase();
                  setAllItems((prev) =>
                    prev.filter(
                      (c) => (c.value ?? c.label).toLowerCase() !== key,
                    ),
                  );
                  setSuggestions((prev) =>
                    prev.filter(
                      (c) => (c.value ?? c.label).toLowerCase() !== key,
                    ),
                  );
                  setConfirmChip(null);
                }}
              >
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
