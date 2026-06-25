export default function StatCard({ label, value, icon: Icon, variant = "primary", footer }) {
  return (
    <div className="stat-card">
      <div className="stat-card-content">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">{value}</div>
        {footer && <div className="stat-card-footer">{footer}</div>}
      </div>
      {Icon && (
        <div className={`stat-card-icon ${variant}`}>
          <Icon size={22} />
        </div>
      )}
    </div>
  );
}
