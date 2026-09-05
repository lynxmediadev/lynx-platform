/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ /admin/licensing (Server Component)                                         │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Objetivo                                                                    │
 * │ - Renderizar la bandeja de “Licensing Requests” con filtros y paginación.   │
 * │ - Construir las opciones de STATUS y PRIORITY leyendo el enum real de BD    │
 * │   vía Prisma.RequestStatus / Prisma.RequestPriority (¡sin hardcode!).       │
 * │ - Evitar hydration mismatch: enviar FECHAS como timestamps/ISO y formatear  │
 * │   en el Client Component.                                                   │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Aquí NO formateamos fechas en HTML SSR: sólo pasamos números/ISO.         │
 * │ - El filtro de “status” se normaliza desde el query string a enum real.     │
 * │ - Los dropdowns se pintan en el cliente con las opciones recibidas.         │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import { Prisma, RequestPriority, RequestStatus } from "@prisma/client";
import type { Metadata } from "next";
import LicensingAdminClient from "./_client"; // Client Component (UI y filtro)
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export const metadata: Metadata = { title: "Licensing — Admin" };
export const dynamic = "force-dynamic";

// Utilidad: parseo seguro de searchParams en Next 15 (debe ser awaited)
type SearchDict = Record<string, string | string[] | undefined>;

function first(v?: string | string[]) {
  return Array.isArray(v) ? v[0] : v;
}

// Normaliza el status del query hacia el enum real (resistente a minúsculas)
function normalizeStatusFromQS(
  value: string | undefined,
): RequestStatus | undefined {
  if (!value) return undefined;
  const raw = value.trim();
  // Case-insensitive directo
  const upper = raw.toUpperCase();
  if ((RequestStatus as any)[upper]) {
    return (RequestStatus as any)[upper] as RequestStatus;
  }
  // Map legacy -> enum actual
  const legacyMap: Record<string, RequestStatus> = {
    OPEN: RequestStatus.NEW,
    "IN-PROGRESS": RequestStatus.IN_REVIEW,
    IN_PROGRESS: RequestStatus.IN_REVIEW,
  };
  const mapped = legacyMap[upper];
  return mapped ?? undefined; // si no calza, omitimos filtro
}

function normalizePriorityFromQS(
  value: string | undefined,
): RequestPriority | undefined {
  if (!value) return undefined;
  const raw = value.trim();
  if ((RequestPriority as any)[raw]) {
    return (RequestPriority as any)[raw] as RequestPriority;
  }
  const upper = raw.toUpperCase();
  if ((RequestPriority as any)[upper]) {
    return (RequestPriority as any)[upper] as RequestPriority;
  }
  return undefined;
}

export default async function Page(props: {
  searchParams: Promise<SearchDict>;
}) {
  // 🔐 (opcional) gate muy simple: demuestra cómo podrías requerir cookie/sesión
  await cookies();

  const sp = await props.searchParams;

  // ---- Filtros / paginación desde URL (con defensas) ----
  const q = (first(sp.q) ?? "").trim();

  const statusEnum = normalizeStatusFromQS(first(sp.status));
  const priorityEnum = normalizePriorityFromQS(first(sp.priority));

  const page = Math.max(1, parseInt(first(sp.page) ?? "1", 10) || 1);
  const per = Math.min(
    100,
    Math.max(1, parseInt(first(sp.per) ?? "20", 10) || 20),
  );
  const skip = (page - 1) * per;

  // Fechas de seguimiento (seguimos enviando ISO, no locales)
  const fupFromISO = first(sp.fupFrom) ?? "";
  const fupToISO = first(sp.fupTo) ?? "";
  const fupFrom = fupFromISO ? new Date(fupFromISO) : undefined;
  const fupTo = fupToISO ? new Date(fupToISO) : undefined;

  // Construcción del WHERE dinámico (solo agregamos filtros presentes)
  const whereAND: Prisma.LicensingRequestWhereInput[] = [];
  if (q) {
    whereAND.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
        { trackTitle: { contains: q, mode: "insensitive" } },
        { trackArtist: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (statusEnum) {
    // 👇 ahora usamos equals con el enum real (no arrays in/strings)
    whereAND.push({ status: { equals: statusEnum } });
  }
  if (priorityEnum) {
    whereAND.push({ priority: { equals: priorityEnum } });
  }
  if (fupFrom || fupTo) {
    whereAND.push({
      nextFollowUpAt: {
        ...(fupFrom ? { gte: fupFrom } : {}),
        ...(fupTo ? { lte: fupTo } : {}),
      },
    });
  }

  const where: Prisma.LicensingRequestWhereInput = whereAND.length
    ? { AND: whereAND }
    : {};

  // Orden: primero follow-up (earliest), luego fecha de creación desc
  const orderBy: Prisma.LicensingRequestOrderByWithRelationInput[] = [
    { nextFollowUpAt: "asc" },
    { createdAt: "desc" },
  ];

  // Leemos opciones de filtro desde los enums reales de Prisma
  const STATUS_OPTIONS = Object.values(RequestStatus) as string[];
  const PRIORITY_OPTIONS = Object.values(RequestPriority) as string[];

  // --- Query principal ---
  let rows = [];
  let total = 0;
  // Contadores “resumen” (overdue/today/tomorrow/week) también sin hardcode
  let cOverdue = 0,
    cToday = 0,
    cTomorrow = 0,
    cWeek = 0;

  try {
    const [list, countAll, overdue, today, tomorrow, week] = await Promise.all([
      prisma.licensingRequest.findMany({
        where,
        orderBy,
        take: per,
        skip,
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          assignee: true,
          name: true,
          email: true,
          company: true,
          projectType: true,
          media: true,
          territories: true,
          term: true,
          budgetAmount: true,
          budgetCurrency: true,
          mfn: true,
          needWhitelist: true,
          notes: true,
          trackId: true,
          trackTitle: true,
          trackArtist: true,
          trackDurationSec: true,
          moods: true,
          uses: true,
          restrictions: true,
          pageUrl: true,
          status: true,
          internalNotes: true,
          priority: true,
          nextFollowUpAt: true,
        },
      }),
      prisma.licensingRequest.count({ where }),
      prisma.licensingRequest.count({
        where: { nextFollowUpAt: { lt: new Date() } },
      }),
      prisma.licensingRequest.count({
        where: {
          nextFollowUpAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.licensingRequest.count({
        where: {
          nextFollowUpAt: {
            gte: new Date(new Date().setDate(new Date().getDate() + 1)),
            lte: new Date(new Date().setDate(new Date().getDate() + 1)),
          },
        },
      }),
      prisma.licensingRequest.count({
        where: {
          nextFollowUpAt: {
            gte: new Date(),
            lte: new Date(new Date().setDate(new Date().getDate() + 7)),
          },
        },
      }),
    ]);

    // 🔎 Evitamos hydration mismatch: convertimos Date→number (ms)
    rows = list.map((r) => ({
      ...r,
      createdAt: r.createdAt?.getTime?.() ?? null,
      updatedAt: r.updatedAt?.getTime?.() ?? null,
      nextFollowUpAt: r.nextFollowUpAt?.getTime?.() ?? null,
      territories: Array.isArray(r.territories)
        ? r.territories
        : typeof r.territories === "string" && r.territories.trim().length
          ? r.territories
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
    }));

    total = countAll;
    cOverdue = overdue;
    cToday = today;
    cTomorrow = tomorrow;
    cWeek = week;
  } catch {
    // Si algo falla, dejamos todo vacío y pasamos el error al cliente para mostrar banner
    return (
      <LicensingAdminClient
        rows={[]}
        totals={{ total: 0, cOverdue: 0, cToday: 0, cTomorrow: 0, cWeek: 0 }}
        errorMsg={
          "No se pudo cargar desde la base de datos. Verifica migraciones y Prisma Client."
        }
        statusOptions={STATUS_OPTIONS}
        priorityOptions={PRIORITY_OPTIONS}
        initialQS={{
          q,
          status: first(sp.status) ?? "",
          priority: first(sp.priority) ?? "",
          fupFrom: fupFromISO,
          fupTo: fupToISO,
          page,
          per,
        }}
      />
    );
  }

  return (
    <LicensingAdminClient
      rows={rows}
      totals={{ total, cOverdue, cToday, cTomorrow, cWeek }}
      errorMsg={null}
      statusOptions={STATUS_OPTIONS}
      priorityOptions={PRIORITY_OPTIONS}
      initialQS={{
        q,
        status: first(sp.status) ?? "",
        priority: first(sp.priority) ?? "",
        fupFrom: fupFromISO,
        fupTo: fupToISO,
        page,
        per,
      }}
    />
  );
}
