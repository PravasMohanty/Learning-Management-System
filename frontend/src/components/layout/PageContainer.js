"use client";

export default function PageContainer({ title, subtitle, actions, children }) {
  return (
    <div className="page-container">
      {(title || actions) && (
        <div className="page-header">
          <div className="page-header-left">
            {title && <h1 className="page-title">{title}</h1>}
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
          {actions && <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
