"use client";

import { use, useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { quizAPI } from "@/lib/api";
import PageContainer from "@/components/layout/PageContainer";
import { SkeletonLine } from "@/components/ui/Skeleton";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Clock, ChevronLeft, ChevronRight, Send, AlertTriangle } from "lucide-react";

export default function QuizAttemptPage({ params }) {
  const { attemptId } = use(params);
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [question_id]: 'A'/'B'/'C'/'D' }
  const [timeLeft, setTimeLeft] = useState(null); // in seconds
  const timerRef = useRef(null);
  const isSubmittingRef = useRef(false);

  // Fetch attempt details (includes quiz info and questions)
  const { data, isLoading, isError } = useQuery({
    queryKey: ["quiz-attempt-details", attemptId],
    queryFn: () => quizAPI.getAttempt(attemptId),
    enabled: !!attemptId,
    refetchOnWindowFocus: false,
  });

  const attempt = data?.data?.attempt;
  const questions = data?.data?.questions || [];
  const quiz = attempt?.quiz;

  // Handle redirect if attempt is already completed
  useEffect(() => {
    if (attempt?.completed) {
      router.replace(`/student/quiz/result/${attemptId}`);
    }
  }, [attempt, attemptId, router]);

  // Load existing answers if page reloaded
  // Note: the backend returns answers that are already filled if we query them.
  // In getQuizAttempt, we fetch chosen answers, so let's pre-populate the selectedAnswers state!
  useEffect(() => {
    if (questions.length > 0) {
      const initialAnswers = {};
      questions.forEach((q) => {
        if (q.selected_option) {
          initialAnswers[q.id] = q.selected_option;
        }
      });
      setSelectedAnswers(initialAnswers);
    }
  }, [questions]);

  // Setup countdown timer
  useEffect(() => {
    if (!quiz || !attempt || attempt.completed) return;

    if (quiz.time_limit) {
      const timeLimitSec = quiz.time_limit * 60;
      const startedAt = new Date(attempt.started_at).getTime();
      const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
      const remainingSec = Math.max(0, timeLimitSec - elapsedSec);

      setTimeLeft(remainingSec);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // Trigger automatic submit when time runs out
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quiz, attempt]);

  const submitMutation = useMutation({
    mutationFn: (answersPayload) => quizAPI.submitAttempt(attemptId, answersPayload),
    onSuccess: (res) => {
      if (!res.success) throw new Error(res.message);
      toast.success("Quiz submitted successfully!");
      router.push(`/student/quiz/result/${attemptId}`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit quiz");
      isSubmittingRef.current = false;
    },
  });

  const getAnswersPayload = () => {
    return Object.entries(selectedAnswers).map(([qId, val]) => ({
      question_id: qId,
      selected_option: val,
    }));
  };

  const handleManualSubmit = () => {
    const unansweredCount = questions.length - Object.keys(selectedAnswers).length;
    let confirmMsg = "Are you sure you want to submit your answers?";
    if (unansweredCount > 0) {
      confirmMsg = `You have ${unansweredCount} unanswered questions. Are you sure you want to submit?`;
    }

    if (confirm(confirmMsg)) {
      isSubmittingRef.current = true;
      submitMutation.mutate(getAnswersPayload());
    }
  };

  const handleAutoSubmit = () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    toast.error("Time limit exceeded! Submitting your answers...", { duration: 5000 });
    submitMutation.mutate(getAnswersPayload());
  };

  if (isLoading) {
    return (
      <PageContainer title="Attempting Quiz" subtitle="Please wait while questions load.">
        <div className="card">
          <div className="card-body">
            <SkeletonLine width="60%" />
            <SkeletonLine width="80%" />
            <SkeletonLine width="40%" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isError || !attempt || questions.length === 0) {
    return (
      <PageContainer title="Quiz Attempt Not Found">
        <div className="card text-center" style={{ padding: 40 }}>
          <AlertTriangle size={48} style={{ color: "var(--color-error)", margin: "0 auto 16px" }} />
          <h3>Error Loading Quiz</h3>
          <p className="text-muted" style={{ marginTop: 8 }}>We couldn't load the quiz session. Please return to the course page.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => router.back()}>Go Back</button>
        </div>
      </PageContainer>
    );
  }

  const currentQuestion = questions[currentIdx];
  const totalQuestions = questions.length;

  const handleSelectOption = (optionKey) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionKey,
    }));
  };

  // Format time display (MM:SS)
  const formatTime = (seconds) => {
    if (seconds == null) return "No Limit";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isTimeCritical = timeLeft != null && timeLeft < 60;

  return (
    <PageContainer
      title={quiz?.title || "Quiz"}
      subtitle={`Question ${currentIdx + 1} of ${totalQuestions}`}
      actions={
        timeLeft != null ? (
          <div
            className={`btn ${isTimeCritical ? "btn-danger" : "btn-outline"}`}
            style={{
              fontWeight: 700,
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 100,
              animation: isTimeCritical ? "pulse 1s infinite" : "none"
            }}
          >
            <Clock size={18} /> {formatTime(timeLeft)}
          </div>
        ) : null
      }
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gap: 24,
          alignItems: "start",
          maxWidth: 1080,
          margin: "0 auto"
        }}
      >
        {/* Main Question Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card">
            {/* Question Text */}
            <div className="card-body" style={{ padding: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)", marginBottom: 8, textTransform: "uppercase" }}>
                Question {currentIdx + 1}
              </div>
              <h3 style={{ fontSize: 18, lineHeight: 1.5, fontWeight: 600, color: "var(--color-text)", marginBottom: 28 }}>
                {currentQuestion?.question}
              </h3>

              {/* Options Grid */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { key: "A", text: currentQuestion?.option_a },
                  { key: "B", text: currentQuestion?.option_b },
                  { key: "C", text: currentQuestion?.option_c },
                  { key: "D", text: currentQuestion?.option_d }
                ].map((opt) => {
                  const isSelected = selectedAnswers[currentQuestion.id] === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelectOption(opt.key)}
                      style={{
                        width: "100%",
                        padding: "16px 20px",
                        textAlign: "left",
                        background: isSelected ? "var(--color-info-bg)" : "var(--color-bg-white)",
                        border: isSelected ? "2px solid var(--color-info)" : "1px solid var(--color-border)",
                        borderRadius: "var(--radius-lg)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        transition: "all var(--transition-fast)"
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = "var(--color-muted)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = "var(--color-border)";
                      }}
                    >
                      {/* Bubble */}
                      <span
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          backgroundColor: isSelected ? "var(--color-info)" : "var(--color-bg)",
                          color: isSelected ? "#fff" : "var(--color-text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 700,
                          flexShrink: 0
                        }}
                      >
                        {opt.key}
                      </span>
                      {/* Text */}
                      <span style={{ fontSize: 15, fontWeight: isSelected ? 600 : 400, color: "var(--color-text)" }}>
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              className="btn btn-outline"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => i - 1)}
            >
              <ChevronLeft size={16} /> Previous
            </button>

            {currentIdx < totalQuestions - 1 ? (
              <button
                className="btn btn-outline"
                onClick={() => setCurrentIdx((i) => i + 1)}
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleManualSubmit}
                disabled={submitMutation.isPending}
              >
                <Send size={16} /> Submit Exam
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Question Navigator */}
        <div className="card" style={{ padding: 20 }}>
          <h4 style={{ marginBottom: 12 }}>Question Guide</h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
              marginBottom: 20
            }}
          >
            {questions.map((q, idx) => {
              const isAnswered = !!selectedAnswers[q.id];
              const isActive = idx === currentIdx;

              let bg = "var(--color-bg)";
              let color = "var(--color-text-secondary)";
              let border = "1px solid var(--color-border)";

              if (isAnswered) {
                bg = "var(--color-primary)";
                color = "#fff";
                border = "1px solid var(--color-primary)";
              }
              if (isActive) {
                border = "2px solid var(--color-accent)";
                if (!isAnswered) {
                  bg = "var(--color-accent-light)";
                  color = "var(--color-primary)";
                }
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  style={{
                    height: 40,
                    borderRadius: "var(--radius-md)",
                    backgroundColor: bg,
                    color: color,
                    border: border,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "var(--color-muted)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "var(--color-primary)" }} /> Answered
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }} /> Unanswered
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, border: "2px solid var(--color-accent)", backgroundColor: "var(--color-bg)" }} /> Current Active
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </PageContainer>
  );
}
