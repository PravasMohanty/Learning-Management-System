"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/lib/protected-route";

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
