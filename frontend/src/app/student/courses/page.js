"use client";

import { useQuery } from "@tanstack/react-query";
import { courseAPI } from "@/lib/api";
import PageContainer from "@/components/layout/PageContainer";
import Badge from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function StudentCoursesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["all-courses"],
    queryFn: courseAPI.getAll,
  });

  const courses = (data?.data || []).filter((c) => c.published);

  return (
    <PageContainer
      title="Courses"
      subtitle="Browse available courses"
    >
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} height={180} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: "center", padding: 48 }}>
            <BookOpen size={32} style={{ color: "var(--color-muted)", marginBottom: 12 }} />
            <p className="font-semibold">No courses available</p>
            <p className="text-sm text-muted">Check back later for new courses.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/student/courses/${course.id}`}
              className="card"
              style={{ textDecoration: "none", display: "flex", flexDirection: "column" }}
            >
              {/* Thumbnail */}
              <div
                style={{
                  height: 120,
                  backgroundColor: "var(--color-primary)",
                  borderRadius: "6px 6px 0 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <BookOpen size={36} style={{ color: "rgba(255,255,255,0.3)" }} />
                )}
              </div>

              <div className="card-body" style={{ flex: 1, padding: "14px 16px" }}>
                <h4 style={{ marginBottom: 6, fontSize: 15 }}>{course.title}</h4>
                <p className="text-sm text-muted" style={{ marginBottom: 10, lineHeight: 1.4 }}>
                  {course.description?.substring(0, 80)}
                  {course.description?.length > 80 ? "..." : ""}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {course.level && <Badge variant={course.level}>{course.level}</Badge>}
                  {course.category && <Badge variant="muted">{course.category}</Badge>}
                  <span className="text-sm font-medium" style={{ marginLeft: "auto" }}>
                    {course.price > 0 ? `₹${course.price}` : "Free"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
