"use client";

import Link from "next/link";
import { Fragment, useMemo, useState, type FormEvent } from "react";
import {
  BannerTargetType,
  PromotionCampaignStatus,
  PromotionSlotFormat,
} from "@prisma/client";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TargetOption = {
  id: string;
  label: string;
  hint?: string;
};

type CampaignItem = {
  id: string;
  targetType: BannerTargetType;
  targetId: string | null;
  titleOverride: string | null;
  subtitleOverride: string | null;
  imageUrlOverride: string | null;
  ctaLabel: string | null;
  ctaHrefOverride: string | null;
  sortOrder: number;
  isEnabled: boolean;
  startsAt: string | null;
  endsAt: string | null;
  durationMs: number;
  updatedAt: string;
};

type CampaignView = {
  id: string;
  name: string;
  status: PromotionCampaignStatus;
  priority: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  notes: string | null;
  updatedAt: string;
  slot: {
    id: string;
    key: string;
    name: string;
    format: PromotionSlotFormat;
    isEnabled: boolean;
  };
  items: CampaignItem[];
};

type Props = {
  campaign: CampaignView;
  targets: {
    tracks: TargetOption[];
    playlists: TargetOption[];
    soundKits: TargetOption[];
    services: TargetOption[];
    artists: TargetOption[];
  };
};

type CampaignForm = {
  name: string;
  status: PromotionCampaignStatus;
  priority: string;
  startsAt: string;
  endsAt: string;
  notes: string;
};

type SlideForm = {
  targetType: BannerTargetType;
  targetId: string;
  titleOverride: string;
  subtitleOverride: string;
  imageUrlOverride: string;
  ctaLabel: string;
  ctaHrefOverride: string;
  durationMs: string;
  startsAt: string;
  endsAt: string;
  isEnabled: boolean;
};

type ApiCampaignResponse = {
  ok: boolean;
  item: CampaignView;
};

const STATUS_OPTIONS: PromotionCampaignStatus[] = ["DRAFT", "LIVE", "PAUSED", "ARCHIVED"];
const TARGET_TYPE_OPTIONS: BannerTargetType[] = [
  "TRACK",
  "PLAYLIST",
  "SOUND_KIT",
  "SERVICE_OFFER",
  "ARTIST",
  "EXTERNAL_URL",
];

function toLocalDatetime(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

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

function mapCampaignToForm(campaign: CampaignView): CampaignForm {
  return {
    name: campaign.name,
    status: campaign.status,
    priority: String(campaign.priority),
    startsAt: toLocalDatetime(campaign.startsAt),
    endsAt: toLocalDatetime(campaign.endsAt),
    notes: campaign.notes ?? "",
  };
}

function mapItemToForm(item: CampaignItem): SlideForm {
  return {
    targetType: item.targetType,
    targetId: item.targetId ?? "",
    titleOverride: item.titleOverride ?? "",
    subtitleOverride: item.subtitleOverride ?? "",
    imageUrlOverride: item.imageUrlOverride ?? "",
    ctaLabel: item.ctaLabel ?? "",
    ctaHrefOverride: item.ctaHrefOverride ?? "",
    durationMs: String(item.durationMs || 5000),
    startsAt: toLocalDatetime(item.startsAt),
    endsAt: toLocalDatetime(item.endsAt),
    isEnabled: item.isEnabled,
  };
}

function targetOptionsForType(targetType: BannerTargetType, targets: Props["targets"]) {
  if (targetType === "TRACK") return targets.tracks;
  if (targetType === "PLAYLIST") return targets.playlists;
  if (targetType === "SOUND_KIT") return targets.soundKits;
  if (targetType === "SERVICE_OFFER") return targets.services;
  if (targetType === "ARTIST") return targets.artists;
  return [];
}

function labelForTargetType(type: BannerTargetType) {
  if (type === "TRACK") return "Track";
  if (type === "PLAYLIST") return "Playlist";
  if (type === "SOUND_KIT") return "Sound Kit";
  if (type === "SERVICE_OFFER") return "Service";
  if (type === "ARTIST") return "Artist";
  return "External URL";
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

export function ShowcaseCampaignEditor({ campaign: initialCampaign, targets }: Props) {
  const [campaign, setCampaign] = useState<CampaignView>(initialCampaign);
  const [campaignForm, setCampaignForm] = useState<CampaignForm>(mapCampaignToForm(initialCampaign));
  const [addSlideForm, setAddSlideForm] = useState<SlideForm>({
    targetType: "TRACK",
    targetId: "",
    titleOverride: "",
    subtitleOverride: "",
    imageUrlOverride: "",
    ctaLabel: "",
    ctaHrefOverride: "",
    durationMs: "5000",
    startsAt: "",
    endsAt: "",
    isEnabled: true,
  });

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editSlideForm, setEditSlideForm] = useState<SlideForm | null>(null);

  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const orderedItems = useMemo(
    () => [...campaign.items].sort((a, b) => a.sortOrder - b.sortOrder),
    [campaign.items],
  );

  const addTargetOptions = useMemo(
    () => targetOptionsForType(addSlideForm.targetType, targets),
    [addSlideForm.targetType, targets],
  );

  const editTargetOptions = useMemo(
    () => targetOptionsForType(editSlideForm?.targetType ?? "TRACK", targets),
    [editSlideForm?.targetType, targets],
  );

  const targetLabelByType = useMemo(() => {
    return {
      TRACK: new Map(targets.tracks.map((option) => [option.id, option.label])),
      PLAYLIST: new Map(targets.playlists.map((option) => [option.id, option.label])),
      SOUND_KIT: new Map(targets.soundKits.map((option) => [option.id, option.label])),
      SERVICE_OFFER: new Map(targets.services.map((option) => [option.id, option.label])),
      ARTIST: new Map(targets.artists.map((option) => [option.id, option.label])),
      EXTERNAL_URL: new Map<string, string>(),
    } satisfies Record<BannerTargetType, Map<string, string>>;
  }, [targets]);

  async function refreshCampaign() {
    const response = await readJson<ApiCampaignResponse>(
      `/api/admin/showcase/campaigns/${campaign.id}`,
      { cache: "no-store" },
    );

    setCampaign(response.item);
    setCampaignForm(mapCampaignToForm(response.item));

    if (editingItemId) {
      const refreshedItem = response.item.items.find((item) => item.id === editingItemId);
      if (refreshedItem) {
        setEditSlideForm(mapItemToForm(refreshedItem));
      } else {
        setEditingItemId(null);
        setEditSlideForm(null);
      }
    }
  }

  async function saveCampaignSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) return;

    setIsBusy(true);
    setNotice(null);
    setError(null);

    try {
      await readJson<{ ok: boolean }>(`/api/admin/showcase/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignForm.name,
          status: campaignForm.status,
          priority: Number(campaignForm.priority),
          startsAt: fromLocalDatetime(campaignForm.startsAt),
          endsAt: fromLocalDatetime(campaignForm.endsAt),
          notes: campaignForm.notes,
        }),
      });

      await refreshCampaign();
      setNotice("Campaña actualizada");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo actualizar la campaña");
    } finally {
      setIsBusy(false);
    }
  }

  async function addSlide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) return;

    setIsBusy(true);
    setNotice(null);
    setError(null);

    try {
      await readJson<{ ok: boolean }>(`/api/admin/showcase/campaigns/${campaign.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: addSlideForm.targetType,
          targetId: addSlideForm.targetId || null,
          titleOverride: addSlideForm.titleOverride || null,
          subtitleOverride: addSlideForm.subtitleOverride || null,
          imageUrlOverride: addSlideForm.imageUrlOverride || null,
          ctaLabel: addSlideForm.ctaLabel || null,
          ctaHrefOverride: addSlideForm.ctaHrefOverride || null,
          durationMs: Number(addSlideForm.durationMs),
          startsAt: fromLocalDatetime(addSlideForm.startsAt),
          endsAt: fromLocalDatetime(addSlideForm.endsAt),
          isEnabled: addSlideForm.isEnabled,
        }),
      });

      setAddSlideForm((prev) => ({
        ...prev,
        targetId: "",
        titleOverride: "",
        subtitleOverride: "",
        imageUrlOverride: "",
        ctaLabel: "",
        ctaHrefOverride: "",
        durationMs: "5000",
        startsAt: "",
        endsAt: "",
        isEnabled: true,
      }));

      await refreshCampaign();
      setNotice("Slide agregado");
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "No se pudo agregar slide");
    } finally {
      setIsBusy(false);
    }
  }

  function startEditing(item: CampaignItem) {
    setEditingItemId(item.id);
    setEditSlideForm(mapItemToForm(item));
    setNotice(null);
    setError(null);
  }

  function cancelEditing() {
    setEditingItemId(null);
    setEditSlideForm(null);
  }

  async function saveEditedSlide(itemId: string) {
    if (!editSlideForm || isBusy) return;

    setIsBusy(true);
    setNotice(null);
    setError(null);

    try {
      await readJson<{ ok: boolean }>(`/api/admin/showcase/campaigns/${campaign.id}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: editSlideForm.targetType,
          targetId: editSlideForm.targetId || null,
          titleOverride: editSlideForm.titleOverride || null,
          subtitleOverride: editSlideForm.subtitleOverride || null,
          imageUrlOverride: editSlideForm.imageUrlOverride || null,
          ctaLabel: editSlideForm.ctaLabel || null,
          ctaHrefOverride: editSlideForm.ctaHrefOverride || null,
          durationMs: Number(editSlideForm.durationMs),
          startsAt: fromLocalDatetime(editSlideForm.startsAt),
          endsAt: fromLocalDatetime(editSlideForm.endsAt),
          isEnabled: editSlideForm.isEnabled,
        }),
      });

      await refreshCampaign();
      setNotice("Slide actualizado");
      cancelEditing();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar slide");
    } finally {
      setIsBusy(false);
    }
  }

  async function deleteSlide(itemId: string) {
    if (isBusy) return;
    const confirmed = window.confirm("Eliminar slide?");
    if (!confirmed) return;

    setIsBusy(true);
    setNotice(null);
    setError(null);

    try {
      await readJson<{ ok: boolean }>(`/api/admin/showcase/campaigns/${campaign.id}/items/${itemId}`, {
        method: "DELETE",
      });

      await refreshCampaign();
      setNotice("Slide eliminado");
      if (editingItemId === itemId) cancelEditing();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar slide");
    } finally {
      setIsBusy(false);
    }
  }

  async function reorderSlides(nextOrderIds: string[]) {
    if (isBusy) return;

    setIsBusy(true);
    setNotice(null);
    setError(null);

    try {
      await readJson<{ ok: boolean }>(`/api/admin/showcase/campaigns/${campaign.id}/items/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: nextOrderIds }),
      });

      await refreshCampaign();
      setNotice("Orden actualizado");
    } catch (reorderError) {
      setError(reorderError instanceof Error ? reorderError.message : "No se pudo reordenar");
    } finally {
      setIsBusy(false);
    }
  }

  async function moveSlide(itemId: string, direction: "up" | "down") {
    const index = orderedItems.findIndex((item) => item.id === itemId);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedItems.length) return;

    const reordered = [...orderedItems];
    const [moved] = reordered.splice(index, 1);
    if (!moved) return;
    reordered.splice(targetIndex, 0, moved);

    await reorderSlides(reordered.map((item) => item.id));
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-4 sm:px-6">
      <header className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Admin / Showcase / Campaign</p>
            <h1 className="mt-1 text-xl font-semibold text-neutral-100">{campaign.name}</h1>
            <p className="mt-1 text-xs text-neutral-400">
              Slot: <span className="font-mono text-neutral-300">{campaign.slot.key}</span> ({campaign.slot.format})
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/admin/showcase/slots/${campaign.slot.id}`}
              className="inline-flex h-9 items-center gap-1 rounded border border-neutral-700 px-3 text-sm text-neutral-200 transition hover:border-neutral-500"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al slot
            </Link>
          </div>
        </div>

        <div className="mt-3 rounded border border-neutral-800 bg-neutral-900/60 p-3 text-xs text-neutral-400">
          Flujo rápido: 1) Configura campaña (status/fechas/prioridad), 2) agrega slides, 3) ordena con flechas,
          4) si quieres publicarla, deja status en LIVE.
        </div>
      </header>

      <form
        onSubmit={saveCampaignSettings}
        className="grid gap-3 rounded-lg border border-neutral-800 bg-neutral-950 p-4 md:grid-cols-[1.4fr_160px_120px_1fr_1fr]"
      >
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Nombre campaña
          <input
            value={campaignForm.name}
            onChange={(event) => setCampaignForm((prev) => ({ ...prev, name: event.target.value }))}
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Estado
          <select
            value={campaignForm.status}
            onChange={(event) =>
              setCampaignForm((prev) => ({
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
            value={campaignForm.priority}
            onChange={(event) => setCampaignForm((prev) => ({ ...prev, priority: event.target.value }))}
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Inicia (opcional)
          <input
            type="datetime-local"
            value={campaignForm.startsAt}
            onChange={(event) => setCampaignForm((prev) => ({ ...prev, startsAt: event.target.value }))}
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Termina (opcional)
          <input
            type="datetime-local"
            value={campaignForm.endsAt}
            onChange={(event) => setCampaignForm((prev) => ({ ...prev, endsAt: event.target.value }))}
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="md:col-span-5 flex flex-col gap-1 text-xs text-neutral-400">
          Notas internas
          <input
            value={campaignForm.notes}
            onChange={(event) => setCampaignForm((prev) => ({ ...prev, notes: event.target.value }))}
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <div className="md:col-span-5 flex items-center justify-between gap-3">
          <p className="text-xs text-neutral-500">Última actualización: {formatDate(campaign.updatedAt)}</p>
          <button
            type="submit"
            disabled={isBusy}
            className="inline-flex h-9 items-center gap-1 rounded border border-neutral-100 bg-neutral-100 px-3 text-sm font-semibold text-neutral-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            Guardar campaña
          </button>
        </div>
      </form>

      <form
        onSubmit={addSlide}
        className="grid gap-3 rounded-lg border border-neutral-800 bg-neutral-950 p-4 md:grid-cols-[170px_1.2fr_1fr_1fr]"
      >
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Tipo
          <select
            value={addSlideForm.targetType}
            onChange={(event) =>
              setAddSlideForm((prev) => ({
                ...prev,
                targetType: event.target.value as BannerTargetType,
                targetId: "",
              }))
            }
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          >
            {TARGET_TYPE_OPTIONS.map((targetType) => (
              <option key={targetType} value={targetType}>
                {labelForTargetType(targetType)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400 md:col-span-3">
          Target
          {addSlideForm.targetType === "EXTERNAL_URL" ? (
            <input
              value={addSlideForm.targetId}
              onChange={(event) =>
                setAddSlideForm((prev) => ({ ...prev, targetId: event.target.value }))
              }
              placeholder="ID opcional para referencia interna"
              className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            />
          ) : (
            <select
              value={addSlideForm.targetId}
              onChange={(event) =>
                setAddSlideForm((prev) => ({ ...prev, targetId: event.target.value }))
              }
              className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            >
              <option value="">Seleccionar</option>
              {addTargetOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Título override
          <input
            value={addSlideForm.titleOverride}
            onChange={(event) =>
              setAddSlideForm((prev) => ({ ...prev, titleOverride: event.target.value }))
            }
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Subtítulo override
          <input
            value={addSlideForm.subtitleOverride}
            onChange={(event) =>
              setAddSlideForm((prev) => ({ ...prev, subtitleOverride: event.target.value }))
            }
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Image override
          <input
            value={addSlideForm.imageUrlOverride}
            onChange={(event) =>
              setAddSlideForm((prev) => ({ ...prev, imageUrlOverride: event.target.value }))
            }
            placeholder="https://... o /images/..."
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          CTA label
          <input
            value={addSlideForm.ctaLabel}
            onChange={(event) => setAddSlideForm((prev) => ({ ...prev, ctaLabel: event.target.value }))}
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          CTA href
          <input
            value={addSlideForm.ctaHrefOverride}
            onChange={(event) =>
              setAddSlideForm((prev) => ({ ...prev, ctaHrefOverride: event.target.value }))
            }
            placeholder="/track/... o https://..."
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Duración (ms)
          <input
            type="number"
            min={1000}
            max={20000}
            value={addSlideForm.durationMs}
            onChange={(event) =>
              setAddSlideForm((prev) => ({ ...prev, durationMs: event.target.value }))
            }
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Inicia
          <input
            type="datetime-local"
            value={addSlideForm.startsAt}
            onChange={(event) => setAddSlideForm((prev) => ({ ...prev, startsAt: event.target.value }))}
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Termina
          <input
            type="datetime-local"
            value={addSlideForm.endsAt}
            onChange={(event) => setAddSlideForm((prev) => ({ ...prev, endsAt: event.target.value }))}
            className="h-9 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>

        <label className="flex items-center gap-2 pt-6 text-xs text-neutral-300">
          <input
            type="checkbox"
            checked={addSlideForm.isEnabled}
            onChange={(event) =>
              setAddSlideForm((prev) => ({ ...prev, isEnabled: event.target.checked }))
            }
            className="h-4 w-4"
          />
          Enabled
        </label>

        <div className="md:col-span-4 flex justify-end">
          <button
            type="submit"
            disabled={isBusy}
            className="inline-flex h-9 items-center gap-1 rounded border border-neutral-100 bg-neutral-100 px-3 text-sm font-semibold text-neutral-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Agregar slide
          </button>
        </div>
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
            <tr className="text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-2 py-2">Orden</th>
              <th className="px-2 py-2">Target</th>
              <th className="px-2 py-2">Estado</th>
              <th className="px-2 py-2">Duración</th>
              <th className="px-2 py-2">Ventana</th>
              <th className="px-2 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900 text-neutral-200">
            {orderedItems.map((item, index) => {
              const targetLabel =
                item.targetId && targetLabelByType[item.targetType].get(item.targetId)
                  ? targetLabelByType[item.targetType].get(item.targetId)
                  : item.targetId;

              return (
                <Fragment key={item.id}>
                  <tr>
                    <td className="px-2 py-3 text-xs text-neutral-300">{item.sortOrder}</td>
                    <td className="px-2 py-3">
                      <p className="font-medium text-neutral-100">{labelForTargetType(item.targetType)}</p>
                      <p className="text-xs text-neutral-400">{targetLabel || "-"}</p>
                      {item.titleOverride && (
                        <p className="text-xs text-neutral-500">Título: {item.titleOverride}</p>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded border px-2 py-0.5 text-[11px] font-semibold uppercase",
                          item.isEnabled
                            ? "border-emerald-700/50 text-emerald-300"
                            : "border-neutral-700 text-neutral-500",
                        )}
                      >
                        {item.isEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-xs text-neutral-300">{item.durationMs} ms</td>
                    <td className="px-2 py-3 text-xs text-neutral-300">
                      <p>Desde: {formatDate(item.startsAt)}</p>
                      <p>Hasta: {formatDate(item.endsAt)}</p>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap justify-end gap-1">
                        <button
                          type="button"
                          disabled={index === 0 || isBusy}
                          onClick={() => moveSlide(item.id, "up")}
                          className="inline-flex h-8 w-8 items-center justify-center rounded border border-neutral-700 text-neutral-300 transition hover:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Subir"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={index === orderedItems.length - 1 || isBusy}
                          onClick={() => moveSlide(item.id, "down")}
                          className="inline-flex h-8 w-8 items-center justify-center rounded border border-neutral-700 text-neutral-300 transition hover:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Bajar"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => startEditing(item)}
                          className="inline-flex h-8 items-center rounded border border-neutral-700 px-2 text-xs text-neutral-200 transition hover:border-neutral-500"
                        >
                          <Pencil className="mr-1 h-3.5 w-3.5" />
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteSlide(item.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded border border-red-800/60 text-red-300 transition hover:border-red-600"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {editingItemId === item.id && editSlideForm && (
                    <tr>
                      <td colSpan={6} className="px-2 pb-4">
                        <div className="grid gap-2 rounded border border-neutral-800 bg-neutral-900/70 p-3 md:grid-cols-3">
                          <label className="flex flex-col gap-1 text-xs text-neutral-400">
                            Tipo
                            <select
                              value={editSlideForm.targetType}
                              onChange={(event) =>
                                setEditSlideForm((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        targetType: event.target.value as BannerTargetType,
                                        targetId: "",
                                      }
                                    : prev,
                                )
                              }
                              className="h-8 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none"
                            >
                              {TARGET_TYPE_OPTIONS.map((targetType) => (
                                <option key={targetType} value={targetType}>
                                  {labelForTargetType(targetType)}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="flex flex-col gap-1 text-xs text-neutral-400 md:col-span-2">
                            Target
                            {editSlideForm.targetType === "EXTERNAL_URL" ? (
                              <input
                                value={editSlideForm.targetId}
                                onChange={(event) =>
                                  setEditSlideForm((prev) =>
                                    prev ? { ...prev, targetId: event.target.value } : prev,
                                  )
                                }
                                className="h-8 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none"
                              />
                            ) : (
                              <select
                                value={editSlideForm.targetId}
                                onChange={(event) =>
                                  setEditSlideForm((prev) =>
                                    prev ? { ...prev, targetId: event.target.value } : prev,
                                  )
                                }
                                className="h-8 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none"
                                required
                              >
                                <option value="">Seleccionar</option>
                                {editTargetOptions.map((option) => (
                                  <option key={option.id} value={option.id}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            )}
                          </label>

                          <label className="flex flex-col gap-1 text-xs text-neutral-400">
                            Título
                            <input
                              value={editSlideForm.titleOverride}
                              onChange={(event) =>
                                setEditSlideForm((prev) =>
                                  prev ? { ...prev, titleOverride: event.target.value } : prev,
                                )
                              }
                              className="h-8 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none"
                            />
                          </label>

                          <label className="flex flex-col gap-1 text-xs text-neutral-400">
                            Subtítulo
                            <input
                              value={editSlideForm.subtitleOverride}
                              onChange={(event) =>
                                setEditSlideForm((prev) =>
                                  prev ? { ...prev, subtitleOverride: event.target.value } : prev,
                                )
                              }
                              className="h-8 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none"
                            />
                          </label>

                          <label className="flex flex-col gap-1 text-xs text-neutral-400">
                            Image URL
                            <input
                              value={editSlideForm.imageUrlOverride}
                              onChange={(event) =>
                                setEditSlideForm((prev) =>
                                  prev ? { ...prev, imageUrlOverride: event.target.value } : prev,
                                )
                              }
                              className="h-8 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none"
                            />
                          </label>

                          <label className="flex flex-col gap-1 text-xs text-neutral-400">
                            CTA label
                            <input
                              value={editSlideForm.ctaLabel}
                              onChange={(event) =>
                                setEditSlideForm((prev) =>
                                  prev ? { ...prev, ctaLabel: event.target.value } : prev,
                                )
                              }
                              className="h-8 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none"
                            />
                          </label>

                          <label className="flex flex-col gap-1 text-xs text-neutral-400">
                            CTA href
                            <input
                              value={editSlideForm.ctaHrefOverride}
                              onChange={(event) =>
                                setEditSlideForm((prev) =>
                                  prev ? { ...prev, ctaHrefOverride: event.target.value } : prev,
                                )
                              }
                              className="h-8 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none"
                            />
                          </label>

                          <label className="flex flex-col gap-1 text-xs text-neutral-400">
                            Duración (ms)
                            <input
                              type="number"
                              value={editSlideForm.durationMs}
                              onChange={(event) =>
                                setEditSlideForm((prev) =>
                                  prev ? { ...prev, durationMs: event.target.value } : prev,
                                )
                              }
                              className="h-8 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none"
                            />
                          </label>

                          <label className="flex flex-col gap-1 text-xs text-neutral-400">
                            Inicia
                            <input
                              type="datetime-local"
                              value={editSlideForm.startsAt}
                              onChange={(event) =>
                                setEditSlideForm((prev) =>
                                  prev ? { ...prev, startsAt: event.target.value } : prev,
                                )
                              }
                              className="h-8 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none"
                            />
                          </label>

                          <label className="flex flex-col gap-1 text-xs text-neutral-400">
                            Termina
                            <input
                              type="datetime-local"
                              value={editSlideForm.endsAt}
                              onChange={(event) =>
                                setEditSlideForm((prev) =>
                                  prev ? { ...prev, endsAt: event.target.value } : prev,
                                )
                              }
                              className="h-8 rounded border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none"
                            />
                          </label>

                          <label className="flex items-center gap-2 pt-4 text-xs text-neutral-300">
                            <input
                              type="checkbox"
                              checked={editSlideForm.isEnabled}
                              onChange={(event) =>
                                setEditSlideForm((prev) =>
                                  prev ? { ...prev, isEnabled: event.target.checked } : prev,
                                )
                              }
                              className="h-4 w-4"
                            />
                            Enabled
                          </label>

                          <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="h-8 rounded border border-neutral-700 px-2 text-xs text-neutral-200 transition hover:border-neutral-500"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEditedSlide(item.id)}
                              className="h-8 rounded border border-neutral-100 bg-neutral-100 px-2 text-xs font-semibold text-neutral-950 transition hover:opacity-90"
                            >
                              Guardar slide
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}

            {orderedItems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-2 py-8 text-center text-sm text-neutral-500">
                  Esta campaña todavía no tiene slides.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
