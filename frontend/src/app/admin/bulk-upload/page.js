"use client";

import { ProtectedRoute } from "@/lib/protected-route";
import { useAuth } from "@/lib/auth-context";
import { bulkUserAPI } from "@/lib/api";
import Link from "next/link";
import { useState } from "react";

export default function AdminBulkUploadPage() {
  const { user, logout } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleLogout = async () => {
    await logout();
  };

  const handleDownloadTemplate = () => {
    bulkUserAPI.downloadTemplate();
  };

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
    setMessage("");
    setError("");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!file) {
      setError("Please select a file");
      return;
    }

    if (!file.name.endsWith(".csv")) {
      setError("Please select a CSV file");
      return;
    }

    setUploading(true);

    try {
      const response = await bulkUserAPI.uploadCSV(file);
      if (response.success) {
        setMessage("Users uploaded successfully!");
        setFile(null);
      } else {
        setError(response.message || "Upload failed");
      }
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Bulk Upload</h1>
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
            <nav className="flex border-b flex-wrap">
              <Link
                href="/admin/dashboard"
                className="px-6 py-4 border-b-2 border-transparent text-gray-600 hover:text-gray-800 font-semibold"
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
                className="px-6 py-4 border-b-2 border-blue-600 text-blue-600 font-semibold"
              >
                Bulk Upload
              </Link>
            </nav>
          </div>

          {/* Upload Card */}
          <div className="bg-white rounded-lg shadow max-w-2xl">
            <div className="px-6 py-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Bulk User Upload
              </h2>

              {message && (
                <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                  {message}
                </div>
              )}

              {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Instructions
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600">
                  <li>Download the CSV template</li>
                  <li>Fill in user details (name, email, password)</li>
                  <li>Select the CSV file</li>
                  <li>Click Upload</li>
                </ol>
              </div>

              <button
                onClick={handleDownloadTemplate}
                className="mb-6 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
              >
                Download Template
              </button>

              <form onSubmit={handleUpload}>
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Select CSV File
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="block w-full text-gray-700 border border-gray-300 rounded px-4 py-2"
                  />
                  {file && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {file.name}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-400"
                >
                  {uploading ? "Uploading..." : "Upload Users"}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
