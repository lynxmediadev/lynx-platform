/**
 * API: POST /admin/licensing/[id]/follow-up
 * - Guarda nextFollowUpAt (ISO) o limpia (null).
 * - Revalida listado+detalle.
 * - Dispara sync a Sheets con reason "followup.updated".
 */
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { sendLicensingSync } from "@/lib/sync";
import { requireRouteAdminOrStaff } from "@/lib/account-auth/route-guards";

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
    const body = (await req.json()) as { nextFollowUpAt?: string | null };

    let value: Date | null = null;
    if (typeof body.nextFollowUpAt === "string" && body.nextFollowUpAt.trim()) {
      const d = new Date(body.nextFollowUpAt);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json(
          { ok: false, error: "Fecha/hora inválida" },
          { status: 400 },
        );
      }
      value = d;
    }

    await prisma.licensingRequest.update({
      where: { id },
      data: { nextFollowUpAt: value },
    });

    revalidatePath("/admin/licensing");
    revalidatePath(`/admin/licensing/${id}`);

    await sendLicensingSync(id, "followup.updated", "admin");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[followup:update] error:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo actualizar el follow-up" },
      { status: 500 },
    );
  }
}
