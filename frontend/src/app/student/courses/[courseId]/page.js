"use client";

import { use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { courseAPI, moduleAPI, progressAPI, assignmentAPI, certificateAPI } from "@/lib/api";
import PageContainer from "@/components/layout/PageContainer";
import Badge from "@/components/ui/Badge";
import { SkeletonLine } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Layers, BookOpen, ClipboardList, PlayCircle, MessageSquare, CheckCircle } from "lucide-react";

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
  const moduleProgress = progressData?.moduleProgress || [];
  const passedQuizzes = progressData?.passedQuizzes || [];
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

  const toggleModuleMutation = useMutation({
    mutationFn: ({ moduleId, completed }) => progressAPI.markModuleCompleted(courseId, moduleId, completed),
    onSuccess: (res) => {
      if (!res.success) { toast.error(res.message); return; }
      queryClient.invalidateQueries({ queryKey: ["course-progress", courseId] });
      queryClient.invalidateQueries({ queryKey: ["my-progress"] });
    },
    onError: (err) => toast.error(err.message || "Failed to mark module"),
  });

  const handleGetCertificate = async () => {
    if (!progress?.completed) {
      toast.error("Please complete the course first to get your certificate.");
      return;
    }

    if (progressData?.allAssignmentsGraded === false) {
      toast.error("Cannot generate certificate: You have ungraded or unsubmitted assignments.");
      return;
    }

    // Open window immediately to bypass popup blockers for slow generation
    const newWindow = window.open('about:blank', '_blank');
    if (newWindow) {
      newWindow.document.write('<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><h2>Preparing your certificate...</h2></body></html>');
    }

    try {
      const toastId = toast.loading("Fetching certificate...");
      const res = await certificateAPI.getMyCertificates();
      
      let cert = null;
      if (res.success && res.certificates) {
        cert = res.certificates.find(c => c.course_id === courseId);
      }
      
      if (!cert || !cert.pdf_url) {
        toast.loading("Generating certificate... This may take a moment.", { id: toastId });
        const genRes = await certificateAPI.generate(courseId);
        
        // Sometimes backend returns 400 if it already exists, but includes the certificate
        if (genRes.success && genRes.certificate) {
          cert = genRes.certificate;
        } else if (genRes.certificate) {
          cert = genRes.certificate;
        } else {
          throw new Error(genRes.message || "Failed to generate certificate");
        }
      }
      
      toast.dismiss(toastId);
      
      if (cert && cert.pdf_url) {
        if (newWindow) {
          newWindow.location.href = cert.pdf_url;
        } else {
          window.open(cert.pdf_url, '_blank');
        }
      } else {
        if (newWindow) newWindow.close();
        toast.error("Certificate URL not found");
      }
    } catch (err) {
      if (newWindow) newWindow.close();
      toast.dismiss();
      toast.error(err.message || "Failed to fetch certificate");
    }
  };

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
              {modules.map((mod) => {
                const isModCompleted = moduleProgress.some(mp => mp.module_id === mod.id && mp.completed);
                const moduleQuizzes = mod.quizzes || [];
                const hasQuizzes = moduleQuizzes.length > 0;
                const passedAllQuizzes = moduleQuizzes.every(q => passedQuizzes.includes(q.id));
                const canMarkCompleted = !hasQuizzes || passedAllQuizzes;

                return (
                  <div key={mod.id} className="card">
                    <div className="card-body" style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                        {isEnrolled && (
                          <div style={{ paddingTop: 4 }}>
                            <input
                              type="checkbox"
                              checked={isModCompleted}
                              onChange={(e) => toggleModuleMutation.mutate({ moduleId: mod.id, completed: e.target.checked })}
                              disabled={toggleModuleMutation.isPending || !canMarkCompleted}
                              title={!canMarkCompleted ? "You must pass all module quizzes before completing this module" : ""}
                              style={{
                                width: 20,
                                height: 20,
                                cursor: canMarkCompleted ? "pointer" : "not-allowed",
                                accentColor: "var(--color-primary)",
                                opacity: canMarkCompleted ? 1 : 0.5
                              }}
                            />
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{mod.position}. {mod.title}</div>
                          {mod.description && <div className="text-sm text-muted" style={{ marginBottom: 12 }}>{mod.description}</div>}

                          {isEnrolled && mod.module_videos && mod.module_videos.length > 0 && (
                            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
                              {mod.module_videos.map(vid => (
                                <div key={vid.id}>
                                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: "var(--color-text)" }}>
                                    <PlayCircle size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
                                    {vid.title}
                                  </div>
                                  <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: 8, background: "#000" }}>
                                    <iframe 
                                      src={vid.video_url} 
                                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }} 
                                      allowFullScreen
                                    ></iframe>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {isEnrolled && mod.quizzes && mod.quizzes.length > 0 && (
                            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid var(--color-border-light)", paddingTop: 12 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Module Quizzes</div>
                              {mod.quizzes.map(quiz => (
                                <Link
                                  key={quiz.id}
                                  href={`/student/quiz/${quiz.id}`}
                                  className="flex items-center justify-between p-3"
                                  style={{
                                    background: "var(--color-bg-white)",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: "var(--radius-md)",
                                    textDecoration: "none",
                                    color: "inherit",
                                    transition: "all var(--transition-fast)"
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = "var(--color-primary)";
                                    e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = "var(--color-border)";
                                    e.currentTarget.style.boxShadow = "none";
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <ClipboardList size={16} className="text-primary" />
                                    <div>
                                      <div style={{ fontWeight: 500, fontSize: 14 }}>{quiz.title}</div>
                                      <div style={{ fontSize: 12, color: "var(--color-muted)" }}>
                                        Passing Marks: {(quiz.passing_marks ?? 40) / 100 * (quiz.total_marks ?? 10)}/{(quiz.total_marks ?? 10)} ({(quiz.passing_marks ?? 40)}%) {quiz.time_limit ? `| Time Limit: ${quiz.time_limit} mins` : ""}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="btn btn-sm btn-primary">Take Quiz</div>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
          {isEnrolled && (
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
          )}

          {/* Get Certificate Button */}
          {isEnrolled && (
            <div style={{ marginTop: 24, marginBottom: 40 }}>
              {progress?.completed && progressData?.allAssignmentsGraded === false && (
                <div style={{ marginBottom: 12, padding: 12, background: "var(--color-bg-warning, #fff8e1)", color: "var(--color-warning, #f57f17)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-warning, #f57f17)", fontSize: 14 }}>
                  <span style={{ fontWeight: 600 }}>Note:</span> You have completed the course, but some assignments are still awaiting grading. You will be able to generate your certificate once all assignments have been graded by an instructor.
                </div>
              )}
              <button 
                className={`btn ${(progress?.completed && progressData?.allAssignmentsGraded !== false) ? 'btn-primary' : 'btn-outline'}`}
                onClick={handleGetCertificate}
                style={{ width: "100%", padding: "14px", fontSize: "16px", display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}
              >
                <CheckCircle size={20} />
                Get Certificate
              </button>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
