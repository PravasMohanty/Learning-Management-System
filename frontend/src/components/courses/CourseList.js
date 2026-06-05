"use client";

import { useState, useEffect } from "react";
import { courseAPI } from "@/lib/api";
import Link from "next/link";

export default function CourseList({ studentView = false, adminView = false }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await courseAPI.getAll();
        if (response.success || Array.isArray(response)) {
          setCourses(Array.isArray(response) ? response : response.data || []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow animate-pulse h-64"
          ></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">
        Error loading courses: {error}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-600 p-8 rounded text-center">
        No courses available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <div
          key={course.id}
          className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
        >
          {course.thumbnail_url && (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-40 object-cover"
            />
          )}
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {course.title}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {course.description?.substring(0, 100)}...
            </p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {course.level || "Beginner"}
              </span>
              {course.price && (
                <span className="text-lg font-bold text-blue-600">
                  ${course.price}
                </span>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              {studentView && (
                <Link
                  href={`/student/courses/${course.id}`}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded text-center text-sm font-semibold hover:bg-blue-700 transition"
                >
                  View Course
                </Link>
              )}
              {adminView && (
                <>
                  <Link
                    href={`/admin/courses/${course.id}/edit`}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded text-center text-sm font-semibold hover:bg-blue-700 transition"
                  >
                    Edit
                  </Link>
                  <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700 transition">
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
