"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import toast from "react-hot-toast";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      const response = await login(data.email, data.password);
      toast.success("Login successful");

      const role = response.data.user.role;
      router.push(role === "admin" ? "/admin/dashboard" : "/student/dashboard");
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-text">
            RESO <span className="auth-logo-accent">LMS</span>
          </div>
        </div>

        <h1 className="auth-title">Sign In</h1>
        <p className="auth-subtitle">Enter your credentials to access your account</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input
            label="Email Address"
            type="email"
            placeholder="you@institution.edu"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />

          <div style={{ textAlign: "right", marginBottom: 20, marginTop: -8 }}>
            <Link
              href="/auth/forgot-password"
              style={{ fontSize: 13, color: "var(--color-primary)" }}
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register">Request Access</Link>
        </div>
      </div>
    </div>
  );
}
