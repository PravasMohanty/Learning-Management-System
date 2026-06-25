"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quizAPI } from "@/lib/api";
import PageContainer from "@/components/layout/PageContainer";
import Badge from "@/components/ui/Badge";
import { SkeletonLine } from "@/components/ui/Skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Play, Award, Clock, HelpCircle, Calendar, Eye, Activity } from "lucide-react";

export default function StudentQuizDetailPage({ params }) {
  const { quizId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: quizData, isLoading: loadingQuiz } = useQuery({
    queryKey: ["quiz-student-details", quizId],
    queryFn: () => quizAPI.getByIdStudent(quizId),
    enabled: !!quizId,
  });

  const { data: attemptsData, isLoading: loadingAttempts } = useQuery({
    queryKey: ["quiz-my-attempts", quizId],
    queryFn: () => quizAPI.getMyAttempts(quizId),
    enabled: !!quizId,
  });

  const quiz = quizData?.data;
  const attempts = attemptsData?.data || [];

  // Check if there is an active (uncompleted) attempt
  const activeAttempt = attempts.find(att => !att.completed);

  const startMutation = useMutation({
    mutationFn: () => quizAPI.startAttempt(quizId),
    onSuccess: (res) => {
      if (!res.success) { toast.error(res.message); return; }
      toast.success("Attempt started!");
      router.push(`/student/quiz/attempt/${res.data.attempt.id}`);
    },
    onError: (err) => toast.error(err.message || "Failed to start quiz"),
  });

  const handleStartQuiz = () => {
    if (activeAttempt) {
      router.push(`/student/quiz/attempt/${activeAttempt.id}`);
    } else {
      if (confirm("Are you sure you want to start the quiz? The timer will start immediately.")) {
        startMutation.mutate();
      }
    }
  };

  const isLoading = loadingQuiz || loadingAttempts;

  return (
    <PageContainer
      title={isLoading ? "Loading..." : quiz?.title || "Quiz"}
      subtitle={isLoading ? "" : quiz?.description || "Take this assessment to test your understanding."}
      actions={
        <button onClick={() => router.back()} className="btn btn-outline">
          <ArrowLeft size={16} /> Back
        </button>
      }
    >
      {isLoading ? (
        <div className="card">
          <div className="card-body">
            <SkeletonLine width="60%" />
            <SkeletonLine width="80%" />
            <SkeletonLine width="40%" />
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Quiz Details Panel */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center" style={{ padding: 20 }}>
              <HelpCircle size={32} className="text-primary" style={{ margin: "0 auto 8px" }} />
              <div className="text-sm text-muted">Questions</div>
              <h3 style={{ marginTop: 4 }}>{quiz?.questions?.length || 0}</h3>
            </div>
            <div className="card text-center" style={{ padding: 20 }}>
              <Clock size={32} style={{ color: "var(--color-warning)", margin: "0 auto 8px" }} />
              <div className="text-sm text-muted">Time Limit</div>
              <h3 style={{ marginTop: 4 }}>{quiz?.time_limit ? `${quiz.time_limit} min` : "No Limit"}</h3>
            </div>
            <div className="card text-center" style={{ padding: 20 }}>
              <Award size={32} style={{ color: "var(--color-success)", margin: "0 auto 8px" }} />
              <div className="text-sm text-muted">Passing Percentage</div>
              <h3 style={{ marginTop: 4 }}>{quiz?.passing_marks}% ({Math.ceil(((quiz?.passing_marks || 40) / 100) * (quiz?.total_marks || 0))} marks)</h3>
            </div>
          </div>

          {/* Action Trigger Card */}
          <div className="card" style={{ borderLeft: "4px solid var(--color-primary)" }}>
            <div className="card-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div>
                <h4 style={{ marginBottom: 4 }}>Ready to begin?</h4>
                <p className="text-muted text-sm">
                  {activeAttempt 
                    ? "You have an active session in progress. Click below to resume it." 
                    : "Make sure you have a stable connection. You can retake the quiz to improve your score."}
                </p>
              </div>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleStartQuiz}
                disabled={startMutation.isPending}
              >
                {activeAttempt ? (
                  <>
                    <Activity size={18} /> Resume Attempt
                  </>
                ) : (
                  <>
                    <Play size={18} /> Start Quiz
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Attempt History */}
          <div className="card">
            <div className="card-header">
              <h4>Your Attempt History</h4>
            </div>
            {attempts.length === 0 ? (
              <div className="card-body text-center text-muted" style={{ padding: "40px 20px" }}>
                <Calendar size={32} style={{ margin: "0 auto 12px", color: "var(--color-muted)" }} />
                <p>You have not attempted this quiz yet.</p>
              </div>
            ) : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Attempt Date</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((att) => {
                      const percent = quiz?.total_marks ? Math.round((att.score / quiz.total_marks) * 100) : 0;
                      const passed = att.score >= ((quiz?.passing_marks || 40) / 100) * (quiz?.total_marks || 100);
                      return (
                        <tr key={att.id}>
                          <td>
                            {new Date(att.started_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </td>
                          <td>
                            {att.completed ? (
                              <span>
                                <strong>{att.score}</strong> / {quiz?.total_marks || 10} ({percent}%)
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td>
                            {att.completed ? (
                              <Badge variant={passed ? "completed" : "locked"}>
                                {passed ? "Passed" : "Failed"}
                              </Badge>
                            ) : (
                              <Badge variant="in-progress">In Progress</Badge>
                            )}
                          </td>
                          <td>
                            {att.completed ? (
                              <Link
                                href={`/student/quiz/result/${att.id}`}
                                className="btn btn-sm btn-outline"
                                style={{ display: "inline-flex", gap: 4 }}
                              >
                                <Eye size={14} /> Review Details
                              </Link>
                            ) : (
                              <Link
                                href={`/student/quiz/attempt/${att.id}`}
                                className="btn btn-sm btn-primary"
                                style={{ display: "inline-flex", gap: 4 }}
                              >
                                <Activity size={14} /> Resume
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
