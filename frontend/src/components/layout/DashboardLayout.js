"use client";

import { useState, useCallback } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="main-content">
        <Header onMenuClick={openSidebar} />
        <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
