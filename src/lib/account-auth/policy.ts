import type { UserRole, UserStatus } from "@prisma/client";

export type AuthorizableUser = {
  role: UserRole;
  status: UserStatus;
};

export function isActiveUser(user: AuthorizableUser | null | undefined) {
  return user?.status === "ACTIVE";
}

export function hasActiveRole(
  user: AuthorizableUser | null | undefined,
  roles: readonly UserRole[],
) {
  return isActiveUser(user) && roles.includes(user!.role);
}

export function getSafeRedirectByRole(
  role: UserRole,
  requestedNext: string | null,
) {
  if (requestedNext?.startsWith("/") && !requestedNext.startsWith("//")) {
    if (role === "CREATOR" && requestedNext.startsWith("/creator"))
      return requestedNext;
    if (
      (role === "ADMIN" || role === "STAFF") &&
      requestedNext.startsWith("/admin")
    ) {
      return requestedNext;
    }
    if (
      role === "CLIENT" &&
      !requestedNext.startsWith("/admin") &&
      !requestedNext.startsWith("/creator")
    ) {
      return requestedNext;
    }
  }

  if (role === "CREATOR") return "/creator/tracks";
  if (role === "CLIENT") return "/";
  return "/admin/tracks";
}
