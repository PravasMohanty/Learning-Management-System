"use client";

import { useQuery } from "@tanstack/react-query";
import { certificateAPI } from "@/lib/api";
import PageContainer from "@/components/layout/PageContainer";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";

export default function AdminCertificatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-certificates"],
    queryFn: certificateAPI.getAllCertificates,
  });

  const certificates = data?.certificates || [];

  const columns = [
    {
      header: "Certificate ID",
      accessor: "certificate_id",
      cell: (row) => (
        <span style={{ fontFamily: "monospace", fontSize: 13 }}>
          {row.certificate_id}
        </span>
      ),
    },
    {
      header: "Course",
      accessor: "courses",
      cell: (row) => row.courses?.title || "—",
    },
    {
      header: "Student",
      accessor: "student_id",
      cell: (row) => row.student_id?.substring(0, 8) + "..." || "—",
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => (
        <Badge variant={row.status === "active" ? "success" : "muted"}>
          {row.status || "active"}
        </Badge>
      ),
    },
    {
      header: "Issued",
      accessor: "issue_date",
      cell: (row) =>
        row.issue_date
          ? new Date(row.issue_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—",
    },
  ];

  return (
    <PageContainer
      title="Certificates"
      subtitle="All issued certificates across the platform"
    >
      <DataTable
        columns={columns}
        data={certificates}
        loading={isLoading}
        searchPlaceholder="Search certificates..."
        emptyTitle="No certificates issued"
        emptyDescription="Certificates will appear here once students complete courses."
      />
    </PageContainer>
  );
}
