import * as React from "react";
import { ArrowDown, ArrowUp, Eye, SquareX } from "lucide-react";
import { Label } from "@/components/ui/label";
import EditableIconInput from "@/components/admin/ui/EditableIconInput";
import NumericSelectInput from "@/components/admin/ui/NumericSelectInput";
import type { Share } from "./types";

type Role = "WRITER" | "PUBLISHER";
const PRO_OPTIONS = ["ASCAP", "BMI", "SCD"] as const;
const normalizeProValue = (value?: string | null) =>
  PRO_OPTIONS.includes(
    (value ?? "").toUpperCase() as (typeof PRO_OPTIONS)[number],
  )
    ? (value ?? "").toUpperCase()
    : "";

type Props = {
  role: Role;
  roleShares: Share[];
  shareBusy: boolean;
  pendingShares: boolean;
  onLongPressStart: (
    type: "share",
    index: number,
    direction: "up" | "down",
    e: React.PointerEvent,
  ) => void;
  onLongPressCancel: () => void;
  moveShare: (idx: number, delta: number) => void;
  moveShareTo: (idx: number, target: number) => void;
  onChange: (idx: number, field: keyof Share, value: string) => void;
  onCommitChange: (
    idx: number,
    field: "name" | "sharePct" | "pro" | "ipiNumber" | "caeNumber",
    value: string,
  ) => void | Promise<void>;
  onDelete: (idx: number) => void;
};

export function PublishingCards({
  role,
  roleShares,
  shareBusy,
  pendingShares,
  onLongPressStart,
  onLongPressCancel,
  moveShare,
  moveShareTo,
  onChange,
  onCommitChange,
  onDelete,
}: Props) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [posValues, setPosValues] = React.useState<Record<string, string>>({});
  const positionSignature = React.useMemo(
    () =>
      roleShares
        .map((s, i) => `${s.id ?? `${role}-${i}`}-${s.sortOrder ?? i}`)
        .join("|"),
    [role, roleShares],
  );

  React.useEffect(() => {
    setPosValues({});
  }, [positionSignature]);

  if (roleShares.length === 0) {
    return (
      <div className="border-border/70 bg-card/60 text-muted-foreground rounded-lg border p-3 text-xs">
        Sin {role === "WRITER" ? "writers" : "publishers"}.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {roleShares.map((share, idx) => {
        const rowId = `${share.id ?? `${role}-${idx}`}-${share.sortOrder ?? idx}`;
        const isOpen = expanded[rowId];
        const pctLabel =
          typeof share.sharePct === "number" ? `${share.sharePct}%` : "—%";
        return (
          <div
            key={rowId}
            className="border-border/60 bg-card/40 rounded-md border"
          >
            <button
              type="button"
              onClick={() =>
                setExpanded((prev) => ({
                  ...prev,
                  [rowId]: !isOpen,
                }))
              }
              className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 p-2 text-left"
              aria-expanded={isOpen}
              aria-label="Ver detalles del titular"
            >
              <span className="text-sm leading-tight font-semibold break-words whitespace-normal">
                {share.name || "Sin nombre"}
              </span>
              <span className="border-border text-foreground rounded-md border px-2 py-1 text-[11px] font-medium">
                {pctLabel}
              </span>
              <span className="border-border/70 text-muted-foreground inline-flex h-8 w-8 items-center justify-center rounded-md border">
                <Eye className="h-4 w-4" />
              </span>
            </button>

            {isOpen && (
              <div className="border-border/60 space-y-3 border-t p-3">
                <div className="grid grid-cols-[1fr_auto] items-end gap-2">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-[11px]">
                      Posición
                    </Label>
                    <NumericSelectInput
                      key={`pos-${rowId}`}
                      min={1}
                      max={roleShares.length}
                      value={posValues[rowId] ?? String(idx + 1)}
                      onChange={(value) =>
                        setPosValues((prev) => ({
                          ...prev,
                          [rowId]: value,
                        }))
                      }
                      disabled={shareBusy}
                      onBlur={(e) => {
                        const val = Number(e.target.value);
                        if (
                          !Number.isInteger(val) ||
                          val < 1 ||
                          val > roleShares.length
                        ) {
                          e.target.classList.add("border-destructive");
                          return;
                        }
                        e.target.classList.remove("border-destructive");
                        moveShareTo(idx, val - 1);
                        setPosValues({});
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        const val = Number(
                          (e.target as HTMLInputElement).value,
                        );
                        if (
                          !Number.isInteger(val) ||
                          val < 1 ||
                          val > roleShares.length
                        ) {
                          (e.target as HTMLInputElement).classList.add(
                            "border-destructive",
                          );
                          return;
                        }
                        (e.target as HTMLInputElement).classList.remove(
                          "border-destructive",
                        );
                        moveShareTo(idx, val - 1);
                        setPosValues({});
                      }}
                      className="h-8 w-20 text-center text-[11px]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onPointerDown={(e) =>
                        onLongPressStart("share", idx, "up", e)
                      }
                      onPointerUp={onLongPressCancel}
                      onPointerCancel={onLongPressCancel}
                      onClick={(e) => moveShare(idx, e.shiftKey ? -3 : -1)}
                      className="border-border bg-card inline-flex h-8 w-10 items-center justify-center rounded-md border"
                      disabled={shareBusy}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onPointerDown={(e) =>
                        onLongPressStart("share", idx, "down", e)
                      }
                      onPointerUp={onLongPressCancel}
                      onPointerCancel={onLongPressCancel}
                      onClick={(e) => moveShare(idx, e.shiftKey ? 3 : 1)}
                      className="border-border bg-card inline-flex h-8 w-10 items-center justify-center rounded-md border"
                      disabled={shareBusy}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-[11px]">
                      Nombre
                    </Label>
                    <EditableIconInput
                      value={share.name}
                      onChange={(value) => onChange(idx, "name", value)}
                      onCommit={(value) => onCommitChange(idx, "name", value)}
                      disabled={shareBusy}
                      placeholder="-"
                      iconAriaLabel="Editar nombre"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-[11px]">
                      %{" "}
                    </Label>
                    <NumericSelectInput
                      min={0}
                      max={100}
                      value={share.sharePct ?? ""}
                      onChange={(value) => onChange(idx, "sharePct", value)}
                      onCommit={(value) =>
                        onCommitChange(idx, "sharePct", value)
                      }
                      disabled={shareBusy}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-[11px]">
                      PRO
                    </Label>
                    <select
                      value={normalizeProValue(share.pro)}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        onChange(idx, "pro", nextValue);
                        void onCommitChange(idx, "pro", nextValue);
                      }}
                      disabled={shareBusy}
                      className="border-border bg-background h-8 w-full rounded-md border px-2 text-xs"
                    >
                      <option value="">—</option>
                      {PRO_OPTIONS.map((pro) => (
                        <option key={pro} value={pro}>
                          {pro}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-[11px]">
                        IPI
                      </Label>
                      <EditableIconInput
                        value={share.ipiNumber ?? ""}
                        onChange={(value) => onChange(idx, "ipiNumber", value)}
                        onCommit={(value) =>
                          onCommitChange(idx, "ipiNumber", value)
                        }
                        disabled={shareBusy}
                        placeholder="-"
                        iconAriaLabel="Editar IPI"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-[11px]">
                        CAE
                      </Label>
                      <EditableIconInput
                        value={share.caeNumber ?? ""}
                        onChange={(value) => onChange(idx, "caeNumber", value)}
                        onCommit={(value) =>
                          onCommitChange(idx, "caeNumber", value)
                        }
                        disabled={shareBusy}
                        placeholder="-"
                        iconAriaLabel="Editar CAE"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => onDelete(idx)}
                    className="border-destructive/60 bg-card text-destructive hover:border-destructive inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border"
                    aria-label="Eliminar share"
                    disabled={pendingShares || shareBusy}
                  >
                    <span className="text-xs font-medium">Eliminar</span>
                    <SquareX className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
