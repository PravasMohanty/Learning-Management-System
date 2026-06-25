"use client";

import { useQuery } from "@tanstack/react-query";
import { courseAPI, assignmentAPI, progressAPI } from "@/lib/api";
import PageContainer from "@/components/layout/PageContainer";
import { SkeletonTable } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Link from "next/link";
import { ClipboardList } from "lucide-react";

export default function StudentAssignmentsPage() {
  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ["my-progress"],
    queryFn: progressAPI.getMyProgress,
  });

  const enrolledCourseIds = (progressData?.progress || []).map((p) => p.course_id);

  // We fetch all courses then filter to enrolled ones
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ["all-courses"],
    queryFn: courseAPI.getAll,
  });

  const allCourses = coursesData?.data || [];
  const enrolledCourses = allCourses.filter((c) => enrolledCourseIds.includes(c.id));

  const isLoading = progressLoading || coursesLoading;

  return (
    <PageContainer
      title="Assignments"
      subtitle="View assignments from your enrolled courses"
    >
      {isLoading ? (
        <SkeletonTable rows={5} cols={4} />
      ) : enrolledCourses.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ClipboardList}
            title="No assignments"
            description="Enroll in courses to see their assignments."
            action={
              <Link href="/student/courses" className="btn btn-primary btn-sm">
                Browse Courses
              </Link>
            }
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {enrolledCourses.map((course) => (
            <CourseAssignmentsSection key={course.id} course={course} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}

function CourseAssignmentsSection({ course }) {
  const { data, isLoading } = useQuery({
    queryKey: ["course-assignments", course.id],
    queryFn: () => assignmentAPI.getAll(course.id),
  });

  const assignments = data?.data || [];

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <h4>{course.title}</h4>
        </div>
        <div className="card-body">
          <div className="skeleton skeleton-line long" />
          <div className="skeleton skeleton-line medium" />
        </div>
      </div>
    );
  }

  if (assignments.length === 0) return null;

  return (
    <div className="card">
      <div className="card-header">
        <h4>{course.title}</h4>
        <span className="text-sm text-muted">{assignments.length} assignment{assignments.length !== 1 ? "s" : ""}</span>
      </div>
      <div>
        {assignments.map((a) => (
          <Link
            key={a.id}
            href={`/student/assignments/${a.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 20px",
              borderBottom: "1px solid var(--color-border-light)",
              textDecoration: "none",
              color: "var(--color-text)",
            }}
          >
            <div>
              <div style={{ fontWeight: 500 }}>{a.title}</div>
              {a.description && (
                <div className="text-sm text-muted">{a.description.substring(0, 80)}</div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0, marginLeft: 16 }}>
              {a.max_marks && <span className="text-sm text-muted">{a.max_marks} marks</span>}
              {a.due_date && (
                <span className="text-sm text-muted">
                  Due {new Date(a.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
