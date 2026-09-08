"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAdminOrStaffAction } from "@/lib/account-auth/guards";

const ALLOWED = new Set(["MP3", "WAV", "STEMS", "TRACKOUTS", "INSTRUMENTAL", "ALT_MIX", "CUTDOWNS"]);

export async function updateDeliveryFormats(formData: FormData) {
  try { await requireAdminOrStaffAction(); } catch { return { ok: false, message: "No autorizado." }; }
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, message: "Falta el track." };
  const formats = [...new Set(formData.getAll("deliveryFormats").map(String).filter((value) => ALLOWED.has(value)))];
  await prisma.track.update({ where: { id }, data: { deliveryFormats: formats } });
  revalidatePath(`/admin/tracks/${id}/edit/metadata`);
  revalidatePath(`/admin/tracks/${id}/edit`);
  return { ok: true, message: "Formatos comerciales actualizados." };
}
