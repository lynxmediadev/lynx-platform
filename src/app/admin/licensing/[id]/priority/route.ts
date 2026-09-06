/**
 * API: POST /admin/licensing/[id]/priority
 * - Guarda prioridad (LOW|MEDIUM|HIGH).
 * - Revalida listado+detalle.
 * - Dispara sync a Sheets con reason "priority.updated".
 */
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { sendLicensingSync } from "@/lib/sync";
import { requireRouteAdminOrStaff } from "@/lib/account-auth/route-guards";

const ALLOWED = new Set(["LOW", "MEDIUM", "HIGH"]);

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await requireRouteAdminOrStaff())) {
    return NextResponse.json(
      { ok: false, error: "No autorizado" },
      { status: 401 },
    );
  }
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as { priority?: string };
    const next = String(body?.priority ?? "").toUpperCase();
    if (!ALLOWED.has(next)) {
      return NextResponse.json(
        { ok: false, error: "Prioridad inválida" },
        { status: 400 },
      );
    }

    await prisma.licensingRequest.update({
      where: { id },
      data: { priority: next as any },
    });

    revalidatePath("/admin/licensing");
    revalidatePath(`/admin/licensing/${id}`);

    await sendLicensingSync(id, "priority.updated", "admin");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[priority:update] error:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo actualizar la prioridad" },
      { status: 500 },
    );
  }
}
