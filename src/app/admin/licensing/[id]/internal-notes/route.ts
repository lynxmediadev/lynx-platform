/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ API: POST /admin/licensing/[id]/internal-notes                              │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Recibe { internalNotes: string }.                                         │
 * │ - Trim y límite razonable (~20k chars). Vacío => NULL.                      │
 * │ - Next 15: `params` es Promise; hacemos `await` antes de usar `id`.         │
 * │ - Protegida por middleware /admin/* (tu auth actual).                        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRouteAdminOrStaff } from "@/lib/account-auth/route-guards";

const MAX_LEN = 20000; // límite suave para evitar basura enorme

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }, // Next 15
) {
  if (!(await requireRouteAdminOrStaff())) {
    return NextResponse.json(
      { ok: false, error: "No autorizado" },
      { status: 401 },
    );
  }
  try {
    const { id } = await ctx.params;

    const body = (await req.json()) as { internalNotes?: string };
    const raw = (body.internalNotes ?? "").trim();

    if (raw.length > MAX_LEN) {
      return NextResponse.json(
        {
          ok: false,
          error: `Notas demasiado largas (máx. ${MAX_LEN} caracteres)`,
        },
        { status: 400 },
      );
    }

    await prisma.licensingRequest.update({
      where: { id },
      data: { internalNotes: raw.length ? raw : null },
    });

    // ... después del prisma.update({ ... })
    revalidatePath("/admin/licensing");
    revalidatePath(`/admin/licensing/${id}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[internal-notes:update] error:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo actualizar las notas internas" },
      { status: 500 },
    );
  }
}
