"use client";

import dynamic from "next/dynamic";
import { ProtectedRoute } from "@/lib/protected-route";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useState, lazy } from "react";

const CourseList = dynamic(() => import("@/components/courses/CourseList"), {
  loading: () => <div className="animate-pulse">Loading courses...</div>,
});

const RecentAssignments = dynamic(
  () => import("@/components/assignments/RecentAssignments"),
  {
    loading: () => <div className="animate-pulse">Loading assignments...</div>,
  }
);

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
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
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-semibold mb-2">
                Enrolled Courses
              </h3>
              <p className="text-3xl font-bold text-blue-600">0</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-semibold mb-2">
                Assignments
              </h3>
              <p className="text-3xl font-bold text-orange-600">0</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-semibold mb-2">
                Completed Quizzes
              </h3>
              <p className="text-3xl font-bold text-green-600">0</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-semibold mb-2">
                Average Grade
              </h3>
              <p className="text-3xl font-bold text-purple-600">N/A</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow mb-8">
            <nav className="flex border-b">
              <Link
                href="/student/dashboard"
                className="px-6 py-4 border-b-2 border-blue-600 text-blue-600 font-semibold"
              >
                Courses
              </Link>
              <Link
                href="/student/assignments"
                className="px-6 py-4 border-b-2 border-transparent text-gray-600 hover:text-gray-800 font-semibold"
              >
                Assignments
              </Link>
              <Link
                href="/student/profile"
                className="px-6 py-4 border-b-2 border-transparent text-gray-600 hover:text-gray-800 font-semibold"
              >
                Profile
              </Link>
            </nav>
          </div>

          {/* Courses Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Courses</h2>
            <CourseList studentView={true} />
          </div>

          {/* Recent Assignments */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Recent Assignments
            </h2>
            <RecentAssignments />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
