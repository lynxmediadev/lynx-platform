import * as React from "react";
import { updatePublishingShares } from "@/app/admin/track/actions/update-publishing-shares";
import type { Share } from "./types";
import { applyRoleSortOrders, clamp, sortByOrder } from "./utils";

type Role = "WRITER" | "PUBLISHER";

type UsePublishingSharesArgs = {
  trackId: string;
  initialShares: Share[];
};

type SaveFeedback = { status: "saving" | "ok" | "error"; code?: string } | null;

export function usePublishingShares({
  trackId,
  initialShares,
}: UsePublishingSharesArgs) {
  const [shares, setShares] = React.useState<Share[]>(
    (initialShares ?? []).slice().sort(sortByOrder),
  );
  const [shareError, setShareError] = React.useState<string | null>(null);
  const [shareRoleErrors, setShareRoleErrors] = React.useState<{
    WRITER?: string;
    PUBLISHER?: string;
  }>({});
  const [savingWriter, setSavingWriter] = React.useState(false);
  const [savingPublisher, setSavingPublisher] = React.useState(false);
  const [reorderSharePending, setReorderSharePending] = React.useState(false);
  const [saveFeedback, setSaveFeedback] = React.useState<SaveFeedback>(null);
  const saveFeedbackTimerRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const [newWriter, setNewWriter] = React.useState<
    Share & { ipiNumber: string; pro: string; caeNumber: string }
  >({
    role: "WRITER",
    name: "",
    sharePct: 50,
    ipiNumber: "",
    pro: "",
    caeNumber: "",
  });
  const [newPublisher, setNewPublisher] = React.useState<
    Share & { ipiNumber: string; pro: string; caeNumber: string }
  >({
    role: "PUBLISHER",
    name: "",
    sharePct: 50,
    ipiNumber: "",
    pro: "",
    caeNumber: "",
  });

  const sumByRole = React.useCallback(
    (role: Role, list = shares) =>
      list
        .filter((s) => s.role === role && typeof s.sharePct === "number")
        .reduce((acc, s) => acc + (s.sharePct ?? 0), 0),
    [shares],
  );

  const validateShares = (list: Share[]) => {
    const totalW = sumByRole("WRITER", list);
    const totalP = sumByRole("PUBLISHER", list);
    const roleErrors: { WRITER?: string; PUBLISHER?: string } = {};

    if (totalW > 100)
      roleErrors.WRITER = "WRITER supera 100%. Ajusta porcentajes.";
    if (totalP > 100)
      roleErrors.PUBLISHER = "PUBLISHER supera 100%. Ajusta porcentajes.";

    setShareRoleErrors(roleErrors);
    setShareError(roleErrors.WRITER ?? roleErrors.PUBLISHER ?? null);
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

  const persistShares = async (ordered: Share[]) => {
    setReorderSharePending(true);
    showSaveFeedback({ status: "saving" });
    try {
      const result = await updatePublishingShares({
        trackId,
        oneStop: false,
        shares: ordered.map((s) => ({
          ...s,
          sharePct:
            s.sharePct === null || Number.isNaN(Number(s.sharePct))
              ? null
              : Number(s.sharePct),
        })),
      });
      if (!result.ok) {
        const msg = "message" in result ? result.message : null;
        setShareError(msg ?? "Error al guardar publishing shares.");
        const code = result.fieldErrors?.publishingShares?.length
          ? "PUB_ONESTOP_100"
          : msg?.toLowerCase().includes("validación")
            ? "PUB_VALIDATION"
            : "PUB_SAVE_FAILED";
        showSaveFeedback({ status: "error", code }, 5000);
        return false;
      }
      setShareError(null);
      showSaveFeedback({ status: "ok" }, 1000);
      return true;
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Error inesperado al guardar publishing.";
      setShareError(msg);
      const code = msg.includes("Failed to find Server Action")
        ? "PUB_ACTION_STALE"
        : "PUB_SAVE_FAILED";
      showSaveFeedback({ status: "error", code }, 5000);
      return false;
    } finally {
      setReorderSharePending(false);
    }
  };

  const saveShares = (list: Share[]) => {
    const ordered = applyRoleSortOrders(list);
    setShares(ordered);
    validateShares(ordered);
    return persistShares(ordered);
  };

  const commitShareField = async (
    idx: number,
    field: keyof Share,
    value: string,
  ) => {
    const next = shares.map((s, i) =>
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
    const ordered = applyRoleSortOrders(next);
    setShares(ordered);
    validateShares(ordered);
    await persistShares(ordered);
  };

  const moveShare = (globalIdx: number, delta: number) => {
    const role = shares[globalIdx]?.role;
    if (!role) return;
    const indices = shares
      .map((s, i) => (s.role === role ? i : -1))
      .filter((i) => i >= 0);
    const pos = indices.indexOf(globalIdx);
    if (pos === -1) return;
    const targetPos = clamp(pos + delta, 0, indices.length - 1);
    if (targetPos === pos) return;
    const next = [...shares];
    const from = indices[pos];
    const to = indices[targetPos];
    if (from === undefined || to === undefined) return;
    const fromItem = next[from];
    const toItem = next[to];
    if (!fromItem || !toItem) return;
    [next[from], next[to]] = [toItem, fromItem];
    void saveShares(next);
  };

  const moveShareTo = (globalIdx: number, targetPos: number) => {
    const role = shares[globalIdx]?.role;
    if (!role) return;
    const indices = shares
      .map((s, i) => (s.role === role ? i : -1))
      .filter((i) => i >= 0);
    const pos = indices.indexOf(globalIdx);
    if (pos === -1) return;
    const clamped = clamp(targetPos, 0, indices.length - 1);
    if (clamped === pos) return;
    const next = [...shares];
    const roleList = indices.map((i) => next[i]);
    const [moved] = roleList.splice(pos, 1);
    if (!moved) return;
    roleList.splice(clamped, 0, moved);
    indices.forEach((idx, i) => {
      const item = roleList[i];
      if (idx !== undefined && item) {
        next[idx] = item;
      }
    });
    void saveShares(next);
  };

  const moveShareTop = (globalIdx: number) => moveShareTo(globalIdx, 0);
  const moveShareBottom = (globalIdx: number) => {
    const role = shares[globalIdx]?.role;
    if (!role) return;
    const count = shares.filter((s) => s.role === role).length;
    moveShareTo(globalIdx, count - 1);
  };

  const addShare = (role: Role) => {
    const formState = role === "WRITER" ? newWriter : newPublisher;
    if (!formState.name.trim()) {
      setShareError("Ingresa un nombre para el share.");
      return;
    }
    const next: Share[] = [
      ...shares,
      {
        role,
        name: formState.name.trim(),
        sharePct:
          formState.sharePct === null ||
          Number.isNaN(Number(formState.sharePct))
            ? null
            : Number(formState.sharePct),
        ipiNumber: formState.ipiNumber.trim() || "",
        pro: formState.pro.trim() || "",
        caeNumber: formState.caeNumber.trim() || "",
      },
    ];
    const ordered = applyRoleSortOrders(next);
    const totalW = sumByRole("WRITER", ordered);
    const totalP = sumByRole("PUBLISHER", ordered);
    if (role === "WRITER" && totalW > 100) {
      setShareRoleErrors((prev) => ({
        ...prev,
        WRITER: "WRITER supera 100%. Ajusta porcentajes.",
      }));
      setShareError("WRITER supera 100%. Ajusta porcentajes.");
      return;
    }
    if (role === "PUBLISHER" && totalP > 100) {
      setShareRoleErrors((prev) => ({
        ...prev,
        PUBLISHER: "PUBLISHER supera 100%. Ajusta porcentajes.",
      }));
      setShareError("PUBLISHER supera 100%. Ajusta porcentajes.");
      return;
    }
    setShareRoleErrors({});
    setShareError(null);
    const savingSetter =
      role === "WRITER" ? setSavingWriter : setSavingPublisher;
    const resetSetter = role === "WRITER" ? setNewWriter : setNewPublisher;
    savingSetter(true);
    void persistShares(ordered).finally(() => savingSetter(false));
    setShares(ordered);
    resetSetter((prev) => ({
      ...prev,
      name: "",
      ipiNumber: "",
      pro: "",
      caeNumber: "",
    }));
  };

  const deleteShare = async (idx: number) => {
    const next = shares.filter((_, i) => i !== idx);
    const ordered = applyRoleSortOrders(next);
    const ok = await persistShares(ordered);
    if (ok) {
      setShares(ordered);
      validateShares(ordered);
    }
  };

  return {
    shares,
    shareError,
    shareRoleErrors,
    newWriter,
    newPublisher,
    setNewWriter,
    setNewPublisher,
    savingWriter,
    savingPublisher,
    reorderSharePending,
    saveFeedback,
    moveShare,
    moveShareTo,
    moveShareTop,
    moveShareBottom,
    addShare,
    deleteShare,
    commitShareField,
    handleShareChange: (idx: number, field: keyof Share, value: string) => {
      const next = shares.map((s, i) =>
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
      setShares(applyRoleSortOrders(next));
      validateShares(next);
    },
    validateShares,
    sumByRole,
  };
}
