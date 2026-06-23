"use client";

import { use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { courseAPI, moduleAPI, progressAPI, assignmentAPI } from "@/lib/api";
import PageContainer from "@/components/layout/PageContainer";
import Badge from "@/components/ui/Badge";
import { SkeletonLine } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Layers, BookOpen, ClipboardList, PlayCircle, MessageSquare } from "lucide-react";

export default function StudentCourseDetailPage({ params }) {
  const { courseId } = use(params);
  const queryClient = useQueryClient();

  const { data: courseData, isLoading: courseLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => courseAPI.getById(courseId),
    enabled: !!courseId,
  });

  const { data: modulesData, isLoading: modulesLoading } = useQuery({
    queryKey: ["course-modules", courseId],
    queryFn: () => moduleAPI.getByCourseId(courseId),
    enabled: !!courseId,
  });

  const { data: progressData } = useQuery({
    queryKey: ["course-progress", courseId],
    queryFn: () => progressAPI.getCourseProgress(courseId),
    enabled: !!courseId,
  });

  const { data: assignmentsData } = useQuery({
    queryKey: ["course-assignments", courseId],
    queryFn: () => assignmentAPI.getAll(courseId),
    enabled: !!courseId,
  });

  const course = courseData?.data;
  const modules = modulesData?.data || [];
  const progress = progressData?.progress;
  const assignments = assignmentsData?.data || [];
  const isEnrolled = !!progress;

  const enrollMutation = useMutation({
    mutationFn: () => progressAPI.initialize(courseId),
    onSuccess: (res) => {
      if (!res.success) { toast.error(res.message); return; }
      queryClient.invalidateQueries({ queryKey: ["course-progress", courseId] });
      queryClient.invalidateQueries({ queryKey: ["my-progress"] });
      toast.success("Enrolled successfully!");
    },
    onError: (err) => toast.error(err.message || "Failed to enroll"),
  });

  const isLoading = courseLoading || modulesLoading;

  return (
    <PageContainer
      title={isLoading ? "Loading..." : course?.title || "Course"}
      subtitle={isLoading ? "" : course?.description}
      actions={
        <Link href="/student/courses" className="btn btn-outline">
          <ArrowLeft size={16} /> Back to Courses
        </Link>
      }
    >
      {isLoading ? (
        <div className="card">
          <div className="card-body">
            <SkeletonLine width="50%" />
            <SkeletonLine width="80%" />
            <SkeletonLine width="30%" />
          </div>
        </div>
      ) : (
        <>
          {/* Course Info + Enrollment */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {course?.level && <Badge variant={course.level}>{course.level}</Badge>}
                  {course?.category && <Badge variant="muted">{course.category}</Badge>}
                  <span className="text-sm text-muted">
                    {course?.price > 0 ? `₹${course.price}` : "Free"}
                  </span>
                  <span className="text-sm text-muted">•</span>
                  <span className="text-sm text-muted">{modules.length} module{modules.length !== 1 ? "s" : ""}</span>
                  <span className="text-sm text-muted">•</span>
                  <span className="text-sm text-muted">{assignments.length} assignment{assignments.length !== 1 ? "s" : ""}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {isEnrolled ? (
                    <>
                      <div style={{ minWidth: 100 }}>
                        <div className="progress-bar">
                          <div
                            className={`progress-bar-fill ${progress?.completed ? "success" : ""}`}
                            style={{ width: `${progress?.progress || 0}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium">{progress?.progress || 0}%</span>
                      <Badge variant={progress?.completed ? "completed" : "in-progress"}>
                        {progress?.completed ? "Completed" : "In Progress"}
                      </Badge>
                    </>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={() => enrollMutation.mutate()}
                      disabled={enrollMutation.isPending}
                    >
                      <PlayCircle size={16} />
                      {enrollMutation.isPending ? "Enrolling..." : "Start Course"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modules */}
          <div style={{ marginBottom: 12 }}>
            <h3><Layers size={18} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />Course Modules</h3>
          </div>

          {modules.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No modules"
              description="This course has no modules yet."
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {modules.map((mod) => (
                <div key={mod.id} className="card">
                  <div className="card-body" style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          backgroundColor: "var(--color-primary)",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {mod.position}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{mod.title}</div>
                        {mod.description && <div className="text-sm text-muted">{mod.description}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Assignments */}
          {assignments.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ marginBottom: 12 }}>
                <h3><ClipboardList size={18} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />Assignments</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {assignments.map((a) => (
                  <Link
                    key={a.id}
                    href={`/student/assignments/${a.id}`}
                    className="card"
                    style={{ textDecoration: "none" }}
                  >
                    <div className="card-body" style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{a.title}</div>
                          {a.description && <div className="text-sm text-muted">{a.description.substring(0, 80)}</div>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {a.max_marks && <span className="text-sm text-muted">{a.max_marks} marks</span>}
                          {a.due_date && (
                            <span className="text-sm text-muted">
                              Due: {new Date(a.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Discussions */}
          <div style={{ marginTop: 24 }}>
            <div style={{ marginBottom: 12 }}>
              <h3><MessageSquare size={18} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />Course Discussions</h3>
            </div>
            <Link
              href={`/student/courses/${courseId}/discussions`}
              className="card"
              style={{ textDecoration: "none", display: "block" }}
            >
              <div className="card-body" style={{ padding: "14px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>View & Ask Questions</div>
                    <div className="text-sm text-muted">Ask doubts, share knowledge, and find answers from other students and teachers</div>
                  </div>
                  <ArrowLeft size={16} style={{ transform: "rotate(180deg)", color: "var(--color-muted)" }} />
                </div>
              </div>
            </Link>
          </div>
        </>
      )}
    </PageContainer>
  );
}
