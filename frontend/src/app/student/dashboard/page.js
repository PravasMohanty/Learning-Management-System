"use client";

import { useQuery } from "@tanstack/react-query";
import { progressAPI, certificateAPI, courseAPI } from "@/lib/api";
import PageContainer from "@/components/layout/PageContainer";
import StatCard from "@/components/ui/StatCard";
import { SkeletonStatCards } from "@/components/ui/Skeleton";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { BookOpen, Award, TrendingUp, CheckCircle } from "lucide-react";

export default function StudentDashboard() {
  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ["my-progress"],
    queryFn: progressAPI.getMyProgress,
  });

  const { data: certsData, isLoading: certsLoading } = useQuery({
    queryKey: ["my-certificates"],
    queryFn: certificateAPI.getMyCertificates,
  });

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ["all-courses"],
    queryFn: courseAPI.getAll,
  });

  const progress = progressData?.progress || [];
  const certificates = certsData?.certificates || [];
  const allCourses = coursesData?.data || [];
  const publishedCourses = allCourses.filter((c) => c.published);

  const enrolledCount = progress.length;
  const completedCount = progress.filter((p) => p.completed).length;
  const avgProgress = enrolledCount > 0
    ? Math.round(progress.reduce((acc, p) => acc + (p.progress || 0), 0) / enrolledCount)
    : 0;

  const isLoading = progressLoading || certsLoading || coursesLoading;

  return (
    <PageContainer
      title="Dashboard"
      subtitle="Your learning overview"
    >
      {/* Stat Cards */}
      {isLoading ? (
        <SkeletonStatCards count={4} />
      ) : (
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Enrolled Courses"
            value={enrolledCount}
            icon={BookOpen}
            variant="primary"
          />
          <StatCard
            label="Completed"
            value={completedCount}
            icon={CheckCircle}
            variant="success"
          />
          <StatCard
            label="Average Progress"
            value={`${avgProgress}%`}
            icon={TrendingUp}
            variant="accent"
          />
          <StatCard
            label="Certificates"
            value={certificates.length}
            icon={Award}
            variant="info"
          />
        </div>
      )}

      {/* My Courses Progress */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h3>My Courses</h3>
          <Link href="/student/courses" className="btn btn-ghost btn-sm">
            Browse All Courses →
          </Link>
        </div>

        {!isLoading && progress.length === 0 ? (
          <div className="card">
            <div className="card-body" style={{ textAlign: "center", padding: 40 }}>
              <BookOpen size={32} style={{ color: "var(--color-muted)", marginBottom: 12 }} />
              <p className="font-semibold" style={{ marginBottom: 4 }}>No courses yet</p>
              <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
                Browse available courses and start learning
              </p>
              <Link href="/student/courses" className="btn btn-primary btn-sm">
                Browse Courses
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {progress.map((p) => (
              <Link
                key={p.id}
                href={`/student/courses/${p.course_id}`}
                className="card"
                style={{ textDecoration: "none" }}
              >
                <div className="card-body" style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>
                        {p.courses?.title || "Course"}
                      </div>
                      <div className="progress-bar" style={{ maxWidth: 300 }}>
                        <div
                          className={`progress-bar-fill ${p.completed ? "success" : ""}`}
                          style={{ width: `${p.progress || 0}%` }}
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: 16 }}>
                      <span className="text-sm font-medium">{p.progress || 0}%</span>
                      {p.completed ? (
                        <Badge variant="completed">Completed</Badge>
                      ) : (
                        <Badge variant="in-progress">In Progress</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
