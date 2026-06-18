"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/lib/protected-route";

export default function StudentLayout({ children }) {
  return (
    <ProtectedRoute requiredRole="student">
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
