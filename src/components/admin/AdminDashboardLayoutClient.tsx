"use client";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ViewAsControl } from "@/components/dashboard/ViewAsControl";
import {
  AdminAssetPlayerContent,
  AdminAssetPlayerProvider,
} from "@/components/admin/player/admin-asset-player-context";
import {
  adminDashboardSections,
  getAdminDashboardSectionsForRole,
} from "@/components/dashboard/nav-config.admin";
import type { UserRole } from "@prisma/client";

export function AdminDashboardLayoutClient({
  role,
  realRole,
  children,
}: {
  role: UserRole | null;
  realRole: UserRole | null;
  children: React.ReactNode;
}) {
  const sections = role ? getAdminDashboardSectionsForRole(role) : adminDashboardSections;

  return (
    <AdminAssetPlayerProvider>
      <DashboardShell
        sections={sections}
        brandTitle="Lynx Admin"
        brandSubtitle="Sync · Catalogo · Tech"
        hiddenPaths={["/admin/login"]}
        topbarCustomActions={
          <ViewAsControl realRole={realRole} effectiveRole={role} />
        }
        mobileFooterCustomActions={
          <ViewAsControl realRole={realRole} effectiveRole={role} compact />
        }
      >
        <AdminAssetPlayerContent>{children}</AdminAssetPlayerContent>
      </DashboardShell>
    </AdminAssetPlayerProvider>
  );
}
