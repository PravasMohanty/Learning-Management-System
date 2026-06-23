"use client";

import { use, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { courseAPI, moduleAPI, assignmentAPI, quizAPI } from "@/lib/api";
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
} from "lucide-react";

const moduleSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  position: z.coerce.number().min(1).optional(),
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
    } catch (err) {
      toast.error(err.message || "Failed to create quiz");
    }
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
    </PageContainer>
  );
}
