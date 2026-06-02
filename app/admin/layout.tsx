import type { ReactNode } from "react";
import AdminShell from "./admin-shell";
import AdminGuard from "./admin-guard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}
