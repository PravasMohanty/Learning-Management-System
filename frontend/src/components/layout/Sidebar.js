"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Upload,
  Award,
  ClipboardList,
  UserCircle,
  LogOut,
  X,
} from "lucide-react";

const adminNav = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Bulk Upload", href: "/admin/bulk-upload", icon: Upload },
  { label: "Courses", href: "/admin/courses", icon: BookOpen },
  { label: "Certificates", href: "/admin/certificates", icon: Award },
];

const studentNav = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Courses", href: "/student/courses", icon: BookOpen },
  { label: "Assignments", href: "/student/assignments", icon: ClipboardList },
  { label: "Certificates", href: "/student/certificates", icon: Award },
  { label: "Profile", href: "/student/profile", icon: UserCircle },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = user?.role === "admin" ? adminNav : studentNav;
  const sectionLabel = user?.role === "admin" ? "Administration" : "Learning";

  const isActive = (href) => {
    if (href.endsWith("/dashboard")) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : "?";

  const handleLogout = async () => {
    await logout();
    window.location.href = "/auth/login";
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? "visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar ${isOpen ? "open" : ""}`} role="navigation" aria-label="Main navigation">
        {/* Header */}
        <div className="sidebar-header">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div className="sidebar-logo">
              RESO <span className="sidebar-logo-accent">LMS</span>
            </div>
            <button
              className="btn-icon show-mobile"
              onClick={onClose}
              aria-label="Close navigation"
              style={{ color: "#ffffff", display: "none" }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">{sectionLabel}</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive(item.href) ? "active" : ""}`}
                onClick={onClose}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer with user info */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{userInitial}</div>
            <div className="sidebar-user-info" style={{ flex: 1 }}>
              <div className="sidebar-user-name">{user?.name || "User"}</div>
              <div className="sidebar-user-role">{user?.role || "—"}</div>
            </div>
            <button
              className="btn-icon"
              onClick={handleLogout}
              aria-label="Logout"
              title="Logout"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
