"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { certificateAPI } from "@/lib/api";
import Link from "next/link";
import { CheckCircle, XCircle, Award, Calendar, User, BookOpen } from "lucide-react";

export default function VerifyCertificatePage({ params }) {
  const { hash } = use(params);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["verify-certificate", hash],
    queryFn: () => certificateAPI.verifyHash(hash),
    retry: 1, // Only retry once to avoid long loading states on bad hashes
  });

  const certificate = data?.certificate;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ maxWidth: 600, width: "100%", textAlign: "center" }}>
        
        {/* Logo / Header */}
        <div style={{ marginBottom: 40 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <h1 style={{ color: "var(--color-primary)", margin: 0, fontSize: "2rem" }}>RESO LMS</h1>
          </Link>
          <p className="text-muted" style={{ marginTop: 8 }}>Certificate Verification Portal</p>
        </div>

        {/* Verification Card */}
        <div className="card" style={{ padding: "40px 24px", borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div className="spinner" style={{ width: 40, height: 40, border: "3px solid var(--color-border)", borderTopColor: "var(--color-primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
              <p>Verifying certificate...</p>
            </div>
          ) : isError || !data?.success ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div style={{ color: "var(--color-error)", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: 20, borderRadius: "50%" }}>
                <XCircle size={64} />
              </div>
              <h2 style={{ margin: 0, color: "var(--color-error)" }}>Invalid Certificate</h2>
              <p className="text-muted" style={{ maxWidth: 400, margin: "0 auto" }}>
                We could not find a valid certificate matching this verification code. Please ensure you scanned the correct QR code or entered the correct link.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
              <div style={{ color: "var(--color-success)", backgroundColor: "rgba(34, 197, 94, 0.1)", padding: 20, borderRadius: "50%" }}>
                <CheckCircle size={64} />
              </div>
              
              <h2 style={{ margin: 0, color: "var(--color-success)" }}>Verified Authentic</h2>
              <p className="text-muted" style={{ marginTop: -16 }}>This certificate is valid and issued by RESO LMS.</p>

              <div style={{ width: "100%", backgroundColor: "var(--color-bg)", borderRadius: 12, padding: 24, textAlign: "left", marginTop: 8 }}>
                
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
                  <div style={{ color: "var(--color-primary)", marginTop: 2 }}><User size={20} /></div>
                  <div>
                    <div className="text-sm text-muted" style={{ marginBottom: 4 }}>Issued To</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>{certificate.profiles?.name || "Unknown Student"}</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
                  <div style={{ color: "var(--color-primary)", marginTop: 2 }}><BookOpen size={20} /></div>
                  <div>
                    <div className="text-sm text-muted" style={{ marginBottom: 4 }}>Course</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>{certificate.courses?.title || "Unknown Course"}</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
                  <div style={{ color: "var(--color-primary)", marginTop: 2 }}><Calendar size={20} /></div>
                  <div>
                    <div className="text-sm text-muted" style={{ marginBottom: 4 }}>Issue Date</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                      {new Date(certificate.issue_date).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ color: "var(--color-primary)", marginTop: 2 }}><Award size={20} /></div>
                  <div>
                    <div className="text-sm text-muted" style={{ marginBottom: 4 }}>Certificate ID</div>
                    <div style={{ fontSize: "1rem", fontFamily: "monospace", color: "var(--color-text)" }}>{certificate.certificate_id}</div>
                  </div>
                </div>

              </div>

              {certificate.pdf_url && (
                <a 
                  href={certificate.pdf_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-outline" 
                  style={{ width: "100%", marginTop: 8, padding: 12, display: "flex", justifyContent: "center", textDecoration: "none" }}
                >
                  View Original Certificate
                </a>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div style={{ marginTop: 40, color: "var(--color-muted)", fontSize: "0.875rem" }}>
          &copy; {new Date().getFullYear()} RESO LMS. All rights reserved.
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
