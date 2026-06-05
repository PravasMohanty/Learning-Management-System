"use client";

import { ProtectedRoute } from "@/lib/protected-route";
import { useAuth } from "@/lib/auth-context";
import { userAPI } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function StudentProfilePage() {
  const { user, logout, changePassword } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userAPI.getProfile();
        if (response.success) {
          setProfile(response.data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await changePassword(newPassword);
      setSuccess("Password changed successfully");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
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
                className="px-6 py-4 border-b-2 border-transparent text-gray-600 hover:text-gray-800 font-semibold"
              >
                Assignments
              </Link>
              <Link
                href="/student/profile"
                className="px-6 py-4 border-b-2 border-blue-600 text-blue-600 font-semibold"
              >
                Profile
              </Link>
            </nav>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-8">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Profile Information
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-2">
                        Name
                      </label>
                      <p className="text-lg text-gray-900">
                        {profile?.name || user?.name}
                      </p>
                    </div>

                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-2">
                        Email
                      </label>
                      <p className="text-lg text-gray-900">
                        {profile?.email || user?.email}
                      </p>
                    </div>

                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-2">
                        Role
                      </label>
                      <p className="text-lg text-gray-900">
                        {profile?.role || user?.role}
                      </p>
                    </div>

                    <div>
                      <label className="block text-gray-600 text-sm font-semibold mb-2">
                        Status
                      </label>
                      <p className="text-lg text-gray-900">
                        {profile?.is_locked ? "Locked" : "Active"}
                      </p>
                    </div>
                  </div>

                  {!showPasswordForm && (
                    <button
                      onClick={() => setShowPasswordForm(true)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                    >
                      Change Password
                    </button>
                  )}

                  {showPasswordForm && (
                    <form
                      onSubmit={handleChangePassword}
                      className="mt-8 pt-8 border-t"
                    >
                      <h3 className="text-lg font-bold text-gray-900 mb-6">
                        Change Password
                      </h3>

                      <div className="mb-4">
                        <label className="block text-gray-700 font-semibold mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>

                      <div className="mb-6">
                        <label className="block text-gray-700 font-semibold mb-2">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="submit"
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                        >
                          Update Password
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPasswordForm(false)}
                          className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
