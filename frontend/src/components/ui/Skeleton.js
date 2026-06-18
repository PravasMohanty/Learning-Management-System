export function SkeletonLine({ width = "100%" }) {
  return (
    <div
      className="skeleton skeleton-line"
      style={{ width }}
    />
  );
}

export function SkeletonCard({ height = 100 }) {
  return (
    <div
      className="skeleton skeleton-card"
      style={{ height }}
    />
  );
}

export function SkeletonCircle({ size = 40 }) {
  return (
    <div
      className="skeleton skeleton-circle"
      style={{ width: size, height: size }}
    />
  );
}

export function SkeletonStatCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat-card" style={{ padding: 20 }}>
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-line short" />
            <div className="skeleton" style={{ height: 28, width: "50%", marginTop: 8, borderRadius: 4 }} />
          </div>
          <div className="skeleton skeleton-circle" style={{ width: 44, height: 44 }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="data-table-wrapper">
      <div className="data-table-toolbar">
        <div className="skeleton" style={{ width: 240, height: 34, borderRadius: 6 }} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-table-row">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="skeleton" style={{ flex: j === 0 ? 2 : 1 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="page-container">
      <div style={{ marginBottom: 24 }}>
        <div className="skeleton skeleton-line" style={{ width: "30%", height: 24 }} />
        <div className="skeleton skeleton-line" style={{ width: "50%", height: 14, marginTop: 8 }} />
      </div>
      <SkeletonStatCards />
      <div style={{ marginTop: 24 }}>
        <SkeletonTable />
      </div>
    </div>
  );
}
