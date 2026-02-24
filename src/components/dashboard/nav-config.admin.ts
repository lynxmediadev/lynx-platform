import {
  BriefcaseBusiness,
  ClipboardList,
  FolderKanban,
  Gavel,
  Home,
  LifeBuoy,
  Library,
  Megaphone,
  Music2,
  ScrollText,
  Settings,
  Shield,
  SlidersHorizontal,
  UserCircle2,
} from "lucide-react";

import type { DashboardSection } from "./types";
import type { UserRole } from "@prisma/client";

export const adminDashboardSections: DashboardSection[] = [
  {
    id: "general",
    label: "General",
    items: [
      {
        id: "overview",
        label: "Overview",
        href: "/admin",
        icon: Home,
        section: "general",
        exact: true,
      },
      {
        id: "account",
        label: "Account",
        href: "/admin/account",
        icon: UserCircle2,
        section: "general",
      },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    items: [
      {
        id: "tracks",
        label: "Tracks",
        href: "/admin/tracks",
        icon: Music2,
        section: "workspace",
      },
      {
        id: "uploads",
        label: "Uploads",
        href: "/admin/uploads",
        icon: SlidersHorizontal,
        section: "workspace",
      },
      {
        id: "playlists",
        label: "Playlists",
        href: "/admin/playlists",
        icon: Library,
        section: "workspace",
      },
      {
        id: "sound-kits",
        label: "Sound Kits",
        href: "/admin/sound-kits",
        icon: FolderKanban,
        section: "workspace",
      },
      {
        id: "services",
        label: "Services",
        href: "/admin/services",
        icon: BriefcaseBusiness,
        section: "workspace",
      },
      {
        id: "showcase",
        label: "Showcase",
        href: "/admin/showcase",
        icon: Megaphone,
        section: "workspace",
      },
    ],
  },
  {
    id: "licensing",
    label: "Licensing",
    items: [
      {
        id: "licensing-requests",
        label: "Licensing",
        href: "/admin/licensing",
        icon: ClipboardList,
        section: "licensing",
      },
      {
        id: "contracts",
        label: "Contracts",
        href: "/admin/contracts",
        icon: Gavel,
        section: "licensing",
      },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      {
        id: "inbound-requests",
        label: "Requests",
        href: "/admin/requests",
        icon: ScrollText,
        section: "system",
      },
      {
        id: "tickets",
        label: "Tickets",
        href: "/admin/tickets",
        icon: LifeBuoy,
        section: "system",
      },
      {
        id: "audit-log",
        label: "Audit Log",
        href: "/admin/audit-log",
        icon: Shield,
        section: "system",
      },
      {
        id: "settings",
        label: "Settings",
        href: "/admin/settings",
        icon: Settings,
        section: "system",
      },
      {
        id: "users",
        label: "Users",
        href: "/admin/users",
        icon: UserCircle2,
        section: "system",
      },
      {
        id: "roles",
        label: "Roles",
        href: "/admin/users/roles",
        icon: UserCircle2,
        section: "system",
        exact: true,
      },
    ],
  },
];

export function getAdminDashboardSectionsForRole(role: UserRole | null | undefined) {
  if (role === "ADMIN") return adminDashboardSections;

  if (role === "STAFF") {
    return adminDashboardSections.map((section) => ({
      ...section,
      items: section.items.filter((item) => item.id !== "users" && item.id !== "roles"),
    }));
  }

  return adminDashboardSections.map((section) => ({
    ...section,
    items: [],
  }));
}
