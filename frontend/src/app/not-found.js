import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F8F9FB",
        padding: 24,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#001B44",
            lineHeight: 1,
            marginBottom: 8,
          }}
        >
          404
        </div>
        <h1 style={{ fontSize: 22, marginBottom: 8, color: "#111827" }}>
          Page Not Found
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "10px 20px",
            backgroundColor: "#001B44",
            color: "#ffffff",
            borderRadius: 6,
            fontWeight: 500,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
