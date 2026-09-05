// src/components/admin/track/RightsFormClient.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Building2, Disc3, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Share, MasterShare } from "./rights/types";
import { usePublishingShares } from "./rights/usePublishingShares";
import { useMasterShares } from "./rights/useMasterShares";
import { PublishingTable } from "./rights/PublishingTable";
import { PublishingCards } from "./rights/PublishingCards";
import { PublishingNewForms } from "./rights/PublishingNewForms";
import { MasterTable } from "./rights/MasterTable";
import { MasterCards } from "./rights/MasterCards";
import { MasterNewForm } from "./rights/MasterNewForm";
import { RightsToggles } from "./rights/RightsToggles";

// Tipado de props
type RightsTrackFormProps = {
  trackId: string;
  track: {
    mfn: boolean;
    contentIdEnrolled: boolean;
    contentIdAdmin: string;
    contentIdWhitelist: string;
    master: string;
    oneStop: boolean;
    clearedForSync: boolean;
    publishingShares: Share[];
    masterShares: MasterShare[];
    restrictions?: string[] | null;
  };
  fieldErrors?: Record<string, string[]>;
};

export default function RightsFormClient({
  trackId,
  track,
  fieldErrors,
}: RightsTrackFormProps) {
  const serverErrors = fieldErrors ?? {};

  // Toggles
  const [mfnChecked, setMfnChecked] = React.useState(track.mfn);
  const [oneStopChecked, setOneStopChecked] = React.useState(track.oneStop);
  const [clearedChecked, setClearedChecked] = React.useState(
    track.clearedForSync,
  );
  const [contentIdChecked, setContentIdChecked] = React.useState(
    track.contentIdEnrolled,
  );

  // Long press (compartido)
  const longPressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [longPress, setLongPress] = React.useState<{
    type: "share" | "master";
    index: number;
    direction: "up" | "down";
  } | null>(null);
  const handleLongPress = (
    type: "share" | "master",
    index: number,
    direction: "up" | "down",
  ) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(
      () => setLongPress({ type, index, direction }),
      450,
    );
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
    setLongPress(null);
  };

  // Publishing hook
  const pub = usePublishingShares({
    trackId,
    initialShares: track.publishingShares,
  });

  // Master hook
  const mas = useMasterShares({
    trackId,
    initialMasterShares: track.masterShares,
  });

  // Confirm delete dialog
  const [deleteTarget, setDeleteTarget] = React.useState<
    | { type: "share"; globalIdx: number }
    | { type: "master"; idx: number }
    | null
  >(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const shareBusy =
    pub.reorderSharePending ||
    pub.savingWriter ||
    pub.savingPublisher ||
    deleteLoading;
  const masterBusy =
    mas.reorderMasterPending || mas.savingMaster || deleteLoading;

  // Map roleIdx -> globalIdx
  const roleIndexToGlobal =
    (role: "WRITER" | "PUBLISHER") => (roleIdx: number) => {
      let count = -1;
      for (let i = 0; i < pub.shares.length; i++) {
        const share = pub.shares[i];
        if (share?.role === role) {
          count += 1;
          if (count === roleIdx) return i;
        }
      }
      return -1;
    };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      if (deleteTarget.type === "share") {
        await pub.deleteShare(deleteTarget.globalIdx);
      } else {
        await mas.deleteMaster(deleteTarget.idx);
      }
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div
      className="space-y-4"
      onKeyDownCapture={(e) => {
        if (e.key !== "Enter") return;
        const target = e.target as HTMLElement;
        if (target instanceof HTMLTextAreaElement) return;
        if (target.getAttribute("data-allow-enter") === "true") return;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Inputs ocultos para Save All */}
      <input
        type="hidden"
        name="publishingShares"
        value={JSON.stringify(pub.shares)}
      />
      <input
        type="hidden"
        name="masterShares"
        value={JSON.stringify(mas.masterShares)}
      />

      <div className="border-border flex flex-col gap-2 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-foreground text-base font-semibold">
            Derechos &amp; explotación
          </h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Control de master, publishing y administración de Content ID.
          </p>
        </div>
      </div>

      {/* Publishing */}
      <div className="space-y-3 rounded-lg bg-transparent p-2">
        <h3 className="text-foreground text-sm font-semibold">
          Master &amp; publishing
        </h3>
        <p className="text-muted-foreground mb-2 text-[11px]">
          Los titulares de master se administran en la tabla inferior. Puedes
          ingresar múltiples dueños y porcentajes.
        </p>
        <div className="space-y-6">
          {(["WRITER", "PUBLISHER"] as const).map((role) => {
            const roleShares = pub.shares
              .filter((s) => s.role === role)
              .map((s) => s)
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
            const total = pub.sumByRole(role);
            const missing = total < 100;
            const roleMsg = pub.shareRoleErrors[role];
            const toGlobal = roleIndexToGlobal(role);
            const roleLabel = role === "WRITER" ? "WRITER" : "PUBLISHER";
            const roleHint =
              role === "WRITER"
                ? "Titulares de composición"
                : "Titulares de publishing";
            const RoleIcon = role === "WRITER" ? User : Building2;
            return (
              <div
                key={role}
                className="border-border/60 bg-card/25 space-y-3 rounded-lg border p-3"
              >
                <div className="border-border/50 flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <RoleIcon className="text-muted-foreground h-4 w-4" />
                    <span className="text-foreground text-xs font-semibold tracking-[0.08em]">
                      {roleLabel}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-[11px]">
                    {roleHint}
                  </span>
                </div>
                <PublishingTable
                  role={role}
                  roleShares={roleShares}
                  total={total}
                  roleMsg={roleMsg}
                  missing={missing}
                  shareBusy={shareBusy}
                  saveFeedback={pub.saveFeedback}
                  pendingShares={false}
                  longPress={longPress}
                  onLongPressStart={(type, idx, dir) =>
                    handleLongPress(type, toGlobal(idx), dir)
                  }
                  onLongPressCancel={cancelLongPress}
                  moveShare={(idx, delta) => {
                    const g = toGlobal(idx);
                    if (g >= 0) pub.moveShare(g, delta);
                  }}
                  moveShareTo={(idx, target) => {
                    const g = toGlobal(idx);
                    if (g >= 0) pub.moveShareTo(g, target);
                  }}
                  moveShareTop={(idx) => {
                    const g = toGlobal(idx);
                    if (g >= 0) pub.moveShareTop(g);
                  }}
                  moveShareBottom={(idx) => {
                    const g = toGlobal(idx);
                    if (g >= 0) pub.moveShareBottom(g);
                  }}
                  onChange={(idx, field, value) => {
                    const g = toGlobal(idx);
                    if (g >= 0) pub.handleShareChange(g, field, value);
                  }}
                  onCommitChange={(idx, field, value) => {
                    const g = toGlobal(idx);
                    if (g >= 0) return pub.commitShareField(g, field, value);
                    return Promise.resolve();
                  }}
                  onDelete={(idx) => {
                    const g = toGlobal(idx);
                    if (g >= 0)
                      setDeleteTarget({ type: "share", globalIdx: g });
                  }}
                />

                <div className="md:hidden">
                  <PublishingCards
                    role={role}
                    roleShares={roleShares}
                    shareBusy={shareBusy}
                    pendingShares={false}
                    onLongPressStart={(type, idx, dir) =>
                      handleLongPress(type, toGlobal(idx), dir)
                    }
                    onLongPressCancel={cancelLongPress}
                    moveShare={(idx, delta) => {
                      const g = toGlobal(idx);
                      if (g >= 0) pub.moveShare(g, delta);
                    }}
                    moveShareTo={(idx, target) => {
                      const g = toGlobal(idx);
                      if (g >= 0) pub.moveShareTo(g, target);
                    }}
                    onChange={(idx, field, value) => {
                      const g = toGlobal(idx);
                      if (g >= 0) pub.handleShareChange(g, field, value);
                    }}
                    onCommitChange={(idx, field, value) => {
                      const g = toGlobal(idx);
                      if (g >= 0) return pub.commitShareField(g, field, value);
                      return Promise.resolve();
                    }}
                    onDelete={(idx) => {
                      const g = toGlobal(idx);
                      if (g >= 0)
                        setDeleteTarget({ type: "share", globalIdx: g });
                    }}
                  />
                </div>

                {/* Form de alta específico por rol */}
                {role === "WRITER" ? (
                  <PublishingNewForms
                    mode="WRITER"
                    newWriter={pub.newWriter}
                    newPublisher={pub.newPublisher}
                    setNewWriter={pub.setNewWriter}
                    setNewPublisher={pub.setNewPublisher}
                    savingWriter={pub.savingWriter}
                    savingPublisher={pub.savingPublisher}
                    addShare={pub.addShare}
                  />
                ) : (
                  <PublishingNewForms
                    mode="PUBLISHER"
                    newWriter={pub.newWriter}
                    newPublisher={pub.newPublisher}
                    setNewWriter={pub.setNewWriter}
                    setNewPublisher={pub.setNewPublisher}
                    savingWriter={pub.savingWriter}
                    savingPublisher={pub.savingPublisher}
                    addShare={pub.addShare}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Master */}
      <div className="border-border/60 bg-card/25 space-y-3 rounded-lg border p-3">
        <div className="border-border/50 flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <Disc3 className="text-muted-foreground h-4 w-4" />
            <span className="text-foreground text-xs font-semibold tracking-[0.08em]">
              MASTER
            </span>
          </div>
          <span className="text-muted-foreground text-[11px]">
            Titulares de master
          </span>
        </div>
        <MasterTable
          masterShares={mas.masterShares}
          masterError={mas.masterError}
          sumMaster={mas.sumMaster}
          masterBusy={masterBusy}
          pendingMaster={false}
          saveFeedback={mas.saveFeedback}
          longPress={longPress}
          onLongPressStart={(type, idx, dir) => handleLongPress(type, idx, dir)}
          onLongPressCancel={cancelLongPress}
          moveMaster={mas.moveMaster}
          moveMasterTo={mas.moveMasterTo}
          moveMasterTop={mas.moveMasterTop}
          moveMasterBottom={mas.moveMasterBottom}
          onChange={mas.handleMasterChange}
          onCommitChange={mas.commitMasterField}
          onDelete={(idx) => setDeleteTarget({ type: "master", idx })}
        />
        <div className="md:hidden">
          <MasterCards
            masterShares={mas.masterShares}
            masterBusy={masterBusy}
            pendingMaster={false}
            onLongPressStart={(type, idx, dir) =>
              handleLongPress(type, idx, dir)
            }
            onLongPressCancel={cancelLongPress}
            moveMaster={mas.moveMaster}
            moveMasterTo={mas.moveMasterTo}
            onChange={mas.handleMasterChange}
            onCommitChange={mas.commitMasterField}
            onDelete={(idx) => setDeleteTarget({ type: "master", idx })}
          />
        </div>
        <MasterNewForm
          newMaster={mas.newMaster}
          setNewMaster={mas.setNewMaster}
          savingMaster={mas.savingMaster}
          addMaster={mas.addMaster}
        />
      </div>

      {/* Toggles y metadatos */}
      <RightsToggles
        mfnChecked={mfnChecked}
        setMfnChecked={setMfnChecked}
        oneStopChecked={oneStopChecked}
        setOneStopChecked={setOneStopChecked}
        clearedChecked={clearedChecked}
        setClearedChecked={setClearedChecked}
        contentIdChecked={contentIdChecked}
        setContentIdChecked={setContentIdChecked}
        track={track}
        serverErrors={serverErrors}
      />

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              Esta acción eliminará el registro seleccionado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
