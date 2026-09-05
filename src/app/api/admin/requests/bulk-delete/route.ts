import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireRouteAdmin } from "@/lib/account-auth/route-guards";

const payloadSchema = z.object({
  ids: z.array(z.string()).min(1).max(200),
});

export async function POST(req: NextRequest) {
  const user = await requireRouteAdmin();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.format() },
      { status: 400 },
    );
  }

  const { ids } = parsed.data;
  const result = await prisma.contactRequest.deleteMany({
    where: { id: { in: ids } },
  });

  return NextResponse.json({ ok: true, deleted: result.count });
}
