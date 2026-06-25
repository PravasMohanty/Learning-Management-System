"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assignmentAPI } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PageContainer from "@/components/layout/PageContainer";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Plus, Eye, Trash2, Award } from "lucide-react";

const assignmentSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  due_date: z.string().optional(),
  max_marks: z.coerce.number().min(0).optional(),
});

const gradeSchema = z.object({
  marks: z.coerce.number().min(0, "Marks are required"),
  feedback: z.string().optional(),
});

export default function CourseAssignmentsPage({ params }) {
  const { courseId } = use(params);
  const queryClient = useQueryClient();
  const [createModal, setCreateModal] = useState(false);
  const [submissionsModal, setSubmissionsModal] = useState(null);
  const [gradeModal, setGradeModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["course-assignments", courseId],
    queryFn: () => assignmentAPI.getAll(courseId),
    enabled: !!courseId,
  });

  const assignments = data?.data || [];

  const createForm = useForm({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { title: "", description: "", due_date: "", max_marks: 100 },
  });

  const gradeForm = useForm({
    resolver: zodResolver(gradeSchema),
    defaultValues: { marks: 0, feedback: "" },
  });

  const createMutation = useMutation({
    mutationFn: (formData) => assignmentAPI.create({ ...formData, course_id: courseId }),
    onSuccess: (res) => {
      if (!res.success) { toast.error(res.message); return; }
      queryClient.invalidateQueries({ queryKey: ["course-assignments", courseId] });
      toast.success("Assignment created");
      setCreateModal(false);
      createForm.reset();
    },
    onError: (err) => toast.error(err.message || "Failed to create assignment"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => assignmentAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-assignments", courseId] });
      toast.success("Assignment deleted");
      setDeleteModal(null);
    },
    onError: (err) => toast.error(err.message || "Failed to delete"),
  });

  const gradeMutation = useMutation({
    mutationFn: ({ submissionId, data: gradeData }) => assignmentAPI.gradeSubmission(submissionId, gradeData),
    onSuccess: () => {
      toast.success("Submission graded");
      setGradeModal(null);
      gradeForm.reset();
      // Refresh submissions
      if (submissionsModal) viewSubmissions(submissionsModal);
    },
    onError: (err) => toast.error(err.message || "Failed to grade"),
  });

  const viewSubmissions = async (assignment) => {
    setSubmissionsModal(assignment);
    setLoadingSubs(true);
    try {
      const res = await assignmentAPI.getSubmissions(assignment.id);
      setSubmissions(res.data || []);
    } catch {
      toast.error("Failed to load submissions");
    } finally {
      setLoadingSubs(false);
    }
  };

  const columns = [
    { header: "Title", accessor: "title" },
    {
      header: "Max Marks",
      accessor: "max_marks",
      cell: (row) => row.max_marks ?? "—",
    },
    {
      header: "Due Date",
      accessor: "due_date",
      cell: (row) => row.due_date ? new Date(row.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
    },
    {
      header: "Created",
      accessor: "created_at",
      cell: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—",
    },
    {
      header: "Actions",
      accessor: null,
      sortable: false,
      width: "120px",
      cell: (row) => (
        <div className="data-table-actions">
          <button className="btn-icon" title="View submissions" onClick={() => viewSubmissions(row)}>
            <Eye size={16} />
          </button>
          <button className="btn-icon" title="Delete" style={{ color: "var(--color-error)" }} onClick={() => setDeleteModal(row)}>
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Assignments"
      subtitle="Manage assignments for this course"
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={() => setCreateModal(true)}>
            <Plus size={16} /> Create Assignment
          </button>
          <Link href={`/admin/courses/${courseId}`} className="btn btn-outline">
            <ArrowLeft size={16} /> Back
          </Link>
        </div>
      }
    >
      <DataTable
        columns={columns}
        data={assignments}
        loading={isLoading}
        searchPlaceholder="Search assignments..."
        emptyTitle="No assignments"
        emptyDescription="Create an assignment for this course."
      />

      {/* Create Assignment Modal */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Create Assignment"
        maxWidth={520}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setCreateModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={createForm.handleSubmit((d) => createMutation.mutate(d))} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </button>
          </>
        }
      >
        <Input label="Title" error={createForm.formState.errors.title?.message} {...createForm.register("title")} />
        <Textarea label="Description" optional error={createForm.formState.errors.description?.message} {...createForm.register("description")} />
        <div className="form-row">
          <Input label="Due Date" type="date" optional {...createForm.register("due_date")} />
          <Input label="Max Marks" type="number" {...createForm.register("max_marks")} />
        </div>
      </Modal>

      {/* Submissions Modal */}
      <Modal
        isOpen={!!submissionsModal}
        onClose={() => { setSubmissionsModal(null); setSubmissions([]); }}
        title={`Submissions — ${submissionsModal?.title || ""}`}
        maxWidth={640}
      >
        {loadingSubs ? (
          <div style={{ padding: 24, textAlign: "center" }} className="text-muted">Loading submissions...</div>
        ) : submissions.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center" }} className="text-muted">No submissions yet.</div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Submitted</th>
                  <th>Submission</th>
                  <th>Marks</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <strong>{sub.student?.name || "Student"}</strong>
                      <div style={{ fontSize: 11, color: "var(--color-muted)" }}>{sub.student?.email}</div>
                    </td>
                    <td>{sub.submitted_at || sub.created_at ? new Date(sub.submitted_at || sub.created_at).toLocaleDateString() : "—"}</td>
                    <td>
                      {sub.submission_url ? (
                        <a
                          href={sub.submission_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline"
                          style={{ display: "inline-flex", gap: 4 }}
                        >
                          View Work
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>{sub.marks != null ? `${sub.marks} marks` : <span className="text-muted">Ungraded</span>}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => {
                          gradeForm.reset({ marks: sub.marks || 0, feedback: sub.feedback || "" });
                          setGradeModal(sub);
                        }}
                      >
                        <Award size={14} /> Grade
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* Grade Modal */}
      <Modal
        isOpen={!!gradeModal}
        onClose={() => setGradeModal(null)}
        title="Grade Submission"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setGradeModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={gradeForm.handleSubmit((d) => gradeMutation.mutate({ submissionId: gradeModal.id, data: d }))} disabled={gradeMutation.isPending}>
              {gradeMutation.isPending ? "Saving..." : "Save Grade"}
            </button>
          </>
        }
      >
        <Input label="Marks" type="number" error={gradeForm.formState.errors.marks?.message} {...gradeForm.register("marks")} />
        <Textarea label="Feedback" optional {...gradeForm.register("feedback")} />
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Assignment"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setDeleteModal(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => deleteMutation.mutate(deleteModal.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          </>
        }
      >
        <p>Delete <strong>{deleteModal?.title}</strong>? This cannot be undone.</p>
      </Modal>
    </PageContainer>
  );
}
