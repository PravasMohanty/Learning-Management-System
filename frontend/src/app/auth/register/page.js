"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { authAPI } from "@/lib/api";
import Link from "next/link";
import toast from "react-hot-toast";

const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
});

const adminSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  adminCode: z.string().min(1, "Admin code is required"),
});

export default function RegisterPage() {
  const [activeTab, setActiveTab] = useState("student");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const studentForm = useForm({
    resolver: zodResolver(studentSchema),
    defaultValues: { name: "", email: "" },
  });

  const adminForm = useForm({
    resolver: zodResolver(adminSchema),
    defaultValues: { name: "", email: "", password: "", adminCode: "" },
  });

  const onStudentSubmit = async (data) => {
    try {
      setSubmitting(true);
      const response = await authAPI.registerStudent(data.name, data.email);
      if (!response.success) throw new Error(response.message);
      toast.success("Registration request submitted");
      setSubmitted(true);
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onAdminSubmit = async (data) => {
    try {
      setSubmitting(true);
      const response = await authAPI.registerAdmin(
        data.name,
        data.email,
        data.password,
        data.adminCode
      );
      if (!response.success) throw new Error(response.message);
      toast.success("Admin account created. You can now sign in.");
      setSubmitted(true);
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div className="auth-logo">
            <div className="auth-logo-text">
              RESO <span className="auth-logo-accent">LMS</span>
            </div>
          </div>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
          <h2 style={{ marginBottom: 8 }}>
            {activeTab === "student" ? "Request Submitted" : "Account Created"}
          </h2>
          <p className="text-muted" style={{ marginBottom: 24 }}>
            {activeTab === "student"
              ? "Your registration request has been submitted. An administrator will review and approve your access."
              : "Your admin account has been created successfully. You can now sign in."}
          </p>
          <Link href="/auth/login" className="btn btn-primary">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-text">
            RESO <span className="auth-logo-accent">LMS</span>
          </div>
        </div>

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Register for access to the platform</p>

        <div className="tabs" style={{ marginBottom: 24 }}>
          <button
            className={`tab ${activeTab === "student" ? "active" : ""}`}
            onClick={() => setActiveTab("student")}
            type="button"
          >
            Student
          </button>
          <button
            className={`tab ${activeTab === "admin" ? "active" : ""}`}
            onClick={() => setActiveTab("admin")}
            type="button"
          >
            Admin
          </button>
        </div>

        {activeTab === "student" ? (
          <form onSubmit={studentForm.handleSubmit(onStudentSubmit)} noValidate>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              error={studentForm.formState.errors.name?.message}
              {...studentForm.register("name")}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="you@institution.edu"
              error={studentForm.formState.errors.email?.message}
              {...studentForm.register("email")}
            />
            <div className="alert alert-info" style={{ marginBottom: 20 }}>
              Your request will be reviewed by an administrator. You will receive an email once approved.
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        ) : (
          <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} noValidate>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              error={adminForm.formState.errors.name?.message}
              {...adminForm.register("name")}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="admin@institution.edu"
              error={adminForm.formState.errors.email?.message}
              {...adminForm.register("email")}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Create a password"
              error={adminForm.formState.errors.password?.message}
              {...adminForm.register("password")}
            />
            <Input
              label="Admin Code"
              type="password"
              placeholder="Enter the admin secret code"
              error={adminForm.formState.errors.adminCode?.message}
              {...adminForm.register("adminCode")}
            />
            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={submitting}
            >
              {submitting ? "Creating Account..." : "Create Admin Account"}
            </button>
          </form>
        )}

        <div className="auth-footer">
          Already have an account? <Link href="/auth/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
