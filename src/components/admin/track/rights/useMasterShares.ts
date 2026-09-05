import * as React from "react";
import { updateMasterShares } from "@/app/admin/track/actions/update-master-shares";
import type { MasterShare } from "./types";
import { applyMasterOrders, clamp, sortByOrder } from "./utils";

type UseMasterSharesArgs = {
  trackId: string;
  initialMasterShares: MasterShare[];
};

type SaveFeedback = { status: "saving" | "ok" | "error"; code?: string } | null;

export function useMasterShares({
  trackId,
  initialMasterShares,
}: UseMasterSharesArgs) {
  const [masterShares, setMasterShares] = React.useState<MasterShare[]>(
    (initialMasterShares ?? []).slice().sort(sortByOrder),
  );
  const [masterError, setMasterError] = React.useState<string | null>(null);
  const [savingMaster, setSavingMaster] = React.useState(false);
  const [reorderMasterPending, setReorderMasterPending] = React.useState(false);
  const [saveFeedback, setSaveFeedback] = React.useState<SaveFeedback>(null);
  const saveFeedbackTimerRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [newMaster, setNewMaster] = React.useState<{
    name: string;
    sharePct: number | null;
    contact: string;
    notes: string;
  }>({
    name: "",
    sharePct: 100,
    contact: "",
    notes: "",
  });

  const sumMaster = (list = masterShares) =>
    list
      .filter((s) => typeof s.sharePct === "number")
      .reduce((acc, s) => acc + (s.sharePct ?? 0), 0);

  const validateMasterTotal = (list: MasterShare[]) => {
    const total = list
      .filter((s) => typeof s.sharePct === "number")
      .reduce((acc, s) => acc + (s.sharePct ?? 0), 0);
    if (total > 100) {
      setMasterError(
        "AJUSTAR PORCENTAJES (%). MASTER NO PUEDE SUPERAR EL 100%",
      );
      return false;
    }
    setMasterError(null);
    return true;
  };

  React.useEffect(
    () => () => {
      if (saveFeedbackTimerRef.current)
        clearTimeout(saveFeedbackTimerRef.current);
    },
    [],
  );

  const showSaveFeedback = (next: SaveFeedback, durationMs?: number) => {
    if (saveFeedbackTimerRef.current)
      clearTimeout(saveFeedbackTimerRef.current);
    setSaveFeedback(next);
    if (durationMs && durationMs > 0) {
      saveFeedbackTimerRef.current = setTimeout(() => {
        setSaveFeedback(null);
        saveFeedbackTimerRef.current = null;
      }, durationMs);
    }
  };

  const persistMaster = async (ordered: MasterShare[]) => {
    setReorderMasterPending(true);
    showSaveFeedback({ status: "saving" });
    try {
      const result = await updateMasterShares({
        trackId,
        shares: ordered.map((s) => ({
          name: s.name,
          sharePct:
            s.sharePct === null || Number.isNaN(Number(s.sharePct))
              ? null
              : Number(s.sharePct),
          contact: s.contact ?? null,
          notes: s.notes ?? null,
          sortOrder: s.sortOrder ?? null,
        })),
      });
      if (!result.ok) {
        const msg = "message" in result ? result.message : null;
        setMasterError(msg ?? "Error al guardar titular de master.");
        const code = msg?.toLowerCase().includes("validación")
          ? "MASTER_VALIDATION"
          : "MASTER_SAVE_FAILED";
        showSaveFeedback({ status: "error", code }, 5000);
        return false;
      }
      setMasterError(null);
      showSaveFeedback({ status: "ok" }, 1000);
      return true;
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Error inesperado al guardar master.";
      setMasterError(msg);
      const code = msg.includes("Failed to find Server Action")
        ? "MASTER_ACTION_STALE"
        : "MASTER_SAVE_FAILED";
      showSaveFeedback({ status: "error", code }, 5000);
      return false;
    } finally {
      setReorderMasterPending(false);
    }
  };

  const saveMasterShares = (next: MasterShare[]) => {
    const ordered = applyMasterOrders(next);
    setMasterShares(ordered);
    return persistMaster(ordered);
  };

  const moveMaster = (idx: number, delta: number) => {
    const target = clamp(idx + delta, 0, masterShares.length - 1);
    if (target === idx) return;
    const next = [...masterShares];
    const current = next[idx];
    const targetItem = next[target];
    if (!current || !targetItem) return;
    [next[idx], next[target]] = [targetItem, current];
    void saveMasterShares(next);
  };

  const moveMasterTo = (idx: number, target: number) => {
    const clamped = clamp(target, 0, masterShares.length - 1);
    if (clamped === idx) return;
    const next = [...masterShares];
    const [item] = next.splice(idx, 1);
    if (!item) return;
    next.splice(clamped, 0, item);
    void saveMasterShares(next);
  };

  const moveMasterTop = (idx: number) => moveMasterTo(idx, 0);
  const moveMasterBottom = (idx: number) =>
    moveMasterTo(idx, masterShares.length - 1);

  const addMaster = () => {
    if (!newMaster.name.trim()) {
      setMasterError("Ingresa un nombre para el titular del master.");
      return;
    }
    const next: MasterShare[] = [
      ...masterShares,
      {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `tmp-${Date.now()}-${Math.random()}`,
        name: newMaster.name.trim(),
        sharePct:
          newMaster.sharePct === null || Number.isNaN(newMaster.sharePct)
            ? null
            : Number(newMaster.sharePct),
        contact: newMaster.contact.trim() || "",
        notes: newMaster.notes.trim() || "",
        sortOrder: masterShares.length,
      },
    ];
    const ordered = applyMasterOrders(next);
    if (!validateMasterTotal(ordered)) return;
    setSavingMaster(true);
    void persistMaster(ordered).finally(() => setSavingMaster(false));
    setMasterShares(ordered);
    setNewMaster({ name: "", sharePct: 100, contact: "", notes: "" });
  };

  const deleteMaster = async (idx: number) => {
    const next = masterShares.filter((_, i) => i !== idx);
    const ordered = applyMasterOrders(next);
    const ok = await persistMaster(ordered);
    if (ok) setMasterShares(ordered);
  };

  const handleMasterChange = (
    idx: number,
    field: keyof typeof newMaster,
    value: string,
  ) => {
    const next = masterShares.map((s, i) =>
      i === idx
        ? {
            ...s,
            [field]:
              field === "sharePct"
                ? value === ""
                  ? null
                  : Number(value)
                : value,
          }
        : s,
    );
    const ordered = applyMasterOrders(next);
    setMasterShares(ordered);
    validateMasterTotal(ordered);
  };

  const commitMasterField = async (
    idx: number,
    field: "name" | "sharePct" | "contact" | "notes",
    value: string,
  ) => {
    const next = masterShares.map((s, i) =>
      i === idx
        ? {
            ...s,
            [field]:
              field === "sharePct"
                ? value === ""
                  ? null
                  : Number(value)
                : value,
          }
        : s,
    );
    const ordered = applyMasterOrders(next);
    setMasterShares(ordered);
    validateMasterTotal(ordered);
    await persistMaster(ordered);
  };

  return {
    masterShares,
    masterError,
    newMaster,
    setNewMaster,
    savingMaster,
    reorderMasterPending,
    saveFeedback,
    moveMaster,
    moveMasterTo,
    moveMasterTop,
    moveMasterBottom,
    addMaster,
    deleteMaster,
    handleMasterChange,
    commitMasterField,
    validateMasterTotal,
    sumMaster,
  };
}
