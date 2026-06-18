"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { assignmentAPI } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PageContainer from "@/components/layout/PageContainer";
import { Textarea } from "@/components/ui/Input";
import { SkeletonLine } from "@/components/ui/Skeleton";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Send, CheckCircle } from "lucide-react";

const submitSchema = z.object({
  content: z.string().min(1, "Submission content is required"),
  attachment_url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
});

export default function AssignmentDetailPage({ params }) {
  const { assignmentId } = use(params);
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: () => assignmentAPI.getById(assignmentId),
    enabled: !!assignmentId,
  });

  const assignment = data?.data;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(submitSchema),
    defaultValues: { content: "", attachment_url: "" },
  });

  const mutation = useMutation({
    mutationFn: (formData) => assignmentAPI.submit(assignmentId, formData),
    onSuccess: (res) => {
      if (!res.success) { toast.error(res.message); return; }
      toast.success("Assignment submitted successfully");
      setSubmitted(true);
    },
    onError: (err) => toast.error(err.message || "Submission failed"),
  });

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
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {assignment?.max_marks && (
                  <div>
                    <span className="text-sm text-muted">Max Marks: </span>
                    <span className="font-semibold">{assignment.max_marks}</span>
                  </div>
                )}
                {assignment?.due_date && (
                  <div>
                    <span className="text-sm text-muted">Due Date: </span>
                    <span className="font-semibold">
                      {new Date(assignment.due_date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
              {assignment?.attachment_url && (
                <div style={{ marginTop: 12 }}>
                  <a
                    href={assignment.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                  >
                    View Attachment
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Submission Form */}
          {submitted ? (
            <div className="card">
              <div className="card-body" style={{ textAlign: "center", padding: 40 }}>
                <CheckCircle size={40} style={{ color: "var(--color-success)", marginBottom: 12 }} />
                <h3 style={{ marginBottom: 4 }}>Submitted!</h3>
                <p className="text-muted">Your assignment has been submitted successfully.</p>
                <Link href="/student/assignments" className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>
                  Back to Assignments
                </Link>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h4>Submit Your Work</h4>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate>
                  <Textarea
                    label="Your Answer / Submission"
                    placeholder="Write your response here..."
                    error={errors.content?.message}
                    style={{ minHeight: 160 }}
                    {...register("content")}
                  />
                  <div className="form-group">
                    <label className="form-label">
                      Attachment URL <span className="form-label-optional">(optional)</span>
                    </label>
                    <input
                      className={`form-input ${errors.attachment_url ? "error" : ""}`}
                      placeholder="https://drive.google.com/..."
                      {...register("attachment_url")}
                    />
                    {errors.attachment_url && (
                      <div className="form-error">{errors.attachment_url.message}</div>
                    )}
                    <div className="form-hint">Link to any supporting files (Google Drive, Dropbox, etc.)</div>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={mutation.isPending}
                  >
                    <Send size={16} />
                    {mutation.isPending ? "Submitting..." : "Submit Assignment"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
