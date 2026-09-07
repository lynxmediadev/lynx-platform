import {
  BriefcaseBusiness,
  ClipboardList,
  FileText,
  FolderKanban,
  Gavel,
  Home,
  LifeBuoy,
  Library,
  Megaphone,
  Music2,
  ScrollText,
  SlidersHorizontal,
  UserCircle2,
} from "lucide-react";

import type { DashboardSection } from "./types";
import type { UserRole } from "@prisma/client";

export const adminDashboardSections: DashboardSection[] = [
  {
    id: "general",
    label: "Inicio",
    items: [
      {
        id: "overview",
        label: "Panel principal",
        href: "/admin",
        icon: Home,
        section: "general",
        exact: true,
      },
      {
        id: "account",
        label: "Mi cuenta",
        href: "/admin/account",
        icon: UserCircle2,
        section: "general",
      },
    ],
  },
  {
    id: "workspace",
    label: "Catálogo",
    items: [
      {
        id: "tracks",
        label: "Pistas",
        href: "/admin/tracks",
        icon: Music2,
        section: "workspace",
      },
      {
        id: "uploads",
        label: "Subir audio",
        href: "/admin/uploads",
        icon: SlidersHorizontal,
        section: "workspace",
      },
      {
        id: "playlists",
        label: "Colecciones",
        href: "/admin/playlists",
        icon: Library,
        section: "workspace",
      },
      {
        id: "sound-kits",
        label: "Sound kits",
        href: "/admin/sound-kits",
        icon: FolderKanban,
        section: "workspace",
      },
      {
        id: "services",
        label: "Servicios",
        href: "/admin/services",
        icon: BriefcaseBusiness,
        section: "workspace",
      },
      {
        id: "showcase",
        label: "Banner y drops",
        href: "/admin/showcase",
        icon: Megaphone,
        section: "workspace",
      },
    ],
  },
  {
    id: "licensing",
    label: "Comercial",
    items: [
      {
        id: "licensing-requests",
        label: "Solicitudes de licencia",
        href: "/admin/licensing",
        icon: ClipboardList,
        section: "licensing",
      },
      {
        id: "license-templates",
        label: "Tipos de licencia",
        href: "/admin/license-templates",
        icon: FileText,
        section: "licensing",
      },
      {
        id: "contracts",
        label: "Contratos",
        href: "/admin/contracts",
        icon: Gavel,
        section: "licensing",
      },
    ],
  },
  {
    id: "system",
    label: "Más herramientas",
    items: [
      {
        id: "inbound-requests",
        label: "Mensajes",
        href: "/admin/requests",
        icon: ScrollText,
        section: "system",
      },
      {
        id: "tickets",
        label: "Soporte",
        href: "/admin/tickets",
        icon: LifeBuoy,
        section: "system",
      },
      {
        id: "users",
        label: "Usuarios",
        href: "/admin/users",
        icon: UserCircle2,
        section: "system",
      },
      {
        id: "roles",
        label: "Roles y permisos",
        href: "/admin/users/roles",
        icon: UserCircle2,
        section: "system",
        exact: true,
      },
    ],
  },
];

export function getAdminDashboardSectionsForRole(
  role: UserRole | null | undefined,
) {
  if (role === "ADMIN") return adminDashboardSections;

  if (role === "STAFF") {
    return adminDashboardSections.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => item.id !== "users" && item.id !== "roles",
      ),
    }));
  }

  return adminDashboardSections.map((section) => ({
    ...section,
    items: [],
  }));
}
