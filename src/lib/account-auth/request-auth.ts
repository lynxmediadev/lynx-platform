import "server-only";
import { NextRequest } from "next/server";
import { verifyAdminTokenV1 } from "@/lib/auth";
import { allowsLegacyAuth } from "@/lib/account-auth/mode";
import { getAuthenticatedRequestUser } from "@/lib/account-auth/principal";
import { prisma } from "@/lib/prisma";

type AuthRequestUser =
  | {
      id: string;
      role: "ADMIN" | "STAFF" | "CREATOR" | "CLIENT";
      source: "session" | "supabase";
    }
  | { id: string | null; role: "ADMIN"; source: "legacy" };

export async function getRequestAuthUser(
  req: NextRequest,
): Promise<AuthRequestUser | null> {
  const user = await getAuthenticatedRequestUser(req);
  if (user) {
    return {
      id: user.id,
      role: user.role,
      source: req.cookies.get("app_session") ? "session" : "supabase",
    };
  }

  const legacySecret =
    (process.env.ADMIN_SESSION_SECRET ?? "").trim() ||
    (process.env.AUTH_SESSION_SECRET ?? "").trim();
  if (allowsLegacyAuth() && legacySecret) {
    const legacyRaw = req.cookies.get("admin_session")?.value ?? "";
    const payload = verifyAdminTokenV1(legacyRaw, legacySecret);
    if (payload?.sub === "admin") {
      return { id: null, role: "ADMIN", source: "legacy" };
    }
  }

  return null;
}

export async function canAccessTrackByRole(
  user: AuthRequestUser,
  trackId: string,
): Promise<boolean> {
  if (user.role === "ADMIN" || user.role === "STAFF") return true;
  if (!user.id) return false;

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    select: { ownerUserId: true },
  });
  if (!track) return false;
  return track.ownerUserId === user.id;
}
