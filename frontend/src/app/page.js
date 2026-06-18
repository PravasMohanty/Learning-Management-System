"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BookOpen, GraduationCap, Award } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push(user.role === "admin" ? "/admin/dashboard" : "/student/dashboard");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="skeleton skeleton-circle" style={{ width: 48, height: 48 }} />
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-primary)",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 540, width: "100%" }}>
        <h1
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: "#ffffff",
            marginBottom: 8,
            letterSpacing: 1,
          }}
        >
          RESO <span style={{ color: "var(--color-accent)" }}>LMS</span>
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.7)",
            marginBottom: 36,
            lineHeight: 1.6,
          }}
        >
          Institutional Learning Management Platform for course delivery, assessments, and certifications.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/auth/login"
            className="btn btn-accent btn-lg"
            style={{ minWidth: 160 }}
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="btn btn-lg"
            style={{
              minWidth: 160,
              backgroundColor: "transparent",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            Register
          </Link>
        </div>

        <div
          style={{
            marginTop: 56,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
        >
          {[
            { icon: BookOpen, label: "Courses", desc: "Comprehensive course materials" },
            { icon: GraduationCap, label: "Assessments", desc: "Assignments and quizzes" },
            { icon: Award, label: "Certificates", desc: "Verified certifications" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: "24px 16px",
                borderRadius: 6,
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <item.icon
                size={24}
                style={{ color: "var(--color-accent)", marginBottom: 10 }}
              />
              <div style={{ fontSize: 15, fontWeight: 600, color: "#ffffff", marginBottom: 4 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
