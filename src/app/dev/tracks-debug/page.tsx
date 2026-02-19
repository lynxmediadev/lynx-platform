/**
 * Título: Dev · Tracks Debug (paginación por cursor + orden + filtros)
 * Qué hace: Página CLIENT para probar GET /api/tracks con limit, q, moods, uses, order, dir y cursor.
 * Peras y manzanas: Visita /dev/tracks-debug, ajusta filtros y usa “Siguiente”.
 */
"use client";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ListItem = { id: string; title: string; artist: string; coverUrl?: string | null; moods: string[]; uses: string[] };
type ListResp = { items: ListItem[]; nextCursor: string | null; totalCount: number };
const ORDER_FIELDS = ["createdAt", "title", "artist"] as const;
type OrderField = (typeof ORDER_FIELDS)[number];
const ORDER_DIRS = ["asc", "desc"] as const;
type OrderDir = (typeof ORDER_DIRS)[number];
function parseCSV(v: string) { return v.split(",").map(s=>s.trim()).filter(Boolean); }

function TracksDebugPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [limit, setLimit] = useState(() => {
    const n = Number(sp.get("limit") ?? "5");
    return Number.isFinite(n) && n > 0 ? Math.min(Math.max(n, 1), 100) : 5;
  });
  const [moodsStr, setMoodsStr] = useState(sp.get("moods") ?? "");
  const [usesStr, setUsesStr] = useState(sp.get("uses") ?? "");
  const [order, setOrder] = useState<OrderField>((sp.get("order") as OrderField) ?? "createdAt");
  const [dir, setDir] = useState<OrderDir>((sp.get("dir") as OrderDir) ?? "desc");
  const [data, setData] = useState<ListResp | null>(null);
  const [cursor, setCursor] = useState<string | null>(sp.get("cursor"));
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const buildQS = useCallback((cursorOverride?: string | null) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("limit", String(limit));
    if (order) params.set("order", order);
    if (dir) params.set("dir", dir);
    params.set("view", "list");
    for (const m of parseCSV(moodsStr)) params.append("mood", m);
    for (const u of parseCSV(usesStr)) params.append("use", u);
    const c = cursorOverride ?? cursor;
    if (c) params.set("cursor", c);
    return params.toString();
  }, [q, limit, order, dir, moodsStr, usesStr, cursor]);

  const pushUrl = useCallback((cursorOverride?: string | null) => {
    const qs = buildQS(cursorOverride);
    router.replace(`/dev/tracks-debug?${qs}`);
  }, [buildQS, router]);

  const fetchPage = useCallback(async (cursorOverride?: string | null) => {
    setIsLoading(true); setErr(null);
    try {
      const qs = buildQS(cursorOverride);
      const res = await fetch(`/api/tracks?${qs}`, { headers: { accept: "application/json" }, cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const json = (await res.json()) as ListResp;
      setData(json);
      setCursor(cursorOverride ?? null);
      pushUrl(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  }, [buildQS, pushUrl]);

  useEffect(() => {
    setCursor(null);
    void fetchPage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, limit, order, dir, moodsStr, usesStr]);

  const moods = useMemo(() => parseCSV(moodsStr), [moodsStr]);
  const uses = useMemo(() => parseCSV(usesStr), [usesStr]);

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dev · Tracks Debug</h1>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium">Búsqueda (q)</label>
          <input className="w-full rounded-md border px-3 py-2 bg-transparent" placeholder="Título o artista" value={q} onChange={(e)=>setQ(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Moods (CSV)</label>
          <input className="w-full rounded-md border px-3 py-2 bg-transparent" placeholder="Epic,Emotional,Elegant" value={moodsStr} onChange={(e)=>setMoodsStr(e.target.value)} />
          <p className="text-xs opacity-70">Interpretado como: {moods.join(" · ") || "—"}</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Uses (CSV)</label>
          <input className="w-full rounded-md border px-3 py-2 bg-transparent" placeholder="TV,Cine,Publicidad" value={usesStr} onChange={(e)=>setUsesStr(e.target.value)} />
          <p className="text-xs opacity-70">Interpretado como: {uses.join(" · ") || "—"}</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Limit</label>
          <input type="number" min={1} max={100} className="w-full rounded-md border px-3 py-2 bg-transparent" value={limit} onChange={(e)=>setLimit(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Order</label>
          <select className="w-full rounded-md border px-3 py-2 bg-transparent" value={order} onChange={(e)=>setOrder(e.target.value as OrderField)}>
            {ORDER_FIELDS.map((f)=>(<option key={f} value={f}>{f}</option>))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Dir</label>
          <select className="w-full rounded-md border px-3 py-2 bg-transparent" value={dir} onChange={(e)=>setDir(e.target.value as OrderDir)}>
            {ORDER_DIRS.map((d)=>(<option key={d} value={d}>{d}</option>))}
          </select>
        </div>
        <div className="md:col-span-3 flex gap-3">
          <button className="rounded-md border px-4 py-2" onClick={()=>fetchPage(null)} disabled={isLoading}>
            {isLoading ? "Cargando…" : "Buscar (página 1)"}
          </button>
          <button className="rounded-md border px-4 py-2" onClick={()=>fetchPage(data?.nextCursor ?? null)} disabled={isLoading || !data?.nextCursor} title={data?.nextCursor ?? undefined}>
            Siguiente {data?.nextCursor ? `(${data.nextCursor})` : ""}
          </button>
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-sm"><strong>totalCount:</strong> {data?.totalCount ?? "—"}</p>
        <p className="text-sm"><strong>nextCursor:</strong> {data?.nextCursor ?? "null"}</p>
        {err ? <p className="text-sm text-red-500">Error: {err}</p> : null}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data?.items ?? []).map((t) => (
          <article key={t.id} className="rounded-lg border p-4 space-y-2">
            <div className="text-sm opacity-70">{t.id}</div>
            <h3 className="font-semibold">{t.title}</h3>
            <p className="opacity-80">{t.artist}</p>
            {t.coverUrl ? (<img src={t.coverUrl} alt={t.title} className="mt-2 w-full h-40 object-cover rounded-md" />) : null}
            <div className="text-xs opacity-70"><strong>Moods:</strong> {t.moods.join(" · ") || "—"}</div>
            <div className="text-xs opacity-70"><strong>Uses:</strong> {t.uses.join(" · ") || "—"}</div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default function TracksDebugPage() {
  return (
    <Suspense fallback={<main className="p-6"><p className="text-sm opacity-70">Cargando debug...</p></main>}>
      <TracksDebugPageInner />
    </Suspense>
  );
}
