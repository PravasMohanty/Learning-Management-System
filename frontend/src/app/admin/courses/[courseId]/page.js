"use client";

import { use, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { courseAPI, moduleAPI, assignmentAPI, quizAPI, moduleVideoAPI } from "@/lib/api";
import PageContainer from "@/components/layout/PageContainer";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { SkeletonLine } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Link from "next/link";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  Layers,
  ClipboardList,
  Upload,
  BookOpen,
  MessageSquare,
  Video,
  PlayCircle
} from "lucide-react";

const moduleSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  position: z.coerce.number().min(1).optional(),
});

const videoSchema = z.object({
  title: z.string().min(2, "Title is required"),
  video_url: z.string().url("Must be a valid URL"),
});

export default function CourseDetailPage({ params }) {
  const { courseId } = use(params);
  const queryClient = useQueryClient();
  const [moduleModal, setModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [deleteModuleModal, setDeleteModuleModal] = useState(null);
  const [quizModal, setQuizModal] = useState(null);
  const quizFileRef = useRef(null);
  const [quizData, setQuizData] = useState({ title: "", description: "", pass_percentage: "40", time_limit: "" });
  const [quizFile, setQuizFile] = useState(null);

  const [viewAttemptsModal, setViewAttemptsModal] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  const [videoModal, setVideoModal] = useState(null); // stores the moduleId we are adding a video to
  const videoForm = useForm({
    resolver: zodResolver(videoSchema),
    defaultValues: { title: "", video_url: "" },
  });

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

  const { data: assignmentsData } = useQuery({
    queryKey: ["course-assignments", courseId],
    queryFn: () => assignmentAPI.getAll(courseId),
    enabled: !!courseId,
  });

  const course = courseData?.data;
  const modules = modulesData?.data || [];
  const assignments = assignmentsData?.data || [];

  const moduleForm = useForm({
    resolver: zodResolver(moduleSchema),
    defaultValues: { title: "", description: "", position: 1 },
  });

  const createModuleMutation = useMutation({
    mutationFn: (data) => moduleAPI.create(courseId, data),
    onSuccess: (res) => {
      if (!res.success) { toast.error(res.message); return; }
      queryClient.invalidateQueries({ queryKey: ["course-modules", courseId] });
      toast.success("Module created");
      setModuleModal(false);
      moduleForm.reset();
    },
    onError: (err) => toast.error(err.message || "Failed to create module"),
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ moduleId, data }) => moduleAPI.update(moduleId, data),
    onSuccess: (res) => {
      if (!res.success) { toast.error(res.message); return; }
      queryClient.invalidateQueries({ queryKey: ["course-modules", courseId] });
      toast.success("Module updated");
      setEditingModule(null);
      moduleForm.reset();
    },
    onError: (err) => toast.error(err.message || "Failed to update module"),
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId) => moduleAPI.delete(moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-modules", courseId] });
      toast.success("Module deleted");
      setDeleteModuleModal(null);
    },
    onError: (err) => toast.error(err.message || "Failed to delete module"),
  });

  const createVideoMutation = useMutation({
    mutationFn: ({ moduleId, data }) => moduleVideoAPI.create(moduleId, data),
    onSuccess: (res) => {
      if (!res.success) { toast.error(res.message); return; }
      queryClient.invalidateQueries({ queryKey: ["course-modules", courseId] });
      toast.success("Video added");
      setVideoModal(null);
      videoForm.reset();
    },
    onError: (err) => toast.error(err.message || "Failed to add video"),
  });

  const deleteVideoMutation = useMutation({
    mutationFn: (videoId) => moduleVideoAPI.delete(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-modules", courseId] });
      toast.success("Video deleted");
    },
    onError: (err) => toast.error(err.message || "Failed to delete video"),
  });

  const openCreateModule = () => {
    moduleForm.reset({ title: "", description: "", position: modules.length + 1 });
    setEditingModule(null);
    setModuleModal(true);
  };

  const openEditModule = (mod) => {
    moduleForm.reset({ title: mod.title, description: mod.description || "", position: mod.position });
    setEditingModule(mod);
    setModuleModal(true);
  };

  const onModuleSubmit = (data) => {
    if (editingModule) {
      updateModuleMutation.mutate({ moduleId: editingModule.id, data });
    } else {
      createModuleMutation.mutate(data);
    }
  };

  const handleQuizUpload = async () => {
    if (!quizFile || !quizData.title) {
      toast.error("Title and CSV file are required");
      return;
    }
    try {
      const res = await quizAPI.createFromCSV(quizModal.id, quizData, quizFile);
      if (!res.success) throw new Error(res.message);
      toast.success(`Quiz created with ${res.data?.total_questions || 0} questions`);
      setQuizModal(null);
      setQuizFile(null);
      setQuizData({ title: "", description: "", pass_percentage: "40", time_limit: "" });
      queryClient.invalidateQueries({ queryKey: ["course-modules", courseId] });
    } catch (err) {
      toast.error(err.message || "Failed to create quiz");
    }
  };

  const deleteQuizMutation = useMutation({
    mutationFn: (quizId) => quizAPI.delete(quizId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-modules", courseId] });
      toast.success("Quiz deleted successfully");
    },
    onError: (err) => toast.error(err.message || "Failed to delete quiz"),
  });

  const openViewAttempts = async (quiz) => {
    setViewAttemptsModal(quiz);
    setLoadingAttempts(true);
    try {
      const res = await quizAPI.getAttempts(quiz.id);
      setQuizAttempts(res.data || []);
    } catch (err) {
      toast.error("Failed to load quiz attempts");
    } finally {
      setLoadingAttempts(false);
    }
  };

  const openAddVideo = (moduleId) => {
    videoForm.reset({ title: "", video_url: "" });
    setVideoModal(moduleId);
  };

  const onVideoSubmit = (data) => {
    createVideoMutation.mutate({ moduleId: videoModal, data });
  };

  const isLoading = courseLoading || modulesLoading;

  return (
    <PageContainer
      title="Course Details"
      subtitle=""
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/admin/courses/${courseId}/edit`} className="btn btn-outline">
            <Pencil size={16} /> Edit Course
          </Link>
          <Link href={`/admin/courses/${courseId}/assignments`} className="btn btn-outline">
            <ClipboardList size={16} /> Assignments ({assignments.length})
          </Link>
          <Link href={`/admin/courses/${courseId}/discussions`} className="btn btn-outline">
            <MessageSquare size={16} /> Discussions
          </Link>
          <Link href="/admin/courses" className="btn btn-ghost">
            <ArrowLeft size={16} /> Back
          </Link>
        </div>
      }
    >
      {/* Course Hero Card */}
      {isLoading ? (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-body" style={{ display: "flex", gap: 24 }}>
            <div
              className="skeleton"
              style={{
                width: 280,
                minHeight: 170,
                borderRadius: "var(--radius-md)",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <SkeletonLine width="60%" />
              <SkeletonLine width="80%" />
              <SkeletonLine width="40%" />
            </div>
          </div>
        </div>
      ) : course ? (
        <div className="card" style={{ marginBottom: 24, overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              gap: 0,
              flexWrap: "nowrap",
            }}
          >
            {/* Thumbnail */}
            <div
              style={{
                width: 300,
                minHeight: 200,
                flexShrink: 0,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    position: "absolute",
                    inset: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background:
                      "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 50%, var(--color-accent-dark) 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "absolute",
                    inset: 0,
                  }}
                >
                  <BookOpen
                    size={48}
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  />
                </div>
              )}
            </div>

            {/* Course Details */}
            <div
              style={{
                flex: 1,
                padding: "24px 28px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "var(--color-text)",
                    marginBottom: 6,
                    lineHeight: 1.3,
                  }}
                >
                  {course.title}
                </h2>
                {course.description && (
                  <p
                    className="text-muted"
                    style={{
                      fontSize: 14,
                      lineHeight: 1.6,
                      maxWidth: 520,
                    }}
                  >
                    {course.description.length > 180
                      ? course.description.substring(0, 180) + "..."
                      : course.description}
                  </p>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <Badge variant={course.published ? "published" : "draft"}>
                  {course.published ? "Published" : "Draft"}
                </Badge>
                {course.level && (
                  <Badge variant={course.level}>{course.level}</Badge>
                )}
                {course.category && (
                  <Badge variant="muted">{course.category}</Badge>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 20,
                  alignItems: "center",
                  fontSize: 13,
                  color: "var(--color-muted)",
                  marginTop: 2,
                }}
              >
                <span>
                  <strong style={{ color: "var(--color-text)", fontSize: 15 }}>
                    {course.price > 0 ? `₹${course.price}` : "Free"}
                  </strong>
                </span>
                <span style={{ color: "var(--color-border)" }}>•</span>
                <span>{modules.length} module{modules.length !== 1 ? "s" : ""}</span>
                <span style={{ color: "var(--color-border)" }}>•</span>
                <span>
                  Created{" "}
                  {new Date(course.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modules Section */}
      <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3><Layers size={18} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />Modules</h3>
        <button className="btn btn-primary btn-sm" onClick={openCreateModule}>
          <Plus size={14} /> Add Module
        </button>
      </div>

      {modules.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={BookOpen}
            title="No modules yet"
            description="Create modules to organize your course content."
            action={
              <button className="btn btn-primary btn-sm" onClick={openCreateModule}>
                <Plus size={14} /> Create First Module
              </button>
            }
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {modules.map((mod) => (
            <div key={mod.id} className="card">
              <div className="card-body" style={{ padding: "14px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
                      {mod.description && (
                        <div className="text-sm text-muted">{mod.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="data-table-actions">
                    <button
                      className="btn-icon"
                      title="Add video"
                      onClick={() => openAddVideo(mod.id)}
                    >
                      <Video size={16} />
                    </button>
                    <button
                      className="btn-icon"
                      title="Upload quiz CSV"
                      onClick={() => setQuizModal(mod)}
                    >
                      <Upload size={16} />
                    </button>
                    <button
                      className="btn-icon"
                      title="Edit module"
                      onClick={() => openEditModule(mod)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="btn-icon"
                      title="Delete module"
                      style={{ color: "var(--color-error)" }}
                      onClick={() => setDeleteModuleModal(mod)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Sub-list of videos */}
                {mod.module_videos && mod.module_videos.length > 0 && (
                  <div style={{ marginTop: 16, borderTop: "1px solid var(--color-border)", paddingTop: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Videos</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {mod.module_videos.map((vid) => (
                        <div key={vid.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--color-bg-alt)", borderRadius: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                            <PlayCircle size={14} className="text-muted" />
                            <span>{vid.title}</span>
                          </div>
                          <button
                            className="btn-icon btn-sm"
                            title="Delete video"
                            onClick={() => {
                              if(confirm("Delete this video?")) deleteVideoMutation.mutate(vid.id);
                            }}
                          >
                            <Trash2 size={14} style={{ color: "var(--color-error)" }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-list of quizzes */}
                {mod.quizzes && mod.quizzes.length > 0 && (
                  <div style={{ marginTop: 16, borderTop: "1px solid var(--color-border)", paddingTop: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Quizzes</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {mod.quizzes.map((quiz) => (
                        <div key={quiz.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--color-bg-alt)", borderRadius: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                            <ClipboardList size={14} className="text-muted" />
                            <div>
                              <span style={{ fontWeight: 500 }}>{quiz.title}</span>
                              <span style={{ fontSize: 12, color: "var(--color-muted)", marginLeft: 8 }}>
                                ({(quiz.passing_marks ?? 40) / 100 * (quiz.total_marks ?? 10)}/{(quiz.total_marks ?? 10)} passing marks ({(quiz.passing_marks ?? 40)}%)) {quiz.time_limit ? `• ${quiz.time_limit} min` : ""}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => openViewAttempts(quiz)}
                            >
                              Attempts
                            </button>
                            <button
                              className="btn-icon btn-sm"
                              title="Delete quiz"
                              onClick={() => {
                                if (confirm("Delete this quiz?")) deleteQuizMutation.mutate(quiz.id);
                              }}
                            >
                              <Trash2 size={14} style={{ color: "var(--color-error)" }} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Module Modal */}
      <Modal
        isOpen={moduleModal}
        onClose={() => { setModuleModal(false); setEditingModule(null); }}
        title={editingModule ? "Edit Module" : "Create Module"}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => { setModuleModal(false); setEditingModule(null); }}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={moduleForm.handleSubmit(onModuleSubmit)}
              disabled={createModuleMutation.isPending || updateModuleMutation.isPending}
            >
              {(createModuleMutation.isPending || updateModuleMutation.isPending) ? "Saving..." : "Save Module"}
            </button>
          </>
        }
      >
        <Input
          label="Module Title"
          placeholder="e.g. Introduction"
          error={moduleForm.formState.errors.title?.message}
          {...moduleForm.register("title")}
        />
        <Textarea
          label="Description"
          placeholder="Brief description of this module..."
          optional
          error={moduleForm.formState.errors.description?.message}
          {...moduleForm.register("description")}
        />
        <Input
          label="Position"
          type="number"
          placeholder="1"
          error={moduleForm.formState.errors.position?.message}
          {...moduleForm.register("position")}
        />
      </Modal>

      {/* Delete Module Modal */}
      <Modal
        isOpen={!!deleteModuleModal}
        onClose={() => setDeleteModuleModal(null)}
        title="Delete Module"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setDeleteModuleModal(null)}>Cancel</button>
            <button
              className="btn btn-danger"
              onClick={() => deleteModuleMutation.mutate(deleteModuleModal.id)}
              disabled={deleteModuleMutation.isPending}
            >
              {deleteModuleMutation.isPending ? "Deleting..." : "Delete Module"}
            </button>
          </>
        }
      >
        <p>Are you sure you want to delete <strong>{deleteModuleModal?.title}</strong>? This cannot be undone.</p>
      </Modal>

      {/* Add Video Modal */}
      <Modal
        isOpen={!!videoModal}
        onClose={() => { setVideoModal(null); videoForm.reset(); }}
        title="Add Video to Module"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => { setVideoModal(null); videoForm.reset(); }}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={videoForm.handleSubmit(onVideoSubmit)}
              disabled={createVideoMutation.isPending}
            >
              {createVideoMutation.isPending ? "Adding..." : "Add Video"}
            </button>
          </>
        }
      >
        <Input
          label="Video Title"
          placeholder="e.g. Lesson 1: Introduction"
          error={videoForm.formState.errors.title?.message}
          {...videoForm.register("title")}
        />
        <Input
          label="YouTube Embed URL"
          placeholder="https://www.youtube.com/embed/..."
          error={videoForm.formState.errors.video_url?.message}
          {...videoForm.register("video_url")}
        />
      </Modal>

      {/* Quiz Upload Modal */}
      <Modal
        isOpen={!!quizModal}
        onClose={() => { setQuizModal(null); setQuizFile(null); }}
        title={`Upload Quiz — ${quizModal?.title || ""}`}
        maxWidth={520}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => { setQuizModal(null); setQuizFile(null); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleQuizUpload}>Create Quiz</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Quiz Title</label>
          <input
            className="form-input"
            placeholder="e.g. Module 1 Assessment"
            value={quizData.title}
            onChange={(e) => setQuizData((d) => ({ ...d, title: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Description <span className="form-label-optional">(optional)</span></label>
          <input
            className="form-input"
            placeholder="Brief description..."
            value={quizData.description}
            onChange={(e) => setQuizData((d) => ({ ...d, description: e.target.value }))}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Pass %</label>
            <input
              className="form-input"
              type="number"
              value={quizData.pass_percentage}
              onChange={(e) => setQuizData((d) => ({ ...d, pass_percentage: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Time Limit (min) <span className="form-label-optional">(optional)</span></label>
            <input
              className="form-input"
              type="number"
              value={quizData.time_limit}
              onChange={(e) => setQuizData((d) => ({ ...d, time_limit: e.target.value }))}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">CSV File</label>
          <input
            ref={quizFileRef}
            type="file"
            accept=".csv"
            className="form-input"
            onChange={(e) => setQuizFile(e.target.files?.[0] || null)}
          />
          <div className="form-hint">Upload a CSV with columns: question, options (JSON array), correct_answer, points</div>
        </div>
      </Modal>

      {/* View Quiz Attempts Modal */}
      <Modal
        isOpen={!!viewAttemptsModal}
        onClose={() => { setViewAttemptsModal(null); setQuizAttempts([]); }}
        title={`Quiz Attempts — ${viewAttemptsModal?.title || ""}`}
        maxWidth={640}
      >
        {loadingAttempts ? (
          <div style={{ padding: 24, textAlign: "center" }} className="text-muted">Loading attempts...</div>
        ) : quizAttempts.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center" }} className="text-muted">No attempts yet.</div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {quizAttempts.map((att) => {
                  const percent = att.score && viewAttemptsModal?.total_marks ? Math.round((att.score / viewAttemptsModal.total_marks) * 100) : 0;
                  const passed = att.score >= ((viewAttemptsModal?.passing_marks ?? 40) / 100) * (viewAttemptsModal?.total_marks ?? 10);
                  return (
                    <tr key={att.id}>
                      <td>
                        <strong>{att.student?.name || "Student"}</strong>
                        <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{att.student?.email}</div>
                      </td>
                      <td>{att.submitted_at ? new Date(att.submitted_at).toLocaleDateString() : (att.started_at ? "In Progress" : "—")}</td>
                      <td>
                        <strong>{att.score}</strong> / {viewAttemptsModal?.total_marks || 0} ({percent}%)
                      </td>
                      <td>
                        <Badge variant={passed ? "published" : "draft"}>
                          {passed ? "Passed" : "Failed"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
