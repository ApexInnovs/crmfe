import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useWebHaptics } from "web-haptics/react";

const timePassed = (date) => {
  const now = Date.now();
  const past = new Date(date).getTime();
  const diff = Math.floor((now - past) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// --- DropdownIconFilter: Small icon-only dropdown for table header ---
function DropdownIconFilter({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    if (!open) return;
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);
  const selected = options.find(o => o.value === value);
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        style={{
          background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 22, height: 22,
        }}
        title={selected ? selected.label : ''}
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#b0b0a8" strokeWidth="2">
          {/* <circle cx="10" cy="10" r="8" fill="#f8faf7" /> */}
          <path d="M7 9l3 3 3-3" stroke="#7a7a6c" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 28, right: 0, zIndex: 20,
          background: '#fff', border: '1px solid #e0e8db', borderRadius: 8,
          boxShadow: '0 4px 16px 0 rgba(180,190,175,0.13)',
          minWidth: 110, padding: '0px 0',
          overflow: 'hidden',
        }}>
          {options.map(opt => (
            <div
              key={opt.value}
              style={{
                padding: '7px 16px', fontSize: 13, color: value === opt.value ? '#65a30d' : '#374140',
                background: value === opt.value ? '#f3f6f2' : 'none',
                cursor: 'pointer', fontWeight: value === opt.value ? 600 : 400,
              }}
              onClick={() => { setOpen(false); onChange(opt.value); }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --------------------
// Shared 3D style tokens
// --------------------
const s = {
  panel: {
    background: "linear-gradient(160deg, #ffffff 0%, #f5f7f4 100%)",
    borderRadius: "16px",
    border: "1px solid rgba(200,210,195,0.7)",
    boxShadow:
      "0 1px 0 rgba(255,255,255,0.9) inset, 0 -1px 0 rgba(0,0,0,0.06) inset, 0 4px 6px -2px rgba(0,0,0,0.05), 0 12px 28px -6px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.08)",
  },
  raised: {
    background: "linear-gradient(175deg, #ffffff 0%, #eff1ee 100%)",
    borderRadius: "10px",
    border: "1px solid rgba(180,190,175,0.6)",
    boxShadow:
      "0 1px 0 rgba(255,255,255,0.9) inset, 0 -1px 0 rgba(0,0,0,0.06) inset, 0 2px 4px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "13px",
    fontWeight: "500",
    color: "#374140",
    outline: "none",
    transition: "all 0.15s",
  },
  inputBase: {
    background: "linear-gradient(175deg, #f4f6f3 0%, #ffffff 100%)",
    borderRadius: "10px",
    border: "1px solid rgba(180,190,175,0.5)",
    boxShadow:
      "0 2px 4px rgba(0,0,0,0.06) inset, 0 1px 0 rgba(255,255,255,0.8)",
    fontFamily: "inherit",
    fontSize: "13px",
    color: "#374140",
    outline: "none",
    transition: "all 0.2s",
  },
  limeBtn: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "10px 22px",
    borderRadius: "11px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "13px",
    fontWeight: "600",
    color: "#1a3a00",
    letterSpacing: "0.01em",
    whiteSpace: "nowrap",
    border: "none",
    background: "linear-gradient(160deg, #b5f053 0%, #84cc16 40%, #65a30d 100%)",
    borderTop: "1px solid rgba(255,255,255,0.45)",
    boxShadow:
      "0 1px 0 rgba(255,255,255,0.4) inset, 0 -2px 0 rgba(0,0,0,0.15) inset, 0 4px 0 #4d7c0f, 0 5px 6px rgba(74,120,8,0.35), 0 10px 20px rgba(101,163,13,0.20)",
    transition: "all 0.15s ease",
  },
  pgBtn: {
    padding: "7px 16px",
    borderRadius: "9px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "12.5px",
    fontWeight: "500",
    color: "#374140",
    border: "none",
    background: "linear-gradient(175deg, #ffffff 0%, #eff1ee 100%)",
    borderColor: "rgba(180,190,175,0.6)",
    borderStyle: "solid",
    borderWidth: "1px",
    boxShadow:
      "0 1px 0 rgba(255,255,255,0.9) inset, 0 -1px 0 rgba(0,0,0,0.06) inset, 0 2px 4px rgba(0,0,0,0.08), 0 2px 0 rgba(0,0,0,0.10)",
    transition: "all 0.15s",
  },
};

const focusStyle = {
  borderColor: "rgba(132,204,22,0.5)",
  boxShadow:
    "0 2px 4px rgba(0,0,0,0.04) inset, 0 0 0 3px rgba(132,204,22,0.12), 0 1px 0 rgba(255,255,255,0.8)",
};
const blurStyle = {
  borderColor: "rgba(180,190,175,0.5)",
  boxShadow:
    "0 2px 4px rgba(0,0,0,0.06) inset, 0 1px 0 rgba(255,255,255,0.8)",
};

// --------------------
// Built-in Cell Renderers
// --------------------
export const CellRenderers = {
  avatar: (value) => (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <img
        src={value?.avatar}
        alt={value?.name || ""}
        style={{
          width: 32, height: 32, borderRadius: "50%", objectFit: "cover",
          border: "2px solid rgba(180,190,175,0.5)", flexShrink: 0,
        }}
        onError={(e) => {
          e.target.style.display = "none";
          e.target.nextSibling.style.display = "flex";
        }}
      />
      <span
        style={{
          display: "none", width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg, #b5f053, #65a30d)",
          color: "#1a3a00", fontSize: 12, fontWeight: 700,
          alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >
        {(value?.name || "?")[0].toUpperCase()}
      </span>
      <div>
        <div style={{ fontWeight: 600, color: "#374140", fontSize: 13 }}>{value?.name || "-"}</div>
        {value?.sub && <div style={{ fontSize: 11, color: "#9aaa98", marginTop: 1 }}>{value.sub}</div>}
      </div>
    </div>
  ),

  status: (value) => {
    const presets = {
      active: { bg: "linear-gradient(135deg,#dcfce7,#bbf7d0)", color: "#166534", dot: "#22c55e", border: "rgba(134,239,172,0.5)" },
      inactive: { bg: "linear-gradient(135deg,#f3f4f6,#e5e7eb)", color: "#6b7280", dot: "#9ca3af", border: "rgba(200,205,210,0.6)" },
      pending: { bg: "linear-gradient(135deg,#fef9c3,#fde68a)", color: "#92400e", dot: "#f59e0b", border: "rgba(252,211,77,0.5)" },
      error: { bg: "linear-gradient(135deg,#fff1f2,#ffe4e6)", color: "#be123c", dot: "#f43f5e", border: "rgba(252,165,165,0.4)" },
      success: { bg: "linear-gradient(135deg,#dcfce7,#bbf7d0)", color: "#166534", dot: "#22c55e", border: "rgba(134,239,172,0.5)" },
      warning: { bg: "linear-gradient(135deg,#fef9c3,#fde68a)", color: "#92400e", dot: "#f59e0b", border: "rgba(252,211,77,0.5)" },
      info: { bg: "linear-gradient(135deg,#eff6ff,#dbeafe)", color: "#1d4ed8", dot: "#3b82f6", border: "rgba(147,197,253,0.4)" },
    };
    const isObj = typeof value === "object" && value !== null;
    const label = isObj ? value.label : value;
    const key = String(label || "").toLowerCase();
    const p = presets[key] || { bg: "linear-gradient(135deg,#f3f4f6,#e5e7eb)", color: "#6b7280", dot: "#9ca3af", border: "rgba(200,205,210,0.6)" };
    const bg = (isObj && value.bg) ? value.bg : p.bg;
    const color = (isObj && value.color) ? value.color : p.color;
    const dot = (isObj && value.dot) ? value.dot : p.dot;
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500,
        background: bg, color, border: `1px solid ${p.border}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 1px 3px rgba(0,0,0,0.07)",
        whiteSpace: "nowrap",
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: "50%", background: dot,
          flexShrink: 0, boxShadow: `0 0 0 2px ${dot}33`,
        }} />
        {label || "-"}
      </span>
    );
  },

  image: (value) => (
    <img src={value} alt="" style={{
      width: 40, height: 40, borderRadius: 8, objectFit: "cover",
      border: "1px solid rgba(180,190,175,0.5)",
    }} />
  ),

  badge: (value) => {
    const items = Array.isArray(value) ? value : [value];
    return (
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {items.map((v, i) => (
          <span key={i} style={{
            padding: "2px 8px", borderRadius: 6,
            background: "linear-gradient(135deg,#f0f4ee,#e8ede6)",
            color: "#4b5945", fontSize: 11, fontWeight: 500,
            border: "1px solid rgba(180,190,175,0.5)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset",
          }}>{v}</span>
        ))}
      </div>
    );
  },

  progress: (value) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        flex: 1, height: 6, background: "rgba(180,190,175,0.3)", borderRadius: 99,
        overflow: "hidden", minWidth: 60,
        boxShadow: "0 1px 2px rgba(0,0,0,0.08) inset",
      }}>
        <div style={{
          height: "100%", borderRadius: 99, transition: "width 0.3s",
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: value > 70
            ? "linear-gradient(90deg,#84cc16,#65a30d)"
            : value > 40
              ? "linear-gradient(90deg,#f59e0b,#d97706)"
              : "linear-gradient(90deg,#f87171,#ef4444)",
        }} />
      </div>
      <span style={{ fontSize: 11, color: "#9aaa98", minWidth: 28 }}>{value}%</span>
    </div>
  ),
};

// --------------------
// Action button variants
// --------------------
const actionBtnStyle = (variant) => {
  const map = {
    danger: {
      background: "linear-gradient(160deg,#fff1f2,#ffe4e6)",
      border: "1px solid rgba(252,165,165,0.4)",
      color: "#dc2626",
      boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset, 0 2px 3px rgba(220,38,38,0.08), 0 2px 0 rgba(220,38,38,0.15)",
    },
    info: {
      background: "linear-gradient(160deg,#eff6ff,#dbeafe)",
      border: "1px solid rgba(147,197,253,0.4)",
      color: "#1d4ed8",
      boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset, 0 2px 3px rgba(37,99,235,0.08), 0 2px 0 rgba(37,99,235,0.15)",
    },
    default: {
      background: "linear-gradient(160deg,#f0fce8,#dcfce7)",
      border: "1px solid rgba(134,239,172,0.4)",
      color: "#15803d",
      boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset, 0 2px 3px rgba(22,101,52,0.08), 0 2px 0 rgba(22,101,52,0.15)",
    },
  };
  return {
    width: 24, height: 24, borderRadius: 6, cursor: "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.15s",
    fontSize: 14,
    ...(map[variant] || map.default),
  };
};

// --------------------
// Main Table Component
// --------------------
const Table = ({
  headers = [],
  values = [],
  page = 1,
  pageSize = 10,
  total = 0,
  loading = false,
  searchKeys = [],
  searchKey,
  searchText,
  onSearch,
  onSearchKeyChange,
  onSearchTextChange,
  onPageChange,
  onPageSizeChange,
  onRowAction,
  actions = [],
  emptyMessage = "No records found",
  onRowClick,
  pageSizes = [5, 10, 20, 50],
  height = "65vh",
  onAdd,
  addLabel = "Add",
}) => {
  const [internalSearchText, setInternalSearchText] = useState("");
  const [internalSearchKey, setInternalSearchKey] = useState(searchKeys[0] || "");
  const { trigger } = useWebHaptics();
  const hapticTap = () => trigger([{ duration: 30 }, { delay: 60, duration: 40, intensity: 1 }]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
  const computedSearchText = searchText ?? internalSearchText;
  const computedSearchKey = searchKey ?? internalSearchKey;

  const handleSearchTextChange = useCallback((e) => {
    const v = e.target.value;
    if (onSearchTextChange) { onSearchTextChange(v); }
    else { setInternalSearchText(v); onSearch?.(v); }
  }, [onSearchTextChange, onSearch]);

  const handleSearchKeyChange = useCallback((e) => {
    const v = e.target.value;
    if (onSearchKeyChange) { onSearchKeyChange(v); }
    else { setInternalSearchKey(v); }
  }, [onSearchKeyChange]);

  const serialNumber = (index) => (page - 1) * pageSize + index + 1;
  const hasActions = onRowAction || actions.length > 0;

  const renderCell = useCallback((row, header) => {
    const raw = header.key.includes(".")
      ? header.key.split(".").reduce((acc, part) => acc && acc[part] !== undefined ? acc[part] : undefined, row)
      : row[header.key];

    if (header.render) return header.render(raw, row);

    let displayValue = raw;
    if (header.valueMap && header.valueMap[raw] !== undefined) displayValue = header.valueMap[raw];
    if (header.type && CellRenderers[header.type]) return CellRenderers[header.type](displayValue, row);
    if (displayValue === null || displayValue === undefined || displayValue === "") {
      return <span style={{ color: "#c5cebd" }}>—</span>;
    }
    if (header.format === "number") return Number(displayValue).toLocaleString();
    if (header.format === "currency") return Number(displayValue).toLocaleString("en-US", { style: "currency", currency: header.currency || "USD" });
    if (header.format === "date") return new Date(displayValue).toLocaleDateString();
    if (header.format === "datetime") return new Date(displayValue).toLocaleString();
    return String(displayValue);
  }, []);

  // Fix: Ensure h.label is a string before calling toLowerCase
  const getHeaderLabelText = (label) => {
    if (typeof label === 'string') return label;
    if (label && typeof label.props?.children === 'string') return label.props.children;
    // Try to extract text from React element children recursively
    if (label && label.props?.children) {
      if (Array.isArray(label.props.children)) {
        return label.props.children.map(getHeaderLabelText).join(' ');
      }
      return getHeaderLabelText(label.props.children);
    }
    return '';
  };
  const visibleHeaders = headers.filter(h => getHeaderLabelText(h.label).toLowerCase() !== "permissions");
  const colSpan = visibleHeaders.length + 2 + (hasActions ? 1 : 0);
  const start = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);
  const hasSearch = onSearch || onSearchTextChange || searchKeys.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── Toolbar panel ── */}
      {(hasSearch || onAdd) && (
        <div style={{
          ...s.panel,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          position: "relative",
        }}>
          {/* Gloss overlay */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: 16,
            background: "linear-gradient(180deg,rgba(255,255,255,0.45) 0%,transparent 40%)",
            pointerEvents: "none",
          }} />

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", position: "relative" }}>
            {searchKeys.length > 0 && (
              <select
                value={computedSearchKey}
                onChange={handleSearchKeyChange}
                style={{ ...s.raised, padding: "9px 14px" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 1px 0 rgba(255,255,255,0.9) inset, 0 4px 8px rgba(0,0,0,0.10)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = s.raised.boxShadow; }}
              >
                {searchKeys.map((key) => {
                  const header = headers.find((h) => h.key === key);
                  return <option key={key} value={key}>{header?.label || key}</option>;
                })}
              </select>
            )}

            {/* Divider */}
            {searchKeys.length > 0 && (
              <div style={{ width: 1, height: 26, background: "linear-gradient(to bottom, transparent, rgba(180,190,175,0.5) 30%, rgba(180,190,175,0.5) 70%, transparent)" }} />
            )}

            <div style={{ position: "relative" }}>
              <svg style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#9aaa98", pointerEvents: "none" }}
                width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="6.5" cy="6.5" r="4.5" /><path d="M10 10l3 3" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={computedSearchText}
                onChange={handleSearchTextChange}
                style={{ ...s.inputBase, padding: "9px 14px 9px 34px", width: 200 }}
                onFocus={e => Object.assign(e.target.style, focusStyle)}
                onBlur={e => Object.assign(e.target.style, blurStyle)}
              />
            </div>
          </div>

          {onAdd && (
            <button
              onClick={() => { hapticTap(); onAdd(); }}
              style={{ ...s.limeBtn, position: "relative" }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 1px 0 rgba(255,255,255,0.4) inset, 0 -2px 0 rgba(0,0,0,0.15) inset, 0 5px 0 #4d7c0f, 0 7px 10px rgba(74,120,8,0.40), 0 14px 24px rgba(101,163,13,0.22)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = s.limeBtn.boxShadow;
              }}
              onMouseDown={e => {
                e.currentTarget.style.transform = "translateY(3px)";
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.12) inset, 0 1px 0 rgba(255,255,255,0.25) inset, 0 1px 0 #4d7c0f";
              }}
              onMouseUp={e => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 1px 0 rgba(255,255,255,0.4) inset, 0 5px 0 #4d7c0f, 0 7px 10px rgba(74,120,8,0.40)";
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M8 3v10M3 8h10" />
              </svg>
              {addLabel}
            </button>
          )}
        </div>
      )}

      {/* ── Table panel ── */}
      <div style={{
        ...s.panel,
        overflow: "hidden",
        height,
        maxHeight: height,
        display: "flex",
        flexDirection: "column",
        marginBottom: "0.5vh",
      }}>
        <div style={{ overflowX: "auto", overflowY: "auto", flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>

            {/* Header */}
            {/* <thead>
              <tr style={{
                // background: "linear-gradient(to bottom, #f0f4ee, #e8ede6)",
                // borderBottom: "1px solid rgba(200,210,195,0.6)",
              }}>
                <th style={thStyle}>#</th>
                {visibleHeaders.map((h, i) => (
                  <th key={i} style={thStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{h.label || h.key}</span>
                      {h.filter && (
                        <select
                          style={{
                            ...s.raised,
                            padding: "3px 8px 3px 6px",
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            color: "#6b7a68",
                          }}
                          value={h.filter.value}
                          onChange={(e) => h.filter.onChange(e.target.value)}
                        >
                          {h.filter.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </th>
                ))}
                <th style={thStyle}>Time</th>
                {hasActions && (
                  <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
                )}
              </tr>
            </thead> */}

            <thead>
              <tr>
                <th style={thStyle}>#</th>
                {visibleHeaders.map((h, i) => (
                  <th key={i} style={thStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, position: 'relative' }}>
                      <span>{h.label || h.key}</span>
                      {h.filter && (
                        <DropdownIconFilter
                          value={h.filter.value}
                          options={h.filter.options}
                          onChange={h.filter.onChange}
                        />
                      )}
                    </div>
                  </th>
                ))}
                {hasActions && (
                  <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
                )}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colSpan} style={{ padding: "48px 16px", textAlign: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 400, margin: "0 auto" }}>
                      {[0, 1, 2].map((i) => (
                        <div key={i} style={{
                          height: 16, borderRadius: 8,
                          background: "linear-gradient(90deg, #f0f4ee 25%, #e4ebe0 50%, #f0f4ee 75%)",
                          backgroundSize: "200% 100%",
                          animation: `shimmer 1.4s ${i * 0.15}s infinite`,
                        }} />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : values.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} style={{ padding: "48px 16px", textAlign: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(180,190,175,0.8)" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" />
                      </svg>
                      <div style={{ color: "#9aaa98", fontSize: 13 }}>{emptyMessage}</div>
                    </div>
                  </td>
                </tr>
              ) : (
                values.map((row, idx) => (
                  <tr
                    key={row._id || idx}
                    onClick={() => onRowClick && onRowClick(row, idx)}
                    style={{
                      // borderBottom: "1px solid rgba(200,210,195,0.35)",
                      transition: "background 0.15s",
                      cursor: onRowClick ? "pointer" : "default",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(180,220,100,0.04)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ""; }}
                  >
                    <td style={{ ...tdStyle, color: "#9aaa98", fontSize: 12, fontWeight: 500 }}>
                      {serialNumber(idx)}
                    </td>
                    {visibleHeaders.map((header, hidx) => (
                      <td key={hidx} style={tdStyle}>
                        {renderCell(row, header)}
                      </td>
                    ))}
                    {hasActions && (
                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                          {actions.map((action, aidx) => (
                            <button
                              key={action.key || aidx}
                              style={actionBtnStyle(action.variant)}
                              onClick={(e) => { e.stopPropagation(); hapticTap(); action.onClick(row); }}
                              title={action.label}
                              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                              onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
                              onMouseDown={e => { e.currentTarget.style.transform = "translateY(2px)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1) inset"; }}
                              onMouseUp={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = actionBtnStyle(action.variant).boxShadow; }}
                            >
                              {action.icon || action.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      </div>

      {/* ── Footer panel ── */}
      <div style={{
        ...s.panel,
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10,
        background: "linear-gradient(to bottom, #f5f7f4, #f0f2ef)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12.5, color: "#6b7a68", fontWeight: 500 }}>Rows per page:</span>
          <div style={{ position: "relative" }}>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              style={{
                ...s.raised,
                padding: "6px 28px 6px 10px",
                fontSize: 12.5,
                appearance: "none",
                WebkitAppearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236b7a68' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
                backgroundSize: "10px",
              }}
            >
              {pageSizes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <span style={{ fontSize: 12.5, color: "#9aaa98" }}>
            {total === 0 ? "Showing 0 of 0" : `Showing ${start} – ${end} of ${total}`}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            disabled={page <= 1}
            onClick={() => onPageChange?.(Math.max(1, page - 1))}
            style={{ ...s.pgBtn, opacity: page <= 1 ? 0.4 : 1, cursor: page <= 1 ? "not-allowed" : "pointer" }}
            onMouseEnter={e => { if (page > 1) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 1px 0 rgba(255,255,255,0.9) inset, 0 4px 6px rgba(0,0,0,0.10), 0 3px 0 rgba(0,0,0,0.12)"; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = s.pgBtn.boxShadow; }}
            onMouseDown={e => { if (page > 1) { e.currentTarget.style.transform = "translateY(2px)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1) inset"; } }}
            onMouseUp={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = s.pgBtn.boxShadow; }}
          >
            Prev
          </button>
          <span style={{ fontSize: 12.5, color: "#6b7a68", fontWeight: 500, padding: "0 4px" }}>
            Page {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
            style={{ ...s.pgBtn, opacity: page >= totalPages ? 0.4 : 1, cursor: page >= totalPages ? "not-allowed" : "pointer" }}
            onMouseEnter={e => { if (page < totalPages) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 1px 0 rgba(255,255,255,0.9) inset, 0 4px 6px rgba(0,0,0,0.10), 0 3px 0 rgba(0,0,0,0.12)"; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = s.pgBtn.boxShadow; }}
            onMouseDown={e => { if (page < totalPages) { e.currentTarget.style.transform = "translateY(2px)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1) inset"; } }}
            onMouseUp={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = s.pgBtn.boxShadow; }}
          >
            Next
          </button>
        </div>
      </div>

    </div>
  );
};

// --------------------
// Shared cell styles
// --------------------
const thStyle = {
  padding: "6px 10px",
  textAlign: "left",
  fontSize: 13,
  fontWeight: 800,
  color: "#848482",
  // background: "linear-gradient(180deg, #f3f6f2 80%, #e6ede6 100%)",
  background: 'linear-gradient(180deg, #ffffff 0%, #eff1ee 100%)',
  letterSpacing: "0.03em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  minHeight: 36,
  // borderBottom: "2px solid #d1e7dd",
  boxShadow: "0 2px 6px 0 rgba(180,190,175,0.07)",
};

const tdStyle = {
  padding: "7px 10px",
  color: "#374140",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
  fontSize: 12,
  minHeight: 28,
};

const AddButton = ({ onAdd, addLabel = "Add" }) => {
  const limeBtn = {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    padding: "10px 22px",
    borderRadius: "11px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "13px",
    fontWeight: "600",
    color: "#1a3a00",
    letterSpacing: "0.01em",
    whiteSpace: "nowrap",
    border: "none",
    background: "linear-gradient(160deg, #b5f053 0%, #84cc16 40%, #65a30d 100%)",
    borderTop: "1px solid rgba(255,255,255,0.45)",
    boxShadow:
      "0 1px 0 rgba(255,255,255,0.4) inset, 0 -2px 0 rgba(0,0,0,0.15) inset, 0 4px 0 #4d7c0f, 0 5px 6px rgba(74,120,8,0.35), 0 10px 20px rgba(101,163,13,0.20)",
    transition: "all 0.15s ease",
  };

  return (
    <button
      onClick={onAdd}
      style={limeBtn}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow =
          "0 1px 0 rgba(255,255,255,0.4) inset, 0 5px 0 #4d7c0f, 0 7px 10px rgba(74,120,8,0.40), 0 14px 24px rgba(101,163,13,0.22)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = limeBtn.boxShadow;
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "translateY(3px)";
        e.currentTarget.style.boxShadow =
          "0 2px 4px rgba(0,0,0,0.12) inset, 0 1px 0 rgba(255,255,255,0.25) inset, 0 1px 0 #4d7c0f";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow =
          "0 1px 0 rgba(255,255,255,0.4) inset, 0 5px 0 #4d7c0f, 0 7px 10px rgba(74,120,8,0.40)";
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M8 3v10M3 8h10" />
      </svg>
      {addLabel}
    </button>
  );
};

export { AddButton };
export default React.memo(Table);