"use client";

import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-bg)",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <ShieldX
          size={56}
          style={{ color: "var(--color-error)", marginBottom: 16 }}
        />
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Access Denied</h1>
        <p className="text-muted" style={{ marginBottom: 24 }}>
          You do not have permission to access this page. Please contact your
          administrator if you believe this is an error.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <Link href="/" className="btn btn-primary">
            Go Home
          </Link>
          <Link href="/auth/login" className="btn btn-outline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
