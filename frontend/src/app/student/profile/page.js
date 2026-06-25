"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { userAPI, authAPI } from "@/lib/api";
import PageContainer from "@/components/layout/PageContainer";
import Badge from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { SkeletonLine } from "@/components/ui/Skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Mail, Shield, Calendar, Lock } from "lucide-react";

const passwordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function StudentProfilePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: userAPI.getProfile,
  });

  const profile = data?.data;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const passwordMutation = useMutation({
    mutationFn: ({ newPassword }) => authAPI.changePassword(newPassword),
    onSuccess: (res) => {
      if (!res.success) { toast.error(res.message); return; }
      toast.success("Password changed successfully");
      reset();
    },
    onError: (err) => toast.error(err.message || "Failed to change password"),
  });

  return (
    <PageContainer
      title="Profile"
      subtitle="Your account information"
    >
      {/* Profile Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          {isLoading ? (
            <div>
              <SkeletonLine width="40%" />
              <SkeletonLine width="60%" />
              <SkeletonLine width="30%" />
            </div>
          ) : !profile ? (
            <div className="alert alert-error">Failed to load profile.</div>
          ) : (
            <div style={{ display: "grid", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    backgroundColor: "var(--color-accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    fontWeight: 700,
                    color: "var(--color-primary)",
                    flexShrink: 0,
                  }}
                >
                  {profile.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <h2 style={{ marginBottom: 4 }}>{profile.name}</h2>
                  <Badge variant={profile.role}>{profile.role}</Badge>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: 16,
                    backgroundColor: "var(--color-bg)",
                    borderRadius: 6,
                  }}
                >
                  <Mail size={18} style={{ color: "var(--color-muted)" }} />
                  <div>
                    <div className="text-xs text-muted">Email</div>
                    <div style={{ fontWeight: 500 }}>{profile.email}</div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: 16,
                    backgroundColor: "var(--color-bg)",
                    borderRadius: 6,
                  }}
                >
                  <Shield size={18} style={{ color: "var(--color-muted)" }} />
                  <div>
                    <div className="text-xs text-muted">Role</div>
                    <div style={{ fontWeight: 500, textTransform: "capitalize" }}>{profile.role}</div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: 16,
                    backgroundColor: "var(--color-bg)",
                    borderRadius: 6,
                  }}
                >
                  <Calendar size={18} style={{ color: "var(--color-muted)" }} />
                  <div>
                    <div className="text-xs text-muted">Member Since</div>
                    <div style={{ fontWeight: 500 }}>
                      {profile.created_at
                        ? new Date(profile.created_at).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password */}
      {profile?.role === 'admin' && (
        <div className="card">
          <div className="card-header">
            <h4 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Lock size={16} /> Change Password
            </h4>
          </div>
          <div className="card-body">
            <form
              onSubmit={handleSubmit((d) => passwordMutation.mutate(d))}
              noValidate
              style={{ maxWidth: 400 }}
            >
              <Input
                label="New Password"
                type="password"
                placeholder="Enter new password"
                error={errors.newPassword?.message}
                {...register("newPassword")}
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm new password"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={passwordMutation.isPending}
              >
                {passwordMutation.isPending ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
