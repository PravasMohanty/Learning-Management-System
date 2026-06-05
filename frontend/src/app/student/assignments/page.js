"use client";

import { ProtectedRoute } from "@/lib/protected-route";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useState } from "react";

export default function StudentAssignmentsPage() {
  const { user, logout } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">{user?.name}</span>
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
            <nav className="flex border-b">
              <Link
                href="/student/dashboard"
                className="px-6 py-4 border-b-2 border-transparent text-gray-600 hover:text-gray-800 font-semibold"
              >
                Courses
              </Link>
              <Link
                href="/student/assignments"
                className="px-6 py-4 border-b-2 border-blue-600 text-blue-600 font-semibold"
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

          {/* Assignments List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-6 text-center text-gray-500">
                Loading assignments...
              </div>
            ) : assignments.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No assignments yet
              </div>
            ) : (
              <div className="divide-y">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="p-6 hover:bg-gray-50">
                    <h3 className="font-semibold text-gray-900">
                      {assignment.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-2">
                      {assignment.description}
                    </p>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Due:{" "}
                        {new Date(assignment.due_date).toLocaleDateString()}
                      </span>
                      <Link
                        href={`/student/assignments/${assignment.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 transition"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
