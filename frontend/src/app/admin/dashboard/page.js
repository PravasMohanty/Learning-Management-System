"use client";

import dynamic from "next/dynamic";
import { ProtectedRoute } from "@/lib/protected-route";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

const CourseList = dynamic(
  () => import("@/components/courses/CourseList").then((mod) => mod.default),
  {
    loading: () => <div className="animate-pulse">Loading courses...</div>,
  }
);

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow mb-8">
            <nav className="flex border-b flex-wrap">
              <Link
                href="/admin/dashboard"
                className="px-6 py-4 border-b-2 border-blue-600 text-blue-600 font-semibold"
              >
                Courses
              </Link>
              <Link
                href="/admin/users"
                className="px-6 py-4 border-b-2 border-transparent text-gray-600 hover:text-gray-800 font-semibold"
              >
                Users
              </Link>
              <Link
                href="/admin/requests"
                className="px-6 py-4 border-b-2 border-transparent text-gray-600 hover:text-gray-800 font-semibold"
              >
                Registration Requests
              </Link>
              <Link
                href="/admin/bulk-upload"
                className="px-6 py-4 border-b-2 border-transparent text-gray-600 hover:text-gray-800 font-semibold"
              >
                Bulk Upload
              </Link>
            </nav>
          </div>

          {/* Action Buttons */}
          <div className="mb-8 flex gap-4 flex-wrap">
            <Link
              href="/admin/courses/new"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              + Create Course
            </Link>
          </div>

          {/* Courses List */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">All Courses</h2>
            <CourseList adminView={true} />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
