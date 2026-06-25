"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { authAPI } from "@/lib/api";
import Link from "next/link";
import toast from "react-hot-toast";

const emailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

const resetSchema = z.object({
  otp: z.string().min(1, "OTP is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: email, 2: OTP + new password
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { otp: "", newPassword: "" },
  });

  const onSendOTP = async (data) => {
    try {
      setSubmitting(true);
      const response = await authAPI.forgotPassword(data.email);
      if (!response.success) throw new Error(response.message);
      setEmail(data.email);
      setStep(2);
      toast.success("OTP sent to your email");
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setSubmitting(false);
    }
  };

  const onResetPassword = async (data) => {
    try {
      setSubmitting(true);
      const response = await authAPI.forgotPassword(email, data.otp, data.newPassword);
      if (!response.success) throw new Error(response.message);
      toast.success("Password reset successful");
      setStep(3);
    } catch (err) {
      toast.error(err.message || "Failed to reset password");
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

        {step === 1 && (
          <>
            <h1 className="auth-title">Forgot Password</h1>
            <p className="auth-subtitle">
              Enter your email address and we&apos;ll send you an OTP to reset your password
            </p>
            <form onSubmit={emailForm.handleSubmit(onSendOTP)} noValidate>
              <Input
                label="Email Address"
                type="email"
                placeholder="you@institution.edu"
                error={emailForm.formState.errors.email?.message}
                {...emailForm.register("email")}
              />
              <button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={submitting}
              >
                {submitting ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="auth-title">Reset Password</h1>
            <p className="auth-subtitle">
              Enter the OTP sent to <strong>{email}</strong> and your new password
            </p>
            <form onSubmit={resetForm.handleSubmit(onResetPassword)} noValidate>
              <Input
                label="OTP Code"
                placeholder="Enter OTP from your email"
                error={resetForm.formState.errors.otp?.message}
                {...resetForm.register("otp")}
              />
              <Input
                label="New Password"
                type="password"
                placeholder="Enter new password"
                error={resetForm.formState.errors.newPassword?.message}
                {...resetForm.register("newPassword")}
              />
              <button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={submitting}
              >
                {submitting ? "Resetting..." : "Reset Password"}
              </button>
            </form>
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <button
                className="btn btn-ghost text-sm"
                onClick={() => {
                  setStep(1);
                  resetForm.reset();
                }}
                type="button"
              >
                ← Back to email
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <h2 style={{ marginBottom: 8 }}>Password Reset</h2>
            <p className="text-muted" style={{ marginBottom: 24 }}>
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <Link href="/auth/login" className="btn btn-primary">
              Go to Sign In
            </Link>
          </div>
        )}

        {step !== 3 && (
          <div className="auth-footer">
            Remember your password? <Link href="/auth/login">Sign In</Link>
          </div>
        )}
      </div>
    </div>
  );
}
