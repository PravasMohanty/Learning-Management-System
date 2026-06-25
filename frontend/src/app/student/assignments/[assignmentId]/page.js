"use client";

import { use, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assignmentAPI } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PageContainer from "@/components/layout/PageContainer";
import { SkeletonLine } from "@/components/ui/Skeleton";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Send, CheckCircle, Clock, FileText, ExternalLink } from "lucide-react";

const submitSchema = z.object({
  submission_url: z.string().url("Must be a valid URL (e.g. https://drive.google.com/...)"),
});

export default function AssignmentDetailPage({ params }) {
  const { assignmentId } = use(params);
  const queryClient = useQueryClient();
  const [isResubmitting, setIsResubmitting] = useState(false);

  const { data: assignmentData, isLoading: loadingAssignment } = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: () => assignmentAPI.getById(assignmentId),
    enabled: !!assignmentId,
  });

  const { data: submissionData, isLoading: loadingSubmission, refetch: refetchSubmission } = useQuery({
    queryKey: ["assignment-submission", assignmentId],
    queryFn: () => assignmentAPI.getMySubmission(assignmentId),
    enabled: !!assignmentId,
  });

  const assignment = assignmentData?.data;
  const submission = submissionData?.data;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(submitSchema),
    defaultValues: { submission_url: "" },
  });

  // Prepopulate URL if resubmitting
  useEffect(() => {
    if (submission?.submission_url) {
      setValue("submission_url", submission.submission_url);
    }
  }, [submission, setValue]);

  const mutation = useMutation({
    mutationFn: (formData) => assignmentAPI.submit(assignmentId, formData),
    onSuccess: (res) => {
      if (!res.success) { toast.error(res.message); return; }
      toast.success("Assignment submitted successfully");
      setIsResubmitting(false);
      queryClient.invalidateQueries({ queryKey: ["assignment-submission", assignmentId] });
      refetchSubmission();
    },
    onError: (err) => toast.error(err.message || "Submission failed"),
  });

  const isLoading = loadingAssignment || loadingSubmission;

  return (
    <PageContainer
      title={isLoading ? "Loading..." : assignment?.title || "Assignment"}
      subtitle={isLoading ? "" : assignment?.description}
      actions={
        <Link href="/student/assignments" className="btn btn-outline">
          <ArrowLeft size={16} /> Back to Assignments
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
          {/* Assignment Info */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
                {assignment?.max_marks && (
                  <div>
                    <span className="text-sm text-muted">Max Marks: </span>
                    <span className="font-semibold" style={{ fontSize: 16 }}>{assignment.max_marks}</span>
                  </div>
                )}
                {assignment?.due_date && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={16} className="text-muted" />
                    <span className="text-sm text-muted">Due Date: </span>
                    <span className="font-semibold">
                      {new Date(assignment.due_date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submission and Grading State */}
          {submission && !isResubmitting ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Submission Details Card */}
              <div className="card">
                <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4>Your Submission</h4>
                  <Badge variant={submission.status === "graded" ? "completed" : "pending"}>
                    {submission.status === "graded" ? "Graded" : "Submitted"}
                  </Badge>
                </div>
                <div className="card-body">
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <div className="text-sm text-muted" style={{ marginBottom: 4 }}>Submission Link:</div>
                      <a
                        href={submission.submission_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "underline" }}
                      >
                        {submission.submission_url} <ExternalLink size={14} />
                      </a>
                    </div>
                    <div>
                      <div className="text-sm text-muted" style={{ marginBottom: 4 }}>Submitted on:</div>
                      <div className="font-medium">
                        {new Date(submission.submitted_at).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                    </div>
                    {submission.status !== "graded" && (
                      <div style={{ marginTop: 8 }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setIsResubmitting(true)}
                        >
                          Edit Submission
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Feedback Card if Graded */}
              {submission.status === "graded" && (
                <div className="card" style={{ borderColor: "var(--color-success)" }}>
                  <div className="card-header" style={{ background: "var(--color-success-bg)" }}>
                    <h4 style={{ color: "var(--color-success)" }}>Grade & Feedback</h4>
                  </div>
                  <div className="card-body">
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div>
                        <span className="text-muted">Grade Awarded: </span>
                        <strong style={{ fontSize: 20, color: "var(--color-success)" }}>
                          {submission.marks}
                        </strong>
                        <span className="text-muted"> / {assignment?.max_marks || 100} marks</span>
                      </div>
                      {submission.feedback ? (
                        <div>
                          <div className="text-sm text-muted" style={{ marginBottom: 4 }}>Instructor Feedback:</div>
                          <div
                            style={{
                              padding: 12,
                              background: "var(--color-bg)",
                              borderRadius: 6,
                              lineHeight: 1.6,
                              fontStyle: "italic"
                            }}
                          >
                            "{submission.feedback}"
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted text-sm">No feedback text provided.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Submission Form */
            <div className="card">
              <div className="card-header">
                <h4>{isResubmitting ? "Edit Your Submission" : "Submit Your Work"}</h4>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate>
                  <div className="form-group">
                    <label className="form-label">
                      Submission URL Link <span className="text-error">*</span>
                    </label>
                    <input
                      className={`form-input ${errors.submission_url ? "error" : ""}`}
                      placeholder="e.g. https://drive.google.com/drive/folders/... or link to your work"
                      {...register("submission_url")}
                    />
                    {errors.submission_url && (
                      <div className="form-error">{errors.submission_url.message}</div>
                    )}
                    <div className="form-hint" style={{ marginTop: 8 }}>
                      Please provide a valid, public URL (Google Drive, GitHub repo, public PDF, etc.) where instructors can view your work.
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={mutation.isPending}
                    >
                      <Send size={16} />
                      {mutation.isPending ? "Submitting..." : (isResubmitting ? "Update Submission" : "Submit Assignment")}
                    </button>
                    {isResubmitting && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setIsResubmitting(false)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
