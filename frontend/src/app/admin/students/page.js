"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { requestAPI, bulkUserAPI } from "@/lib/api";
import PageContainer from "@/components/layout/PageContainer";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import toast from "react-hot-toast";
import {
  UserCheck,
  UserX,
  Clock,
  Upload,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  Users,
  ClipboardList,
  Mail,
  Calendar,
} from "lucide-react";

// ============================================================
// STUDENT ACCESS PAGE — TABS: Requests | Bulk Upload
// ============================================================

export default function StudentAccessPage() {
  const [activeTab, setActiveTab] = useState("requests");

  return (
    <PageContainer
      title="Student Access"
      subtitle="Manage registration requests and bulk student onboarding"
    >
      {/* Tab Navigation */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
          id="tab-requests"
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ClipboardList size={15} />
            Registration Requests
          </span>
        </button>
        <button
          className={`tab ${activeTab === "bulk" ? "active" : ""}`}
          onClick={() => setActiveTab("bulk")}
          id="tab-bulk-upload"
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Upload size={15} />
            Bulk Upload
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "requests" && <RegistrationRequestsTab />}
      {activeTab === "bulk" && <BulkUploadTab />}
    </PageContainer>
  );
}

// ============================================================
// TAB 1 — REGISTRATION REQUESTS
// ============================================================

function RegistrationRequestsTab() {
  const queryClient = useQueryClient();
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  // Fetch all requests
  const { data, isLoading } = useQuery({
    queryKey: ["registration-requests"],
    queryFn: requestAPI.getAll,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (requestId) => requestAPI.approve(requestId),
    onSuccess: (response) => {
      if (!response.success) {
        toast.error(response.message || "Failed to approve");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["registration-requests"] });
      toast.success("Student approved and account created");
    },
    onError: (err) => toast.error(err.message || "Failed to approve request"),
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ requestId, reason }) =>
      requestAPI.reject(requestId, reason),
    onSuccess: (response) => {
      if (!response.success) {
        toast.error(response.message || "Failed to reject");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["registration-requests"] });
      toast.success("Request rejected");
      setRejectModal(null);
      setRejectionReason("");
    },
    onError: (err) => toast.error(err.message || "Failed to reject request"),
  });

  const requests = data?.requests || [];

  // Filter by status
  const filteredRequests =
    statusFilter === "all"
      ? requests
      : requests.filter((r) => r.status === statusFilter);

  // Stat counts
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  const handleReject = () => {
    if (!rejectModal) return;
    rejectMutation.mutate({
      requestId: rejectModal.id,
      reason: rejectionReason,
    });
  };

  // Table columns
  const columns = [
    {
      header: "Student",
      accessor: "name",
      cell: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.name}</div>
          <div className="text-sm text-muted" style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            <Mail size={12} />
            {row.email}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => <Badge variant={row.status}>{row.status}</Badge>,
    },
    {
      header: "Requested",
      accessor: "created_at",
      cell: (row) =>
        row.created_at ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Calendar size={13} style={{ color: "var(--color-muted)" }} />
            {new Date(row.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        ) : (
          "—"
        ),
    },
    {
      header: "Actions",
      accessor: null,
      sortable: false,
      width: "180px",
      cell: (row) => {
        if (row.status !== "pending") {
          return (
            <span className="text-sm text-muted" style={{ fontStyle: "italic" }}>
              Processed
            </span>
          );
        }
        return (
          <div className="data-table-actions" style={{ gap: 6 }}>
            <button
              className="btn btn-success btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                approveMutation.mutate(row.id);
              }}
              disabled={approveMutation.isPending}
              title="Approve request"
              id={`approve-${row.id}`}
            >
              <UserCheck size={14} />
              Approve
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                setRejectModal(row);
                setRejectionReason("");
              }}
              title="Reject request"
              id={`reject-${row.id}`}
            >
              <UserX size={14} />
              Reject
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      {/* Summary Stats */}
      <div
        className="grid grid-cols-3"
        style={{ gap: 16, marginBottom: 24 }}
      >
        <button
          className="stat-card"
          style={{
            cursor: "pointer",
            border: statusFilter === "pending" ? "2px solid var(--color-warning)" : undefined,
            textAlign: "left",
          }}
          onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}
          id="filter-pending"
        >
          <div className="stat-card-content">
            <div className="stat-card-label">Pending</div>
            <div className="stat-card-value">{pendingCount}</div>
            <div className="stat-card-footer">Awaiting review</div>
          </div>
          <div className="stat-card-icon" style={{ backgroundColor: "var(--color-warning-bg)", color: "var(--color-warning)" }}>
            <Clock size={22} />
          </div>
        </button>

        <button
          className="stat-card"
          style={{
            cursor: "pointer",
            border: statusFilter === "approved" ? "2px solid var(--color-success)" : undefined,
            textAlign: "left",
          }}
          onClick={() => setStatusFilter(statusFilter === "approved" ? "all" : "approved")}
          id="filter-approved"
        >
          <div className="stat-card-content">
            <div className="stat-card-label">Approved</div>
            <div className="stat-card-value">{approvedCount}</div>
            <div className="stat-card-footer">Accounts created</div>
          </div>
          <div className="stat-card-icon" style={{ backgroundColor: "var(--color-success-bg)", color: "var(--color-success)" }}>
            <UserCheck size={22} />
          </div>
        </button>

        <button
          className="stat-card"
          style={{
            cursor: "pointer",
            border: statusFilter === "rejected" ? "2px solid var(--color-error)" : undefined,
            textAlign: "left",
          }}
          onClick={() => setStatusFilter(statusFilter === "rejected" ? "all" : "rejected")}
          id="filter-rejected"
        >
          <div className="stat-card-content">
            <div className="stat-card-label">Rejected</div>
            <div className="stat-card-value">{rejectedCount}</div>
            <div className="stat-card-footer">Declined requests</div>
          </div>
          <div className="stat-card-icon" style={{ backgroundColor: "var(--color-error-bg)", color: "var(--color-error)" }}>
            <UserX size={22} />
          </div>
        </button>
      </div>

      {/* Active filter indicator */}
      {statusFilter !== "all" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
            fontSize: 13,
            color: "var(--color-muted)",
          }}
        >
          Filtering by: <Badge variant={statusFilter}>{statusFilter}</Badge>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setStatusFilter("all")}
            style={{ marginLeft: 4 }}
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Requests Table */}
      <DataTable
        columns={columns}
        data={filteredRequests}
        loading={isLoading}
        searchPlaceholder="Search by name or email..."
        emptyTitle={
          statusFilter !== "all"
            ? `No ${statusFilter} requests`
            : "No registration requests"
        }
        emptyDescription={
          statusFilter !== "all"
            ? `There are no ${statusFilter} registration requests.`
            : "Student registration requests will appear here when students sign up."
        }
      />

      {/* Reject Confirmation Modal */}
      <Modal
        isOpen={!!rejectModal}
        onClose={() => {
          setRejectModal(null);
          setRejectionReason("");
        }}
        title="Reject Registration Request"
        footer={
          <>
            <button
              className="btn btn-outline"
              onClick={() => {
                setRejectModal(null);
                setRejectionReason("");
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Request"}
            </button>
          </>
        }
      >
        <p style={{ marginBottom: 16 }}>
          Are you sure you want to reject the registration request from{" "}
          <strong>{rejectModal?.name}</strong> ({rejectModal?.email})?
        </p>
        <div className="form-group">
          <label className="form-label">
            Rejection Reason <span className="form-label-optional">(optional)</span>
          </label>
          <textarea
            className="form-textarea"
            placeholder="Provide a reason for rejection (will be sent via email)..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>
    </>
  );
}

// ============================================================
// TAB 2 — BULK UPLOAD
// ============================================================

function BulkUploadTab() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith(".csv")) {
        toast.error("Please select a CSV file");
        return;
      }
      setFile(selected);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    try {
      setUploading(true);
      const response = await bulkUserAPI.uploadCSV(file);
      if (!response.success) throw new Error(response.message);
      setResult(response.data);
      toast.success("CSV processed successfully");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Instructions Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <h4 style={{ marginBottom: 12 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Users size={18} style={{ color: "var(--color-primary)" }} />
              Bulk Student Onboarding
            </span>
          </h4>
          <p className="text-muted" style={{ marginBottom: 12 }}>
            Create multiple student accounts at once by uploading a CSV file.
          </p>
          <ol
            style={{
              paddingLeft: 20,
              color: "var(--color-text-secondary)",
              lineHeight: 2,
            }}
          >
            <li>Download the CSV template using the button below</li>
            <li>
              Fill in student details: <strong>name</strong>,{" "}
              <strong>email</strong>, <strong>password</strong>
            </li>
            <li>Upload the completed CSV file</li>
            <li>Review the results for any failed entries</li>
          </ol>
          <div style={{ marginTop: 16 }}>
            <a
              className="btn btn-outline"
              href="/student_upload_template.csv"
              download
              id="download-template"
            >
              <Download size={16} /> Download CSV Template
            </a>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <h4 style={{ marginBottom: 16 }}>Upload CSV File</h4>

          <div
            className={`file-upload-zone ${file ? "active" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) {
                if (!dropped.name.endsWith(".csv")) {
                  toast.error("Please drop a CSV file");
                  return;
                }
                setFile(dropped);
                setResult(null);
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: "none" }}
              aria-label="Upload CSV file"
            />
            <div className="file-upload-icon">
              <Upload size={32} />
            </div>
            {file ? (
              <div className="file-upload-text">
                <FileText
                  size={16}
                  style={{
                    display: "inline",
                    verticalAlign: "middle",
                    marginRight: 6,
                  }}
                />
                <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)}{" "}
                KB)
              </div>
            ) : (
              <div className="file-upload-text">
                <strong>Click to browse</strong> or drag and drop a CSV file
                here
              </div>
            )}
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={!file || uploading}
              id="upload-csv"
            >
              {uploading ? "Processing..." : "Upload & Process"}
            </button>
            {file && (
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="card">
          <div className="card-header">
            <h4>Upload Results</h4>
          </div>
          <div className="card-body">
            <div
              className="grid grid-cols-2 gap-4"
              style={{ marginBottom: 20 }}
            >
              <div
                style={{
                  padding: 16,
                  borderRadius: 6,
                  backgroundColor: "var(--color-success-bg)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <CheckCircle
                  size={20}
                  style={{ color: "var(--color-success)" }}
                />
                <div>
                  <div className="text-sm text-muted">Created</div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: "var(--color-success)",
                    }}
                  >
                    {result.created_count}
                  </div>
                </div>
              </div>
              <div
                style={{
                  padding: 16,
                  borderRadius: 6,
                  backgroundColor: "var(--color-error-bg)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <XCircle size={20} style={{ color: "var(--color-error)" }} />
                <div>
                  <div className="text-sm text-muted">Failed</div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: "var(--color-error)",
                    }}
                  >
                    {result.failed_count}
                  </div>
                </div>
              </div>
            </div>

            {result.failed_users?.length > 0 && (
              <div>
                <h5
                  style={{ marginBottom: 8, color: "var(--color-error)" }}
                >
                  Failed Entries
                </h5>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.failed_users.map((u, i) => (
                        <tr key={i}>
                          <td>{u.email}</td>
                          <td className="text-error">{u.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
