"use client";

import { Menu } from "lucide-react";
import Breadcrumb from "./Breadcrumb";

export default function Header({ onMenuClick }) {
  return (
    <header className="header" role="banner">
      <div className="header-left">
        <button
          className="hamburger-btn"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>
        <Breadcrumb />
      </div>
      <div className="header-right">
        {/* Reserved for future notification bell, etc. */}
      </div>
    </header>
  );
}
