"use client";

import { useState, useEffect } from "react";
import { assignmentAPI } from "@/lib/api";

export default function RecentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        // This is a placeholder - in a real app, you'd fetch user's assignments
        setAssignments([]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded mb-4 w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
        No assignments yet
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="divide-y">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="p-6 hover:bg-gray-50">
            <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
            <p className="text-sm text-gray-600 mt-2">
              Due: {new Date(assignment.due_date).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
