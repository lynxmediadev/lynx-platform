/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ API: POST /admin/licensing/[id]/status                                     │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Next 15: hay que AWAIT `params`.                                          │
 * │ - Recibe { status } y lo valida contra la whitelist antes de guardar.       │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRouteAdminOrStaff } from "@/lib/account-auth/route-guards";

const ALLOWED = new Set([
  "NEW",
  "IN_REVIEW",
  "QUOTED",
  "CLOSED_WON",
  "CLOSED_LOST",
]);

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }, // 👈 params Promise
) {
  if (!(await requireRouteAdminOrStaff())) {
    return NextResponse.json(
      { ok: false, error: "No autorizado" },
      { status: 401 },
    );
  }
  try {
    // ✅ Aguardar params antes de usar
    const { id } = await ctx.params;

    const body = (await req.json()) as { status?: string };
    const next = String(body?.status ?? "").toUpperCase();

    if (!ALLOWED.has(next)) {
      return NextResponse.json(
        { ok: false, error: "Estado inválido" },
        { status: 400 },
      );
    }

    await prisma.licensingRequest.update({
      where: { id },
      data: { status: next as any },
    });

    revalidatePath("/admin/licensing");
    revalidatePath(`/admin/licensing/${id}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[status:update] error:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo actualizar el estado" },
      { status: 500 },
    );
  }
}
