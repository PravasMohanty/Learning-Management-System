"use client";

import { ProtectedRoute } from "@/lib/protected-route";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export default function AdminUsersPage() {
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
            <h1 className="text-3xl font-bold text-gray-900">
              User Management
            </h1>
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
                className="px-6 py-4 border-b-2 border-transparent text-gray-600 hover:text-gray-800 font-semibold"
              >
                Courses
              </Link>
              <Link
                href="/admin/users"
                className="px-6 py-4 border-b-2 border-blue-600 text-blue-600 font-semibold"
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

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">All Users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900">
                      Loading users...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
