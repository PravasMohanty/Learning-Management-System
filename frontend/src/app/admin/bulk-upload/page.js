"use client";

import { useState, useRef } from "react";
import { bulkUserAPI } from "@/lib/api";
import PageContainer from "@/components/layout/PageContainer";
import toast from "react-hot-toast";
import { Upload, Download, FileText, CheckCircle, XCircle } from "lucide-react";

export default function BulkUploadPage() {
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

  const handleDownloadTemplate = () => {
    const token = localStorage.getItem("access_token");
    const url = bulkUserAPI.getTemplateUrl();
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "student_upload_template.csv");
    // For authenticated download, we open in new tab
    window.open(`${url}?token=${token}`, "_blank");
  };

  return (
    <PageContainer
      title="Bulk User Upload"
      subtitle="Create multiple student accounts from a CSV file"
    >
      {/* Instructions Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <h4 style={{ marginBottom: 12 }}>Instructions</h4>
          <ol style={{ paddingLeft: 20, color: "var(--color-text-secondary)", lineHeight: 2 }}>
            <li>Download the CSV template using the button below</li>
            <li>Fill in student details: <strong>name</strong>, <strong>email</strong>, <strong>password</strong></li>
            <li>Upload the completed CSV file</li>
            <li>Review the results for any failed entries</li>
          </ol>
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-outline" onClick={handleDownloadTemplate}>
              <Download size={16} /> Download CSV Template
            </button>
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
                  style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }}
                />
                <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
              </div>
            ) : (
              <div className="file-upload-text">
                <strong>Click to browse</strong> or drag and drop a CSV file here
              </div>
            )}
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={!file || uploading}
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
            <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 20 }}>
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
                <CheckCircle size={20} style={{ color: "var(--color-success)" }} />
                <div>
                  <div className="text-sm text-muted">Created</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--color-success)" }}>
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
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--color-error)" }}>
                    {result.failed_count}
                  </div>
                </div>
              </div>
            </div>

            {result.failed_users?.length > 0 && (
              <div>
                <h5 style={{ marginBottom: 8, color: "var(--color-error)" }}>Failed Entries</h5>
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
    </PageContainer>
  );
}
