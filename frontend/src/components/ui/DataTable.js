"use client";

import { useState, useMemo } from "react";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export default function DataTable({
  columns,
  data = [],
  loading = false,
  searchable = true,
  searchPlaceholder = "Search...",
  pageSize = 10,
  emptyTitle = "No data found",
  emptyDescription = "There are no records to display.",
  onRowClick,
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = col.accessor ? row[col.accessor] : "";
        return String(val || "").toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const comp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? comp : -comp;
    });
  }, [filtered, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (accessor) => {
    if (sortKey === accessor) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(accessor);
      setSortDir("asc");
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  // Skeleton rows
  if (loading) {
    return (
      <div className="data-table-wrapper">
        {searchable && (
          <div className="data-table-toolbar">
            <div className="skeleton" style={{ width: 240, height: 34, borderRadius: 6 }} />
          </div>
        )}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th key={i}>{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((_, j) => (
                    <td key={j}>
                      <div
                        className="skeleton"
                        style={{ height: 14, width: `${60 + Math.random() * 30}%`, borderRadius: 4 }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="data-table-wrapper">
      {searchable && (
        <div className="data-table-toolbar">
          <div className="data-table-search">
            <Search size={16} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={handleSearch}
              aria-label="Search table"
            />
          </div>
          <span className="text-sm text-muted">
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.accessor || col.header}
                  className={col.sortable !== false && col.accessor ? "sortable" : ""}
                  onClick={() =>
                    col.sortable !== false && col.accessor && handleSort(col.accessor)
                  }
                  style={col.width ? { width: col.width } : undefined}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {col.header}
                    {col.sortable !== false && col.accessor && (
                      sortKey === col.accessor ? (
                        sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      ) : (
                        <ChevronsUpDown size={14} style={{ opacity: 0.3 }} />
                      )
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="empty-state" style={{ padding: "32px 16px" }}>
                    <div className="empty-state-title">{emptyTitle}</div>
                    <div className="empty-state-description">{emptyDescription}</div>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  onClick={() => onRowClick?.(row)}
                  style={onRowClick ? { cursor: "pointer" } : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.accessor || col.header}>
                      {col.cell ? col.cell(row) : row[col.accessor] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="data-table-pagination">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="data-table-pagination-buttons">
            <button
              className="data-table-pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              let page;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  className={`data-table-pagination-btn ${currentPage === page ? "active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              );
            })}
            <button
              className="data-table-pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
