// src/app/admin/licensing/export/route.ts
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Export CSV de solicitudes de licencia                                       │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Esta ruta GET genera un CSV con las solicitudes filtradas.                │
 * │ - Incluye los campos: id, createdAt, status, assignee, name, email, etc.    │
 * │ - Soporta los mismos filtros del listado:                                   │
 * │     q, from, to, whitelist, mfn, status, assignee, order, limit             │
 * │ - IMPORTANTE: ya agrega "assignee" al header y su valor en cada fila.       │
 * │ - Seguridad: va bajo /admin/* y hereda tu middleware (Basic/Key).           │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRouteAdminOrStaff } from "@/lib/account-auth/route-guards";

/** Escapa valores para CSV (comillas y saltos de línea) */
function csvEscape(s: string) {
  const needs = /[",\n]/.test(s);
  const v = s.replace(/"/g, '""');
  return needs ? `"${v}"` : v;
}

/** "YYYY-MM-DD" → Date al inicio o fin del día (local) */
function parseDateBoundary(s?: string, end = false): Date | undefined {
  if (!s) return undefined;
  const parts = s.split("-").map((v) => parseInt(v, 10));
  if (parts.length < 3) return undefined;
  const [y, m, d] = parts as [number, number, number];
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d))
    return undefined;
  const dt = new Date(
    y,
    m - 1,
    d,
    end ? 23 : 0,
    end ? 59 : 0,
    end ? 59 : 0,
    end ? 999 : 0,
  );
  return isNaN(dt.getTime()) ? undefined : dt;
}

const ALLOWED_STATUS = new Set([
  "NEW",
  "IN_REVIEW",
  "QUOTED",
  "CLOSED_WON",
  "CLOSED_LOST",
]);

export async function GET(req: NextRequest) {
  if (!(await requireRouteAdminOrStaff())) {
    return NextResponse.json(
      { ok: false, error: "No autorizado" },
      { status: 401 },
    );
  }
  // ───────────────────────── Lee querystring ─────────────────────────
  const { searchParams } = new URL(req.url);
  const get = (k: string) => (searchParams.get(k) || "").trim();

  const q = get("q");
  const from = get("from");
  const to = get("to");
  const whitelist = get("whitelist"); // "1" para true
  const mfn = get("mfn"); // "1" para true
  const status = get("status").toUpperCase();
  const assignee = get("assignee");
  const order = (get("order").toLowerCase() === "asc" ? "asc" : "desc") as
    | "asc"
    | "desc";

  const limitNum = parseInt(get("limit") || "1000", 10);
  const limit = Math.min(
    Math.max(Number.isFinite(limitNum) ? limitNum : 1000, 1),
    5000,
  );

  // ───────────────────────── Construye el filtro ─────────────────────
  const where: any = {};

  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { company: { contains: q, mode: "insensitive" } },
      { projectType: { contains: q, mode: "insensitive" } },
      { trackTitle: { contains: q, mode: "insensitive" } },
      { trackArtist: { contains: q, mode: "insensitive" } },
    ];
  }

  const gte = parseDateBoundary(from, false);
  const lte = parseDateBoundary(to, true);
  if (gte || lte) {
    where.createdAt = {};
    if (gte) where.createdAt.gte = gte;
    if (lte) where.createdAt.lte = lte;
  }

  if (whitelist === "1") where.needWhitelist = true;
  if (mfn === "1") where.mfn = true;
  if (status && ALLOWED_STATUS.has(status)) where.status = status;
  if (assignee) where.assignee = { contains: assignee, mode: "insensitive" };

  // ───────────────────────── Consulta a BD ───────────────────────────
  const rows = await prisma.licensingRequest.findMany({
    where,
    orderBy: { createdAt: order },
    take: limit,
  });

  // ───────────────────────── CSV: encabezado ─────────────────────────
  // 👇 AQUI se incluye "assignee" (y "status" también, por si no estaba).
  const header = [
    "id",
    "createdAt",
    "status",
    "assignee",
    "internalNotes",
    "name",
    "email",
    "company",
    "projectType",
    "media",
    "territories",
    "term",
    "budgetAmount",
    "budgetCurrency",
    "mfn",
    "needWhitelist",
    "notes",
    "trackId",
    "trackTitle",
    "trackArtist",
    "trackDurationSec",
    "moods",
    "uses",
    "restrictions",
    "pageUrl",
  ];

  // ───────────────────────── CSV: filas ──────────────────────────────
  const lines = rows.map((r) =>
    [
      r.id,
      r.createdAt.toISOString(),
      (r as any).status ?? "", // ← status (enum en Prisma)
      r.assignee ?? "", // ← assignee (AHORA INCLUIDO)
      (r.internalNotes ?? "").replace(/\r?\n/g, " "), // ⬅️ NUEVO (plano para CSV)
      r.name,
      r.email,
      r.company ?? "",
      r.projectType,
      r.media ?? "",
      r.territories ?? "",
      r.term ?? "",
      r.budgetAmount?.toString() ?? "",
      r.budgetCurrency ?? "",
      r.mfn ? "1" : "0",
      r.needWhitelist ? "1" : "0",
      (r.notes ?? "").replace(/\r?\n/g, " "),
      r.trackId,
      r.trackTitle ?? "",
      r.trackArtist ?? "",
      r.trackDurationSec?.toString() ?? "",
      (r.moods || []).join("|"),
      (r.uses || []).join("|"),
      (r.restrictions || []).join("|"),
      r.pageUrl ?? "",
    ]
      .map((v) => csvEscape(String(v)))
      .join(","),
  );

  const csv = [header.join(","), ...lines].join("\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="licensing-requests.csv"',
    },
  });
}
