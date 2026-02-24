import type { Metadata } from "next";

import { AdminDashboardLayoutClient } from "@/components/admin/AdminDashboardLayoutClient";
import { getCurrentUser } from "@/lib/account-auth/guards";

export const metadata: Metadata = {
  title: "Panel admin — ODR Records",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <AdminDashboardLayoutClient
      role={user?.role ?? null}
      realRole={user?.realRole ?? user?.role ?? null}
    >
      {children}
    </AdminDashboardLayoutClient>
  );
}
