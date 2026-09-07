"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  Check,
  Clock3,
  Copy,
  Filter,
  Loader2,
  RefreshCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatStableSantiagoDateTime } from "@/lib/stable-date-format";
import AnalyzeActions from "@/components/admin/AnalyzeActions";
import {
  allSelected as computeAllSelected,
  AdminBulkPanel,
  AdminControlsRow,
  AdminFilterPanel,
  AdminIconBadge,
  AdminListButton,
  AdminListEmptyState,
  AdminStatusBadge,
  ListKitTableComposer,
  countActiveFilters,
  selectAllOrNone,
  toggleSelection,
  type AdminColumnDef,
} from "@/components/admin/list-kit";

export type TrackListRow = {
  id: string;
  title: string | null;
  artist: string | null;
  analysisAtIso: string | null;
  assetKey: string | null;
  audioUrl: string | null;
  moodNames: string[];
  genres: string[];
  licenseType: string | null;
  mediaBuy: string | null;
  durationSec: number | null;
  sampleRateHz: number | null;
  loudnessLufs: number | null;
  loudnessRangeLu: number | null;
  truePeakDbfs: number | null;
};

type TracksTableClientProps = {
  tracks: TrackListRow[];
  filters: {
    q: string;
    analysis: string;
    per: number;
    activeCount: number;
  };
};

function trackStatus(row: TrackListRow): "NO_AUDIO" | "PENDING" | "ANALYZED" {
  const hasAudio = !!(row.assetKey || row.audioUrl);
  if (!hasAudio) return "NO_AUDIO";
  if (!row.analysisAtIso) return "PENDING";
  return "ANALYZED";
}

function statusBadge(row: TrackListRow) {
  const status = trackStatus(row);
  if (status === "NO_AUDIO") {
    return (
      <AdminIconBadge
        tone="danger"
        icon={<Ban aria-hidden="true" />}
        label="SIN AUDIO"
      />
    );
  }
  if (status === "PENDING") {
    return (
      <AdminIconBadge
        tone="warning"
        icon={<Clock3 aria-hidden="true" />}
        label="SIN ANÁLISIS"
      />
    );
  }
  return (
    <AdminIconBadge
      tone="success"
      icon={<ShieldCheck aria-hidden="true" />}
      label="ANALIZADO"
    />
  );
}

function analysisBadge(row: TrackListRow) {
  if (row.analysisAtIso) {
    return (
      <div className="flex flex-col items-start gap-1">
        <AdminIconBadge
          tone="success"
          icon={<ShieldCheck aria-hidden="true" />}
          label="ANALIZADO"
        />
        <span className="text-muted-foreground text-[11px]">
          {formatDateTime(row.analysisAtIso)}
        </span>
      </div>
    );
  }
  return (
    <AdminIconBadge
      tone="warning"
      icon={<Clock3 aria-hidden="true" />}
      label="PENDIENTE"
    />
  );
}

export function TracksTableClient({ tracks, filters }: TracksTableClientProps) {
  const router = useRouter();
  const [rows, setRows] = useState<TrackListRow[]>(tracks);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [idCopyState, setIdCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const [filterCopyState, setFilterCopyState] = useState<
    "idle" | "copied" | "error"
  >("idle");
  const [localQuery, setLocalQuery] = useState(filters.q);
  const [localAnalysis, setLocalAnalysis] = useState(filters.analysis);
  const [localPer, setLocalPer] = useState(String(filters.per));
  const [analyzeState, setAnalyzeState] = useState<{
    type: "idle" | "running" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });
  const idCopyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterCopyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analyzeResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectableIds = useMemo(() => rows.map((track) => track.id), [rows]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected = computeAllSelected(selectedIds, selectableIds);
  const selectionStateLabel =
    selectedIds.length > 0
      ? `${selectedIds.length} ${selectedIds.length === 1 ? "seleccionado" : "seleccionados"}`
      : "sin selección";
  const localActiveCount = countActiveFilters([
    localQuery.trim().toLowerCase(),
    localAnalysis,
    localPer !== "50" ? localPer : "",
  ]);
  const filterStateLabel =
    localActiveCount === 0
      ? "sin filtros"
      : `${localActiveCount} ${localActiveCount === 1 ? "filtro activo" : "filtros activos"}`;

  useEffect(() => {
    return () => {
      if (idCopyResetRef.current) {
        clearTimeout(idCopyResetRef.current);
      }
      if (filterCopyResetRef.current) {
        clearTimeout(filterCopyResetRef.current);
      }
      if (analyzeResetRef.current) {
        clearTimeout(analyzeResetRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setRows(tracks);
  }, [tracks]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const params = new URLSearchParams();
      const trimmedQuery = localQuery.trim();
      if (trimmedQuery) params.set("q", trimmedQuery);
      if (localAnalysis) params.set("analysis", localAnalysis);
      if (localPer) params.set("per", localPer);
      params.set("page", "1");

      const query = params.toString();
      const nextPath = `${window.location.pathname}?${query}`;
      const currentPath = `${window.location.pathname}${window.location.search}`;
      if (nextPath !== currentPath) {
        router.replace(nextPath, { scroll: false });
      }
    }, 120);

    return () => window.clearTimeout(timeoutId);
  }, [localAnalysis, localPer, localQuery, router]);

  async function handleCopyFilter() {
    const params = new URLSearchParams();
    const trimmedQuery = localQuery.trim();
    if (trimmedQuery) params.set("q", trimmedQuery);
    if (localAnalysis) params.set("analysis", localAnalysis);
    if (localPer) params.set("per", localPer);
    params.set("page", "1");
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      setFilterCopyState("copied");
    } catch {
      setFilterCopyState("error");
    }
    if (filterCopyResetRef.current) {
      clearTimeout(filterCopyResetRef.current);
    }
    filterCopyResetRef.current = setTimeout(
      () => setFilterCopyState("idle"),
      1600,
    );
  }

  async function handleCopySelected() {
    if (selectedIds.length === 0) return;
    try {
      await navigator.clipboard.writeText(selectedIds.join(","));
      setIdCopyState("copied");
    } catch {
      setIdCopyState("error");
    }
    if (idCopyResetRef.current) {
      clearTimeout(idCopyResetRef.current);
    }
    idCopyResetRef.current = setTimeout(() => setIdCopyState("idle"), 1500);
  }

  async function handleAnalyzeSelected() {
    if (selectedIds.length === 0) return;
    setAnalyzeState({
      type: "running",
      message: `Analizando ${selectedIds.length} track(s)...`,
    });

    let okCount = 0;
    let failCount = 0;
    const rowMap = new Map(rows.map((row) => [row.id, row] as const));

    for (const id of selectedIds) {
      try {
        const response = await fetch(
          `/api/tracks/${encodeURIComponent(id)}/analyze`,
          {
            method: "POST",
            credentials: "include",
            cache: "no-store",
          },
        );
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.ok) {
          failCount += 1;
          continue;
        }

        okCount += 1;
        const updated = payload.updated as Partial<{
          durationSec: number | null;
          sampleRateHz: number | null;
          loudnessLufs: number | null;
          loudnessRangeLu: number | null;
          truePeakDbfs: number | null;
          analysisAt: string | Date | null;
        }> | null;

        if (!updated) continue;

        const current = rowMap.get(id);
        if (!current) continue;
        rowMap.set(id, {
          ...current,
          durationSec: updated.durationSec ?? current.durationSec,
          sampleRateHz: updated.sampleRateHz ?? current.sampleRateHz,
          loudnessLufs: updated.loudnessLufs ?? current.loudnessLufs,
          loudnessRangeLu: updated.loudnessRangeLu ?? current.loudnessRangeLu,
          truePeakDbfs: updated.truePeakDbfs ?? current.truePeakDbfs,
          analysisAtIso:
            typeof updated.analysisAt === "string"
              ? updated.analysisAt
              : updated.analysisAt instanceof Date
                ? updated.analysisAt.toISOString()
                : current.analysisAtIso,
        });
      } catch {
        failCount += 1;
      }
    }

    setRows(rows.map((row) => rowMap.get(row.id) ?? row));

    if (analyzeResetRef.current) {
      clearTimeout(analyzeResetRef.current);
    }
    if (failCount === 0) {
      setAnalyzeState({
        type: "success",
        message: `Analizados: ${okCount}/${selectedIds.length}`,
      });
      analyzeResetRef.current = setTimeout(
        () => setAnalyzeState({ type: "idle", message: "" }),
        2000,
      );
      return;
    }
    setAnalyzeState({
      type: "error",
      message: `Analizados: ${okCount}/${selectedIds.length} · errores: ${failCount}`,
    });
    analyzeResetRef.current = setTimeout(
      () => setAnalyzeState({ type: "idle", message: "" }),
      3500,
    );
  }

  const desktopColumns: AdminColumnDef<TrackListRow>[] = [
    {
      key: "select",
      label: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={(event) =>
            setSelectedIds(selectAllOrNone(selectableIds, event.target.checked))
          }
          className="border-border bg-background h-4 w-4 rounded"
          aria-label="Seleccionar todos los tracks"
        />
      ),
      widthClassName: "w-12",
      render: (track) => (
        <input
          type="checkbox"
          checked={selectedSet.has(track.id)}
          onChange={() =>
            setSelectedIds((current) => toggleSelection(current, track.id))
          }
          className="border-border bg-background h-4 w-4 rounded"
          aria-label={`Seleccionar track ${track.title ?? track.id}`}
        />
      ),
    },
    {
      key: "track",
      label: "Track",
      render: (track) => (
        <div className="flex flex-col">
          <Link
            href={`/admin/tracks/${track.id}/edit`}
            className="text-foreground hover:underline"
          >
            <span className="text-sm font-medium">
              {track.title || "(sin título)"}
            </span>
          </Link>
          <span className="text-muted-foreground text-xs">
            {track.artist || "(sin artista)"}
          </span>
          <span className="text-muted-foreground mt-1 font-mono text-[10px] break-words">
            ID: {track.id}
          </span>
        </div>
      ),
    },
    {
      key: "metadata",
      label: "Metadata",
      render: (track) => <MetadataSummary row={track} />,
    },
    {
      key: "estado",
      label: "Estado",
      render: (track) => statusBadge(track),
    },
    {
      key: "audio",
      label: "Audio",
      render: (track) => <AudioInfo row={track} />,
    },
    {
      key: "analizado",
      label: "Analizado",
      render: (track) => analysisBadge(track),
    },
    {
      key: "acciones",
      label: "Acciones",
      align: "right",
      widthClassName: "w-[228px]",
      render: (track) => (
        <AnalyzeActions
          id={track.id}
          audioUrl={track.audioUrl}
          iconOnly
          className="max-w-[220px] flex-wrap justify-end"
        />
      ),
    },
  ];

  const filterPanel = (
    <form
      method="GET"
      action="/admin/tracks"
      className="min-w-0"
      onSubmit={(event) => event.preventDefault()}
    >
      <AdminFilterPanel
        title={
          <>
            <Filter className="h-3.5 w-3.5" />
            Filtros de lista
          </>
        }
        statusSlot={
          <>
            <span className="text-muted-foreground text-[11px]">·</span>
            <AdminStatusBadge className="capitalize">
              {filterStateLabel}
            </AdminStatusBadge>
          </>
        }
        actionSlot={
          <AdminListButton
            type="button"
            onClick={() => void handleCopyFilter()}
            size="pill"
            surface="background"
            className={cn(
              filterCopyState === "copied"
                ? "border-emerald-500/50 text-emerald-300"
                : "",
              filterCopyState === "error"
                ? "border-destructive/60 text-destructive"
                : "",
            )}
          >
            {filterCopyState === "copied"
              ? "Copiado"
              : filterCopyState === "error"
                ? "Error"
                : "Copiar filtro"}
          </AdminListButton>
        }
      >
        <AdminControlsRow innerClassName="w-full xl:flex-nowrap">
          <div className="grid min-w-0 flex-[1_1_220px] gap-1">
            <span className="text-[10px] font-semibold tracking-wide text-transparent uppercase select-none">
              Campo
            </span>
            <div className="relative w-full">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <input
                id="filter-tracks-q"
                type="text"
                name="q"
                value={localQuery}
                onChange={(event) => setLocalQuery(event.target.value)}
                placeholder="Buscar título o artista"
                className="border-border bg-background h-9 w-full rounded-md border pr-3 pl-9 text-sm"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="grid w-[132px] gap-1">
            <span className="text-muted-foreground text-center text-[10px] font-semibold tracking-wide uppercase">
              ESTADO
            </span>
            <select
              id="filter-tracks-status"
              name="analysis"
              value={localAnalysis}
              onChange={(event) => setLocalAnalysis(event.target.value)}
              className="border-border bg-background h-9 w-full rounded-md border px-3 pr-8 text-sm"
            >
              <option value="">TODOS</option>
              <option value="analyzed">ANALIZADO</option>
              <option value="pending">SIN ANÁLISIS</option>
              <option value="no_audio">SIN AUDIO</option>
            </select>
          </div>

          <div className="grid w-[104px] gap-1">
            <span className="text-muted-foreground text-center text-[10px] font-semibold tracking-wide uppercase">
              POR PÁGINA
            </span>
            <select
              id="filter-tracks-per"
              name="per"
              value={localPer}
              onChange={(event) => setLocalPer(event.target.value)}
              className="border-border bg-background h-9 w-full rounded-md border px-3 pr-8 text-sm"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          <div className="grid w-[42px] gap-1">
            <span className="text-[10px] font-semibold tracking-wide text-transparent uppercase select-none">
              Acción
            </span>
            <AdminListButton
              id="tracks-limpiar-filtros"
              type="button"
              title="Limpiar"
              aria-label="Limpiar"
              onClick={() => {
                setLocalQuery("");
                setLocalAnalysis("");
                setLocalPer("50");
              }}
              size="controlIcon"
              className="w-full"
            >
              <RefreshCcw className="h-4 w-4" />
            </AdminListButton>
          </div>
        </AdminControlsRow>
      </AdminFilterPanel>
    </form>
  );

  const bulkPanel = (
    <AdminBulkPanel
      title={
        <>
          <Check className="h-3.5 w-3.5" />
          Acciones masivas
        </>
      }
      statusSlot={
        <div className="inline-flex items-center gap-1.5">
          <AdminStatusBadge className="capitalize">
            {selectionStateLabel}
          </AdminStatusBadge>
          {analyzeState.type !== "idle" ? (
            <AdminStatusBadge
              tone={
                analyzeState.type === "success"
                  ? "success"
                  : analyzeState.type === "error"
                    ? "danger"
                    : "warning"
              }
            >
              {analyzeState.message}
            </AdminStatusBadge>
          ) : null}
        </div>
      }
      className="bg-background/30"
    >
      <AdminControlsRow>
        <div className="grid gap-1">
          <span className="text-[10px] font-semibold tracking-wide text-transparent uppercase select-none">
            Campo
          </span>
          <label className="border-border inline-flex h-8 items-center gap-2 rounded-md border px-2 py-1 text-xs">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(event) =>
                setSelectedIds(
                  selectAllOrNone(selectableIds, event.target.checked),
                )
              }
              className="border-border bg-background h-4 w-4 rounded"
            />
            Todo
          </label>
        </div>

        <div className="grid gap-1">
          <span className="text-[10px] font-semibold tracking-wide text-transparent uppercase select-none">
            Campo
          </span>
          <AdminListButton
            type="button"
            onClick={() => {
              void handleAnalyzeSelected();
            }}
            disabled={selectedIds.length === 0 || analyzeState.type === "running"}
            size="row"
            className="gap-1"
          >
            {analyzeState.type === "running" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5" />
            )}
            Analizar
          </AdminListButton>
        </div>

        <div className="grid gap-1">
          <span className="text-[10px] font-semibold tracking-wide text-transparent uppercase select-none">
            Campo
          </span>
          <AdminListButton
            type="button"
            onClick={() => {
              void handleCopySelected();
            }}
            disabled={selectedIds.length === 0}
            className={cn(
              "gap-1",
              idCopyState === "copied" ? "border-emerald-500/50 text-emerald-300" : "",
              idCopyState === "error" ? "border-destructive/60 text-destructive" : "",
            )}
          >
            <Copy className="h-3.5 w-3.5" />
            {idCopyState === "copied"
              ? "Copiado"
              : idCopyState === "error"
                ? "Error"
                : "Copiar IDs"}
          </AdminListButton>
        </div>

        <div className="grid gap-1">
          <span className="text-[10px] font-semibold tracking-wide text-transparent uppercase select-none">
            Campo
          </span>
          <AdminListButton
            type="button"
            onClick={() => setSelectedIds([])}
            disabled={selectedIds.length === 0}
            size="rowIcon"
            title="Limpiar selección"
            aria-label="Limpiar selección"
          >
            <RefreshCcw className="h-4 w-4" />
          </AdminListButton>
        </div>
      </AdminControlsRow>
    </AdminBulkPanel>
  );

  const emptyState = (
    <AdminListEmptyState message="Sin resultados para los filtros actuales." />
  );

  return (
    <ListKitTableComposer
      rows={rows}
      columns={desktopColumns}
      rowKey={(track) => track.id}
      rowClassName={(track) =>
        cn(
          "border-t border-border/70 hover:bg-muted/60",
          selectedSet.has(track.id) && "bg-accent/20 hover:bg-accent/25",
        )
      }
      tableClassName="w-full table-fixed"
      headerClassName="bg-muted/60"
      filterPanel={filterPanel}
      bulkPanel={bulkPanel}
      emptyState={emptyState}
      renderMobileRow={(track) => (
        <article
          key={track.id}
          className={cn(
            "border-border/70 bg-card space-y-3 rounded-lg border p-3 transition-colors",
            selectedSet.has(track.id) ? "bg-accent/20" : "",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-start gap-2">
              <input
                type="checkbox"
                checked={selectedSet.has(track.id)}
                onChange={() =>
                  setSelectedIds((current) => toggleSelection(current, track.id))
                }
                className="border-border bg-background mt-0.5 h-4 w-4 rounded"
                aria-label={`Seleccionar track ${track.title ?? track.id}`}
              />
              <div className="min-w-0">
                <Link
                  href={`/admin/tracks/${track.id}/edit`}
                  className="text-foreground block truncate text-sm font-semibold hover:underline"
                >
                  {track.title || "(sin título)"}
                </Link>
                <p className="text-muted-foreground truncate text-xs">
                  {track.artist || "(sin artista)"}
                </p>
                <p className="text-muted-foreground mt-1 font-mono text-[10px] break-all">
                  ID: {track.id}
                </p>
              </div>
            </div>

            <div className="shrink-0">{statusBadge(track)}</div>
          </div>

          <div className="border-border/60 space-y-2 border-t pt-2">
            <MetadataSummary row={track} />
            <AudioInfo row={track} />
          </div>

          <div className="border-border/60 border-t pt-2">{analysisBadge(track)}</div>

          <div className="border-border/60 border-t pt-2">
            <AnalyzeActions
              id={track.id}
              audioUrl={track.audioUrl}
              iconOnly
              className="w-full justify-start"
            />
          </div>
        </article>
      )}
    />
  );
}

function AudioInfo({ row }: { row: TrackListRow }) {
  const hasAnalysis =
    typeof row.loudnessLufs === "number" ||
    typeof row.loudnessRangeLu === "number" ||
    typeof row.truePeakDbfs === "number" ||
    typeof row.durationSec === "number" ||
    typeof row.sampleRateHz === "number";

  if (!hasAnalysis) {
    return (
      <span className="text-muted-foreground text-xs">
        Sin análisis. Usa <span className="font-semibold">Analizar</span>.
      </span>
    );
  }

  const lufs =
    typeof row.loudnessLufs === "number" ? row.loudnessLufs.toFixed(2) : null;
  const lra =
    typeof row.loudnessRangeLu === "number"
      ? row.loudnessRangeLu.toFixed(2)
      : null;
  const tp =
    typeof row.truePeakDbfs === "number" ? row.truePeakDbfs.toFixed(2) : null;

  const dur =
    typeof row.durationSec === "number"
      ? `${Math.round(row.durationSec)} s`
      : null;
  const sr =
    typeof row.sampleRateHz === "number" ? `${row.sampleRateHz} Hz` : null;

  return (
    <div className="text-foreground flex flex-col space-y-1 text-[11px]">
      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
        <span className="font-mono">LUFS: {lufs ?? "–"}</span>
        <span className="font-mono">LRA: {lra ?? "–"}</span>
        <span className="font-mono">TP: {tp ?? "–"}</span>
      </div>

      <div className="text-muted-foreground flex flex-wrap gap-x-2 gap-y-0.5">
        <span>{dur ? `Dur: ${dur}` : "Dur: –"}</span>
        <span>{sr ? `SR: ${sr}` : "SR: –"}</span>
      </div>
    </div>
  );
}

function MetadataSummary({ row }: { row: TrackListRow }) {
  const moods = formatListShort(row.moodNames);
  const genres = formatListShort(row.genres);
  const licenseTypeLabel = formatLicenseType(row.licenseType);
  const mediaBuyLine = formatText(row.mediaBuy);

  return (
    <div className="text-muted-foreground flex flex-col space-y-1 text-[11px]">
      <span className="line-clamp-2">Moods: {moods ?? "—"}</span>
      <span className="line-clamp-2">Género: {genres ?? "—"}</span>
      <span className="line-clamp-2">
        Tipo de licencia: {licenseTypeLabel ?? "—"}
      </span>
      <span className="line-clamp-2">Media buy: {mediaBuyLine ?? "—"}</span>
    </div>
  );
}

function formatDateTime(iso: string) {
  return formatStableSantiagoDateTime(iso);
}

function formatText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function formatListShort(
  values: string[] | null | undefined,
  maxItems = 3,
): string | null {
  if (!Array.isArray(values) || values.length === 0) return null;
  const cleaned = values.map((value) => value.trim()).filter(Boolean);
  if (cleaned.length === 0) return null;
  if (cleaned.length <= maxItems) return cleaned.join(", ");
  const remaining = cleaned.length - maxItems;
  return `${cleaned.slice(0, maxItems).join(", ")} +${remaining}`;
}

function formatLicenseType(value: string | null | undefined) {
  if (!value) return null;
  switch (value) {
    case "NON_EXCLUSIVE":
      return "No exclusiva";
    case "EXCLUSIVE":
      return "Exclusiva";
    case "LIMITED_EXCLUSIVE":
      return "Exclusiva limitada";
    case "BUYOUT":
      return "Buyout";
    default:
      return value;
  }
}
