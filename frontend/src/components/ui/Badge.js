const variantMap = {
  active: "badge-success",
  locked: "badge-error",
  pending: "badge-warning",
  approved: "badge-success",
  rejected: "badge-error",
  published: "badge-success",
  draft: "badge-muted",
  admin: "badge-accent",
  student: "badge-primary",
  instructor: "badge-info",
  beginner: "badge-info",
  intermediate: "badge-warning",
  advanced: "badge-error",
  completed: "badge-success",
  "in-progress": "badge-info",
};

export default function Badge({ children, variant }) {
  const className = variant
    ? variantMap[variant] || `badge-${variant}`
    : "badge-muted";

  return <span className={`badge ${className}`}>{children}</span>;
}
