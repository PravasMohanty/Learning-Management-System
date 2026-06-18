"use client";

import { useQuery } from "@tanstack/react-query";
import { userAPI, courseAPI, certificateAPI } from "@/lib/api";
import PageContainer from "@/components/layout/PageContainer";
import StatCard from "@/components/ui/StatCard";
import { SkeletonStatCards, SkeletonTable } from "@/components/ui/Skeleton";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import { Users, BookOpen, Award, Clock } from "lucide-react";

export default function AdminDashboard() {
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: userAPI.getAll,
  });

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: courseAPI.getAll,
  });

  const { data: certsData, isLoading: certsLoading } = useQuery({
    queryKey: ["admin-certificates"],
    queryFn: certificateAPI.getAllCertificates,
  });

  const users = usersData?.data || [];
  const courses = coursesData?.data || [];
  const certificates = certsData?.certificates || [];

  const totalUsers = users.length;
  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c) => c.published).length;
  const totalCertificates = certificates.length;

  const isLoading = usersLoading || coursesLoading || certsLoading;

  const recentUsers = users.slice(0, 5);

  const recentUserColumns = [
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: "email" },
    {
      header: "Role",
      accessor: "role",
      cell: (row) => <Badge variant={row.role}>{row.role}</Badge>,
    },
    {
      header: "Status",
      accessor: "is_locked",
      cell: (row) => (
        <Badge variant={row.is_locked ? "locked" : "active"}>
          {row.is_locked ? "Locked" : "Active"}
        </Badge>
      ),
    },
    {
      header: "Joined",
      accessor: "created_at",
      cell: (row) =>
        row.created_at
          ? new Date(row.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—",
    },
  ];

  return (
    <PageContainer
      title="Dashboard"
      subtitle="Overview of your institution's learning platform"
    >
      {/* Stat Cards */}
      {isLoading ? (
        <SkeletonStatCards count={4} />
      ) : (
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={totalUsers}
            icon={Users}
            variant="primary"
            footer={`${users.filter((u) => u.role === "student").length} students`}
          />
          <StatCard
            label="Total Courses"
            value={totalCourses}
            icon={BookOpen}
            variant="accent"
            footer={`${publishedCourses} published`}
          />
          <StatCard
            label="Certificates Issued"
            value={totalCertificates}
            icon={Award}
            variant="success"
          />
          <StatCard
            label="Draft Courses"
            value={totalCourses - publishedCourses}
            icon={Clock}
            variant="info"
            footer="Awaiting publication"
          />
        </div>
      )}

      {/* Recent Users Table */}
      <div style={{ marginTop: 24 }}>
        <div style={{ marginBottom: 12 }}>
          <h3>Recent Users</h3>
        </div>
        {isLoading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : (
          <DataTable
            columns={recentUserColumns}
            data={recentUsers}
            searchable={false}
            pageSize={5}
            emptyTitle="No users yet"
            emptyDescription="Users will appear here once they register."
          />
        )}
      </div>
    </PageContainer>
  );
}
