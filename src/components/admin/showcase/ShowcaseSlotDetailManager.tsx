"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  PromotionCampaignStatus,
  PromotionSlotFormat,
  type Prisma,
} from "@prisma/client";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SlotView = {
  id: string;
  key: string;
  name: string;
  format: PromotionSlotFormat;
  description: string | null;
  isEnabled: boolean;
  settings: Prisma.JsonValue;
  createdAt: string;
  updatedAt: string;
};

type CampaignRow = {
  id: string;
  name: string;
  status: PromotionCampaignStatus;
  priority: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  notes: string | null;
  updatedAt: string;
  itemCount: number;
};

type Props = {
  slot: SlotView;
  initialCampaigns: CampaignRow[];
};

type SlotForm = {
  key: string;
  name: string;
  format: PromotionSlotFormat;
  description: string;
  isEnabled: boolean;
};

type CreateCampaignForm = {
  name: string;
  status: PromotionCampaignStatus;
  priority: string;
  startsAt: string;
  endsAt: string;
  notes: string;
};

const STATUS_OPTIONS: PromotionCampaignStatus[] = [
  "DRAFT",
  "LIVE",
  "PAUSED",
  "ARCHIVED",
];

function fromLocalDatetime(value: string) {
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = new Date(normalized);
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed.toISOString();
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "-";
  try {
    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

async function readJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (payload && typeof payload.error === "string" && payload.error) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }
  return payload as T;
}

export function ShowcaseSlotDetailManager({
  slot: initialSlot,
  initialCampaigns,
}: Props) {
  const [slot, setSlot] = useState(initialSlot);
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [slotForm, setSlotForm] = useState<SlotForm>({
    key: initialSlot.key,
    name: initialSlot.name,
    format: initialSlot.format,
    description: initialSlot.description ?? "",
    isEnabled: initialSlot.isEnabled,
  });
  const [createCampaignForm, setCreateCampaignForm] =
    useState<CreateCampaignForm>({
      name: "",
      status: "DRAFT",
      priority: "0",
      startsAt: "",
      endsAt: "",
      notes: "",
    });

  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshCampaigns() {
    const res = await readJson<{ ok: boolean; items: CampaignRow[] }>(
      `/api/admin/showcase/slots/${slot.id}/campaigns`,
      { cache: "no-store" },
    );
    setCampaigns(res.items);
  }

  async function saveSlotSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) return;

    setIsBusy(true);
    setNotice(null);
    setError(null);

    try {
      const res = await readJson<{ ok: boolean; item: SlotView }>(
        `/api/admin/showcase/slots/${slot.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: slotForm.key,
            name: slotForm.name,
            format: slotForm.format,
            description: slotForm.description,
            isEnabled: slotForm.isEnabled,
          }),
        },
      );

      setSlot((prev) => ({ ...prev, ...res.item }));
      setNotice("Slot actualizado");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar el slot",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function createCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) return;

    setIsBusy(true);
    setNotice(null);
    setError(null);

    try {
      await readJson<{ ok: boolean }>(
        `/api/admin/showcase/slots/${slot.id}/campaigns`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: createCampaignForm.name,
            status: createCampaignForm.status,
            priority: Number(createCampaignForm.priority),
            startsAt: fromLocalDatetime(createCampaignForm.startsAt),
            endsAt: fromLocalDatetime(createCampaignForm.endsAt),
            notes: createCampaignForm.notes,
          }),
        },
      );

      setCreateCampaignForm({
        name: "",
        status: "DRAFT",
        priority: "0",
        startsAt: "",
        endsAt: "",
        notes: "",
      });

      await refreshCampaigns();
      setNotice("Campaña creada");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "No se pudo crear la campaña",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function setCampaignStatus(
    campaign: CampaignRow,
    status: PromotionCampaignStatus,
  ) {
    if (isBusy) return;
    setIsBusy(true);
    setNotice(null);
    setError(null);

    try {
      await readJson<{ ok: boolean }>(
        `/api/admin/showcase/campaigns/${campaign.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      await refreshCampaigns();
      setNotice(`Campaña "${campaign.name}" → ${status}`);
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "No se pudo actualizar estado",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function deleteCampaign(campaign: CampaignRow) {
    const confirmed = window.confirm(
      `Eliminar campaña "${campaign.name}"? Se eliminarán también sus slides.`,
    );
    if (!confirmed || isBusy) return;

    setIsBusy(true);
    setNotice(null);
    setError(null);

    try {
      await readJson<{ ok: boolean }>(
        `/api/admin/showcase/campaigns/${campaign.id}`,
        {
          method: "DELETE",
        },
      );
      await refreshCampaigns();
      setNotice("Campaña eliminada");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "No se pudo eliminar campaña",
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-4 sm:px-6">
      <header className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] tracking-[0.2em] text-neutral-400 uppercase">
              Admin / Showcase / Slot
            </p>
            <h1 className="mt-1 text-xl font-semibold text-neutral-100">
              {slot.name}
            </h1>
            <p className="mt-1 font-mono text-xs text-neutral-500">
              {slot.key}
            </p>
          </div>

          <Link
            href="/admin/showcase"
            className="inline-flex h-9 items-center gap-1 rounded border border-neutral-700 px-3 text-sm text-neutral-200 transition hover:border-neutral-500"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>
      </header>

      <form
        onSubmit={saveSlotSettings}
        className="grid gap-3 rounded-lg border border-neutral-800 bg-neutral-950 p-4 md:grid-cols-2"
      >
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Key (ID técnico)
          <input
            value={slotForm.key}
            onChange={(event) =>
              setSlotForm((prev) => ({
                ...prev,
                key: event.target.value.toLowerCase(),
              }))
            }
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Nombre
          <input
            value={slotForm.name}
            onChange={(event) =>
              setSlotForm((prev) => ({ ...prev, name: event.target.value }))
            }
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Formato
          <select
            value={slotForm.format}
            onChange={(event) =>
              setSlotForm((prev) => ({
                ...prev,
                format: event.target.value as PromotionSlotFormat,
              }))
            }
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          >
            {(
              [
                "HERO",
                "SLIDER",
                "STRIP",
                "GRID",
                "BANNER",
              ] as PromotionSlotFormat[]
            ).map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Estado slot
          <select
            value={slotForm.isEnabled ? "ENABLED" : "DISABLED"}
            onChange={(event) =>
              setSlotForm((prev) => ({
                ...prev,
                isEnabled: event.target.value === "ENABLED",
              }))
            }
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          >
            <option value="ENABLED">Enabled</option>
            <option value="DISABLED">Disabled</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400 md:col-span-2">
          Descripción
          <input
            value={slotForm.description}
            onChange={(event) =>
              setSlotForm((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <div className="flex items-center justify-between gap-3 md:col-span-2">
          <p className="text-xs text-neutral-500">
            Actualizado {formatDate(slot.updatedAt)}
          </p>
          <button
            type="submit"
            disabled={isBusy}
            className="inline-flex h-9 items-center gap-1 rounded border border-neutral-100 bg-neutral-100 px-3 text-sm font-semibold text-neutral-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Pencil className="h-4 w-4" />
            Guardar slot
          </button>
        </div>
      </form>

      <form
        onSubmit={createCampaign}
        className="grid gap-3 rounded-lg border border-neutral-800 bg-neutral-950 p-4 md:grid-cols-[1.4fr_170px_130px_1fr_1fr_auto]"
      >
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Nombre campaña
          <input
            value={createCampaignForm.name}
            onChange={(event) =>
              setCreateCampaignForm((prev) => ({
                ...prev,
                name: event.target.value,
              }))
            }
            placeholder="Campaña marzo 2026"
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Estado
          <select
            value={createCampaignForm.status}
            onChange={(event) =>
              setCreateCampaignForm((prev) => ({
                ...prev,
                status: event.target.value as PromotionCampaignStatus,
              }))
            }
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Prioridad
          <input
            type="number"
            value={createCampaignForm.priority}
            onChange={(event) =>
              setCreateCampaignForm((prev) => ({
                ...prev,
                priority: event.target.value,
              }))
            }
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Inicia (opcional)
          <input
            type="datetime-local"
            value={createCampaignForm.startsAt}
            onChange={(event) =>
              setCreateCampaignForm((prev) => ({
                ...prev,
                startsAt: event.target.value,
              }))
            }
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Termina (opcional)
          <input
            type="datetime-local"
            value={createCampaignForm.endsAt}
            onChange={(event) =>
              setCreateCampaignForm((prev) => ({
                ...prev,
                endsAt: event.target.value,
              }))
            }
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <button
          type="submit"
          disabled={isBusy}
          className="inline-flex h-9 items-center justify-center gap-1 rounded border border-neutral-100 bg-neutral-100 px-3 text-sm font-semibold text-neutral-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          Crear
        </button>

        <label className="flex flex-col gap-1 text-xs text-neutral-400 md:col-span-6">
          Notas internas
          <input
            value={createCampaignForm.notes}
            onChange={(event) =>
              setCreateCampaignForm((prev) => ({
                ...prev,
                notes: event.target.value,
              }))
            }
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>
      </form>

      {notice && (
        <p className="rounded border border-emerald-700/40 bg-emerald-900/20 px-2 py-1 text-xs text-emerald-200">
          {notice}
        </p>
      )}
      {error && (
        <p className="rounded border border-red-700/40 bg-red-900/20 px-2 py-1 text-xs text-red-200">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-950 p-4">
        <table className="min-w-full divide-y divide-neutral-800 text-sm">
          <thead>
            <tr className="text-left text-xs tracking-wide text-neutral-500 uppercase">
              <th className="px-2 py-2">Campaña</th>
              <th className="px-2 py-2">Estado</th>
              <th className="px-2 py-2">Ventana</th>
              <th className="px-2 py-2">Slides</th>
              <th className="px-2 py-2">Actualizada</th>
              <th className="px-2 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900 text-neutral-200">
            {campaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td className="px-2 py-3">
                  <p className="font-medium text-neutral-100">
                    {campaign.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Prioridad {campaign.priority}
                  </p>
                  {campaign.notes && (
                    <p className="mt-1 max-w-xs text-xs text-neutral-400">
                      {campaign.notes}
                    </p>
                  )}
                </td>
                <td className="px-2 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded border px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
                      campaign.status === "LIVE"
                        ? "border-emerald-600/50 text-emerald-300"
                        : campaign.status === "DRAFT"
                          ? "border-amber-700/50 text-amber-300"
                          : campaign.status === "PAUSED"
                            ? "border-neutral-700 text-neutral-300"
                            : "border-red-800/60 text-red-300",
                    )}
                  >
                    {campaign.status}
                  </span>
                </td>
                <td className="px-2 py-3 text-xs text-neutral-300">
                  <p>Desde: {formatDate(campaign.startsAt)}</p>
                  <p>Hasta: {formatDate(campaign.endsAt)}</p>
                </td>
                <td className="px-2 py-3 text-xs text-neutral-300">
                  {campaign.itemCount}
                </td>
                <td className="px-2 py-3 text-xs text-neutral-300">
                  {formatDate(campaign.updatedAt)}
                </td>
                <td className="px-2 py-3">
                  <div className="flex flex-wrap justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setCampaignStatus(campaign, "LIVE")}
                      className="h-8 rounded border border-emerald-700/60 px-2 text-xs text-emerald-300 transition hover:border-emerald-500"
                    >
                      Live
                    </button>
                    <button
                      type="button"
                      onClick={() => setCampaignStatus(campaign, "PAUSED")}
                      className="h-8 rounded border border-neutral-700 px-2 text-xs text-neutral-200 transition hover:border-neutral-500"
                    >
                      Pausar
                    </button>
                    <button
                      type="button"
                      onClick={() => setCampaignStatus(campaign, "ARCHIVED")}
                      className="h-8 rounded border border-amber-700/60 px-2 text-xs text-amber-300 transition hover:border-amber-500"
                    >
                      Archivar
                    </button>

                    <Link
                      href={`/admin/showcase/campaigns/${campaign.id}`}
                      className="inline-flex h-8 items-center rounded border border-neutral-100 px-2 text-xs font-semibold text-neutral-100 transition hover:bg-neutral-100 hover:text-neutral-950"
                    >
                      Editar slides
                    </Link>

                    <button
                      type="button"
                      onClick={() => deleteCampaign(campaign)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded border border-red-800/60 text-red-300 transition hover:border-red-600"
                      aria-label={`Eliminar ${campaign.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {campaigns.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-2 py-8 text-center text-sm text-neutral-500"
                >
                  No hay campañas en este slot.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
