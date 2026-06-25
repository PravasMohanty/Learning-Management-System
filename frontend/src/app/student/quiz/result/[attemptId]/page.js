"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { quizAPI } from "@/lib/api";
import PageContainer from "@/components/layout/PageContainer";
import Badge from "@/components/ui/Badge";
import { SkeletonLine } from "@/components/ui/Skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, Award, Calendar, RefreshCw } from "lucide-react";

export default function QuizResultPage({ params }) {
  const { attemptId } = use(params);
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["quiz-result-details", attemptId],
    queryFn: () => quizAPI.getAttempt(attemptId),
    enabled: !!attemptId,
  });

  const attempt = data?.data?.attempt;
  const quiz = attempt?.quiz;
  const questions = data?.data?.questions || [];

  if (isLoading) {
    return (
      <PageContainer title="Loading Results" subtitle="Fetching your scorecard...">
        <div className="card">
          <div className="card-body">
            <SkeletonLine width="50%" />
            <SkeletonLine width="80%" />
            <SkeletonLine width="30%" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isError || !attempt || !quiz) {
    return (
      <PageContainer title="Results Not Found">
        <div className="card text-center" style={{ padding: 40 }}>
          <XCircle size={48} style={{ color: "var(--color-error)", margin: "0 auto 16px" }} />
          <h3>Failed to load results</h3>
          <p className="text-muted" style={{ marginTop: 8 }}>We couldn't retrieve the quiz attempt details.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => router.back()}>Go Back</button>
        </div>
      </PageContainer>
    );
  }

  const totalQuestions = questions.length;
  const correctCount = questions.filter(q => q.is_correct).length;
  const incorrectCount = totalQuestions - correctCount;
  const scorePercent = quiz.total_marks ? Math.round((attempt.score / quiz.total_marks) * 100) : 0;
  const passed = attempt.score >= (quiz.passing_marks / 100) * quiz.total_marks;

  return (
    <PageContainer
      title="Quiz Performance Report"
      subtitle={quiz.title}
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/student/quiz/${quiz.id}`} className="btn btn-outline">
            <RefreshCw size={16} /> Try Again
          </Link>
          <Link href={`/student/quiz/${quiz.id}`} className="btn btn-outline">
            <ArrowLeft size={16} /> Back to Quiz
          </Link>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 840, margin: "0 auto" }}>
        
        {/* Scorecard Hero Board */}
        <div
          className="card"
          style={{
            background: passed 
              ? "linear-gradient(135deg, var(--color-success-bg) 0%, rgba(255,255,255,1) 100%)" 
              : "linear-gradient(135deg, var(--color-error-bg) 0%, rgba(255,255,255,1) 100%)",
            borderColor: passed ? "var(--color-success)" : "var(--color-error)",
            padding: 32,
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 24
            }}
          >
            <div>
              <Badge variant={passed ? "completed" : "locked"}>
                {passed ? "PASSED" : "FAILED"}
              </Badge>
              <h2 style={{ fontSize: 28, marginTop: 12, marginBottom: 8, color: "var(--color-text)" }}>
                {passed ? "Congratulations!" : "Keep learning!"}
              </h2>
              <p className="text-muted text-sm" style={{ maxWidth: 460 }}>
                {passed 
                  ? "You have successfully completed this assessment and met the passing criteria." 
                  : "You did not meet the passing marks for this attempt. Review your answers below and try again."}
              </p>
            </div>

            {/* Score Ring */}
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                border: `6px solid ${passed ? "var(--color-success)" : "var(--color-error)"}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--color-bg-white)",
                boxShadow: "var(--shadow-md)"
              }}
            >
              <span style={{ fontSize: 32, fontWeight: 800, color: "var(--color-text)", lineHeight: 1 }}>
                {scorePercent}%
              </span>
              <span style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 4, fontWeight: 600 }}>
                {attempt.score} / {quiz.total_marks} PTS
              </span>
            </div>
          </div>
        </div>

        {/* Stats Board */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center" style={{ padding: 16 }}>
            <Award size={20} className="text-success" style={{ margin: "0 auto 4px" }} />
            <div className="text-xs text-muted">Correct Answers</div>
            <h4 style={{ marginTop: 2 }}>{correctCount}</h4>
          </div>
          <div className="card text-center" style={{ padding: 16 }}>
            <XCircle size={20} className="text-error" style={{ margin: "0 auto 4px" }} />
            <div className="text-xs text-muted">Incorrect Answers</div>
            <h4 style={{ marginTop: 2 }}>{incorrectCount}</h4>
          </div>
          <div className="card text-center" style={{ padding: 16 }}>
            <Calendar size={20} className="text-muted" style={{ margin: "0 auto 4px" }} />
            <div className="text-xs text-muted">Passing Score Required</div>
            <h4 style={{ marginTop: 2 }}>{quiz.passing_marks}% ({Math.ceil((quiz.passing_marks / 100) * quiz.total_marks)} marks)</h4>
          </div>
        </div>

        {/* Detailed Questions Review */}
        <div>
          <h3 style={{ marginBottom: 16 }}>Review Answers</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {questions.map((q, idx) => {
              return (
                <div
                  key={q.id}
                  className="card"
                  style={{
                    borderLeft: `4px solid ${q.is_correct ? "var(--color-success)" : "var(--color-error)"}`
                  }}
                >
                  <div className="card-body">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-muted)" }}>
                        Question {idx + 1}
                      </span>
                      <Badge variant={q.is_correct ? "completed" : "locked"}>
                        {q.is_correct ? "Correct (+1 mark)" : "Incorrect (0 marks)"}
                      </Badge>
                    </div>

                    <h4 style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)", marginBottom: 16, lineHeight: 1.4 }}>
                      {q.question}
                    </h4>

                    {/* Options Breakdown */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[
                        { key: "A", text: q.option_a },
                        { key: "B", text: q.option_b },
                        { key: "C", text: q.option_c },
                        { key: "D", text: q.option_d }
                      ].map((opt) => {
                        const isStudentChoice = q.selected_option === opt.key;
                        const isCorrectAnswer = q.correct_option === opt.key;

                        let border = "1px solid var(--color-border)";
                        let bg = "var(--color-bg-white)";
                        let icon = null;

                        if (isCorrectAnswer) {
                          border = "1px solid var(--color-success)";
                          bg = "var(--color-success-bg)";
                          icon = <CheckCircle size={16} className="text-success" style={{ marginLeft: "auto" }} />;
                        } else if (isStudentChoice && !isCorrectAnswer) {
                          border = "1px solid var(--color-error)";
                          bg = "var(--color-error-bg)";
                          icon = <XCircle size={16} className="text-error" style={{ marginLeft: "auto" }} />;
                        }

                        return (
                          <div
                            key={opt.key}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              padding: "10px 14px",
                              border: border,
                              borderRadius: "var(--radius-md)",
                              background: bg,
                              fontSize: 14,
                              gap: 12
                            }}
                          >
                            <span
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                backgroundColor: isStudentChoice 
                                  ? (isCorrectAnswer ? "var(--color-success)" : "var(--color-error)") 
                                  : "var(--color-bg)",
                                color: isStudentChoice ? "#fff" : "var(--color-text-secondary)",
                                display: "flex",
                                alignItems: "center",
                                justifyContext: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                fontWeight: 700,
                                flexShrink: 0
                              }}
                            >
                              {opt.key}
                            </span>
                            <span style={{ color: "var(--color-text)", fontWeight: isStudentChoice || isCorrectAnswer ? 500 : 400 }}>
                              {opt.text}
                            </span>
                            {isStudentChoice && !isCorrectAnswer && (
                              <span style={{ fontSize: 12, color: "var(--color-error)", fontStyle: "italic", marginLeft: 8 }}>
                                Your Answer
                              </span>
                            )}
                            {isCorrectAnswer && (
                              <span style={{ fontSize: 12, color: "var(--color-success)", fontWeight: 600, marginLeft: 8 }}>
                                Correct Answer
                              </span>
                            )}
                            {icon}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
