"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  if (user) {
    router.push(
      user.role === "admin" ? "/admin/dashboard" : "/student/dashboard"
    );
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 text-center text-white">
        <h1 className="text-5xl font-bold mb-6">Learning Management System</h1>
        <p className="text-xl mb-8 opacity-90">
          Comprehensive platform for online learning and course management
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/auth/login"
            className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition"
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="px-8 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-400 transition border-2 border-white"
          >
            Register
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white bg-opacity-10 backdrop-blur p-6 rounded-lg">
            <h3 className="text-2xl font-bold mb-2">Courses</h3>
            <p>Access comprehensive course materials and resources</p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur p-6 rounded-lg">
            <h3 className="text-2xl font-bold mb-2">Assignments</h3>
            <p>Submit and track your assignment progress</p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur p-6 rounded-lg">
            <h3 className="text-2xl font-bold mb-2">Quizzes</h3>
            <p>Test your knowledge with interactive quizzes</p>
          </div>
        </div>
      </div>
    </main>
  );
}
