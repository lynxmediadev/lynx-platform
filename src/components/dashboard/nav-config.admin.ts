import {
  ClipboardList,
  FileText,
  Gavel,
  Home,
  Library,
  Megaphone,
  Music2,
  Tags,
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
    ],
  },
  {
    id: "catalog",
    label: "Catálogo",
    items: [
      {
        id: "tracks",
        label: "Tracks",
        href: "/admin/tracks",
        icon: Music2,
        section: "catalog",
      },
      {
        id: "playlists",
        label: "Colecciones",
        href: "/admin/playlists",
        icon: Library,
        section: "catalog",
      },
      {
        id: "classification",
        label: "Clasificación",
        href: "/admin/classification",
        icon: Tags,
        section: "catalog",
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
    id: "content",
    label: "Contenido",
    items: [
      {
        id: "showcase",
        label: "Promociones",
        href: "/admin/showcase",
        icon: Megaphone,
        section: "content",
      },
    ],
  },
  {
    id: "administration",
    label: "Administración",
    items: [
      {
        id: "users",
        label: "Usuarios",
        href: "/admin/users",
        icon: UserCircle2,
        section: "administration",
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
