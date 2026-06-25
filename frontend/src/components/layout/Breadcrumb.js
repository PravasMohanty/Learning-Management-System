"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const routeLabels = {
  admin: "Admin",
  student: "Student",
  dashboard: "Dashboard",
  users: "Users",
  courses: "Courses",
  assignments: "Assignments",
  certificates: "Certificates",
  profile: "Profile",
  "bulk-upload": "Bulk Upload",
  create: "Create",
  edit: "Edit",
  "forgot-password": "Forgot Password",
  login: "Login",
  register: "Register",
};

export default function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = routeLabels[segment] || decodeURIComponent(segment);
    const isLast = index === segments.length - 1;

    return { href, label, isLast };
  });

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {crumbs.map((crumb, index) => (
        <span key={crumb.href} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {index > 0 && (
            <ChevronRight size={14} className="breadcrumb-separator" />
          )}
          {crumb.isLast ? (
            <span className="breadcrumb-current">{crumb.label}</span>
          ) : (
            <Link href={crumb.href}>{crumb.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}
