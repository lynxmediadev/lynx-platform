import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { allowsLegacyAuth } from "@/lib/account-auth/mode";
import { getAuthenticatedAppUser } from "@/lib/account-auth/principal";
import { verifyAdminTokenV1 } from "@/lib/auth";

async function getLegacyRouteAdmin() {
  if (!allowsLegacyAuth()) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value ?? "";
  const secret =
    (process.env.ADMIN_SESSION_SECRET ?? "").trim() ||
    (process.env.AUTH_SESSION_SECRET ?? "").trim();
  const payload = secret ? verifyAdminTokenV1(token, secret) : null;
  return payload?.sub === "admin"
    ? { id: "legacy-admin", role: "ADMIN" as const }
    : null;
}

export async function getRouteUser() {
  const user = await getAuthenticatedAppUser();
  if (user) return user;
  return getLegacyRouteAdmin();
}

export async function requireRouteAdmin() {
  const user = await getRouteUser();
  if (user?.role === "ADMIN") return user;
  return null;
}

export async function requireRouteAdminOrStaff() {
  const user = await getRouteUser();
  if (user && (user.role === "ADMIN" || user.role === "STAFF")) return user;
  return null;
}

export function safeRouteRedirect(req: NextRequest, path: string) {
  const url = new URL(path, req.url);
  if (url.hostname === "0.0.0.0") {
    url.hostname = "localhost";
  }
  return url;
}
