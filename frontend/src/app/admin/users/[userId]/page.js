"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { userAPI } from "@/lib/api";
import PageContainer from "@/components/layout/PageContainer";
import Badge from "@/components/ui/Badge";
import { SkeletonLine } from "@/components/ui/Skeleton";
import Link from "next/link";
import { ArrowLeft, Mail, Shield, Calendar } from "lucide-react";

export default function UserDetailPage({ params }) {
  const { userId } = use(params);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: () => userAPI.getProfileById(userId),
    enabled: !!userId,
  });

  const profile = data?.data;

  return (
    <PageContainer
      title="User Profile"
      subtitle="Detailed user information"
      actions={
        <Link href="/admin/users" className="btn btn-outline">
          <ArrowLeft size={16} /> Back to Users
        </Link>
      }
    >
      <div className="card">
        <div className="card-body">
          {isLoading ? (
            <div>
              <SkeletonLine width="40%" />
              <SkeletonLine width="60%" />
              <SkeletonLine width="30%" />
              <SkeletonLine width="50%" />
            </div>
          ) : !profile ? (
            <div className="alert alert-error">User profile not found.</div>
          ) : (
            <div style={{ display: "grid", gap: 20 }}>
              {/* Avatar + Name */}
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
                  {profile.is_locked && (
                    <Badge variant="locked" style={{ marginLeft: 8 }}>
                      Locked
                    </Badge>
                  )}
                </div>
              </div>

              {/* Details */}
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
                    <div style={{ fontWeight: 500, textTransform: "capitalize" }}>
                      {profile.role}
                    </div>
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
                    <div className="text-xs text-muted">Joined</div>
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

              {/* Bio */}
              {profile.bio && (
                <div>
                  <h4 style={{ marginBottom: 8 }}>Bio</h4>
                  <p className="text-muted">{profile.bio}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
