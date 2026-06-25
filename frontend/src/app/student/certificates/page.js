"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { certificateAPI } from "@/lib/api";
import PageContainer from "@/components/layout/PageContainer";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import toast from "react-hot-toast";
import { Download, Award } from "lucide-react";

export default function StudentCertificatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-certificates"],
    queryFn: certificateAPI.getMyCertificates,
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
      header: "Status",
      accessor: "status",
      cell: (row) => (
        <Badge variant="success">{row.status || "active"}</Badge>
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
    {
      header: "Actions",
      accessor: null,
      sortable: false,
      width: "100px",
      cell: (row) => (
        <button
          className="btn btn-sm btn-outline"
          onClick={() => handleDownload(row.id)}
        >
          <Download size={14} /> Download
        </button>
      ),
    },
  ];

  const handleDownload = async (certId) => {
    try {
      const res = await certificateAPI.download(certId);
      if (res?.downloadUrl || res?.url) {
        window.open(res.downloadUrl || res.url, "_blank");
      } else {
        toast.success("Certificate download initiated");
      }
    } catch {
      toast.error("Failed to download certificate");
    }
  };

  return (
    <PageContainer
      title="My Certificates"
      subtitle="Certificates earned upon course completion"
    >
      <DataTable
        columns={columns}
        data={certificates}
        loading={isLoading}
        searchPlaceholder="Search certificates..."
        emptyTitle="No certificates yet"
        emptyDescription="Complete courses to earn certificates."
      />
    </PageContainer>
  );
}
