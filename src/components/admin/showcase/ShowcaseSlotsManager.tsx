"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { PromotionSlotFormat, PromotionCampaignStatus } from "@prisma/client";
import { Copy, Plus, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SlotLiveCampaign = {
  id: string;
  name: string;
  status: PromotionCampaignStatus;
  priority: number;
  startsAt: string | null;
  endsAt: string | null;
  updatedAt: string;
};

type ShowcaseSlotRow = {
  id: string;
  key: string;
  name: string;
  format: PromotionSlotFormat;
  description: string | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  campaignCount: number;
  liveCampaign: SlotLiveCampaign | null;
};

type Props = {
  initialSlots: ShowcaseSlotRow[];
};

type CreateSlotForm = {
  key: string;
  name: string;
  format: PromotionSlotFormat;
  description: string;
};

const FORMAT_OPTIONS: PromotionSlotFormat[] = ["HERO", "SLIDER", "STRIP", "GRID", "BANNER"];

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

export function ShowcaseSlotsManager({ initialSlots }: Props) {
  const [slots, setSlots] = useState(initialSlots);
  const [query, setQuery] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<CreateSlotForm>({
    key: "",
    name: "",
    format: "HERO",
    description: "",
  });

  const visibleSlots = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return slots;

    return slots.filter((slot) => {
      const haystack = `${slot.key} ${slot.name} ${slot.description ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [slots, query]);

  async function refreshSlots() {
    const res = await readJson<{ ok: boolean; items: ShowcaseSlotRow[] }>(
      "/api/admin/showcase/slots",
      { cache: "no-store" },
    );
    setSlots(res.items);
  }

  async function handleCreateSlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) return;

    setIsBusy(true);
    setNotice(null);
    setError(null);

    try {
      await readJson<{ ok: boolean }>("/api/admin/showcase/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: createForm.key,
          name: createForm.name,
          format: createForm.format,
          description: createForm.description,
          isEnabled: true,
        }),
      });

      setCreateForm({ key: "", name: "", format: "HERO", description: "" });
      await refreshSlots();
      setNotice("Slot creado");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "No se pudo crear el slot");
    } finally {
      setIsBusy(false);
    }
  }

  async function toggleSlotEnabled(slot: ShowcaseSlotRow) {
    if (isBusy) return;
    setIsBusy(true);
    setNotice(null);
    setError(null);

    try {
      await readJson<{ ok: boolean }>(`/api/admin/showcase/slots/${slot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: !slot.isEnabled }),
      });
      await refreshSlots();
      setNotice(`Slot ${slot.isEnabled ? "deshabilitado" : "habilitado"}`);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "No se pudo actualizar el slot");
    } finally {
      setIsBusy(false);
    }
  }

  async function deleteSlot(slot: ShowcaseSlotRow) {
    const confirmed = window.confirm(
      `Eliminar slot \"${slot.name}\" (${slot.key})? Esta acción no se puede deshacer.`,
    );
    if (!confirmed || isBusy) return;

    setIsBusy(true);
    setNotice(null);
    setError(null);

    try {
      await readJson<{ ok: boolean }>(`/api/admin/showcase/slots/${slot.id}`, {
        method: "DELETE",
      });
      await refreshSlots();
      setNotice("Slot eliminado");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar el slot");
    } finally {
      setIsBusy(false);
    }
  }

  async function copySlotKey(slotKey: string) {
    try {
      await navigator.clipboard.writeText(slotKey);
      setNotice(`Key copiada: ${slotKey}`);
      setError(null);
    } catch {
      setError("No se pudo copiar la key");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-4 sm:px-6">
      <header className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Admin / Showcase</p>
        <h1 className="mt-1 text-xl font-semibold text-neutral-100">Showcase Slots</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Crea contenedores reutilizables (slot keys) para publicar promociones en distintos formatos.
        </p>
      </header>

      <form
        onSubmit={handleCreateSlot}
        className="grid gap-3 rounded-lg border border-neutral-800 bg-neutral-950 p-4 md:grid-cols-[1.2fr_1fr_180px_1fr_auto]"
      >
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Key (ID técnico)
          <input
            value={createForm.key}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, key: event.target.value.toLowerCase() }))
            }
            placeholder="catalog.hero.main"
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Nombre
          <input
            value={createForm.name}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Catalog Hero Main"
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Formato
          <select
            value={createForm.format}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, format: event.target.value as PromotionSlotFormat }))
            }
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          >
            {FORMAT_OPTIONS.map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Descripción
          <input
            value={createForm.description}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, description: event.target.value }))
            }
            placeholder="Hero principal del catálogo"
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
      </form>

      <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full max-w-sm">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-neutral-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por key o nombre"
              className="h-9 w-full rounded border border-neutral-700 bg-neutral-900 pl-8 pr-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            />
          </label>

          <p className="text-xs text-neutral-500">
            {visibleSlots.length} slot{visibleSlots.length === 1 ? "" : "s"}
          </p>
        </div>

        {notice && (
          <p className="mt-3 rounded border border-emerald-700/40 bg-emerald-900/20 px-2 py-1 text-xs text-emerald-200">
            {notice}
          </p>
        )}
        {error && (
          <p className="mt-3 rounded border border-red-700/40 bg-red-900/20 px-2 py-1 text-xs text-red-200">
            {error}
          </p>
        )}

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-800 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-2 py-2">Slot</th>
                <th className="px-2 py-2">Formato</th>
                <th className="px-2 py-2">Estado</th>
                <th className="px-2 py-2">Campañas</th>
                <th className="px-2 py-2">Live ahora</th>
                <th className="px-2 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900 text-neutral-200">
              {visibleSlots.map((slot) => (
                <tr key={slot.id}>
                  <td className="px-2 py-3">
                    <p className="font-medium text-neutral-100">{slot.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-neutral-500">{slot.key}</p>
                    {slot.description && (
                      <p className="mt-1 max-w-sm text-xs text-neutral-400">{slot.description}</p>
                    )}
                  </td>
                  <td className="px-2 py-3 text-xs text-neutral-300">{slot.format}</td>
                  <td className="px-2 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                        slot.isEnabled
                          ? "border-emerald-600/50 text-emerald-300"
                          : "border-neutral-700 text-neutral-500",
                      )}
                    >
                      {slot.isEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-xs text-neutral-300">{slot.campaignCount}</td>
                  <td className="px-2 py-3 text-xs text-neutral-300">
                    {slot.liveCampaign ? (
                      <div>
                        <p className="font-medium text-neutral-100">{slot.liveCampaign.name}</p>
                        <p className="text-neutral-500">Prioridad {slot.liveCampaign.priority}</p>
                        <p className="text-neutral-500">Actualizado {formatDate(slot.liveCampaign.updatedAt)}</p>
                      </div>
                    ) : (
                      <span className="text-neutral-500">Sin campaña LIVE</span>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => copySlotKey(slot.key)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded border border-neutral-700 text-neutral-300 transition hover:border-neutral-500"
                        aria-label={`Copiar key ${slot.key}`}
                      >
                        <Copy className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleSlotEnabled(slot)}
                        className="h-8 rounded border border-neutral-700 px-2 text-xs text-neutral-200 transition hover:border-neutral-500"
                      >
                        {slot.isEnabled ? "Deshabilitar" : "Habilitar"}
                      </button>

                      <Link
                        href={`/admin/showcase/slots/${slot.id}`}
                        className="inline-flex h-8 items-center rounded border border-neutral-100 px-2 text-xs font-semibold text-neutral-100 transition hover:bg-neutral-100 hover:text-neutral-950"
                      >
                        Abrir
                      </Link>

                      <button
                        type="button"
                        onClick={() => deleteSlot(slot)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded border border-red-800/60 text-red-300 transition hover:border-red-600"
                        aria-label={`Eliminar ${slot.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {visibleSlots.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-2 py-8 text-center text-sm text-neutral-500">
                    No hay slots para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
