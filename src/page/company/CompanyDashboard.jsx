import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);
import { companyDashboard } from '../../api/companyAndPackageApi';
import { searchCampaigns } from '../../api/campigneAndLeadApi';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';

// ─── Shimmer ─────────────────────────────────────────────────────────────────
const Shimmer = ({ w = '100%', h = 16, r = 8, style = {} }) => (
  <div style={{
    width: w, height: h, borderRadius: r,
    background: 'linear-gradient(90deg,#f0f4ee 25%,#e4ebe0 50%,#f0f4ee 75%)',
    backgroundSize: '200% 100%',
    animation: 'cdShimmer 1.4s infinite',
    ...style,
  }} />
);

// ─── Stat Card ───────────────────────────────────────────────────────────────
const palette = {
  blue: { bg: '#eff6ff', icon: '#2563eb', ring: '#93bbfd44', dot: '#3b82f6' },
  green: { bg: '#f0fdf4', icon: '#16a34a', ring: '#86efac44', dot: '#22c55e' },
  amber: { bg: '#fffbeb', icon: '#d97706', ring: '#fcd34d44', dot: '#f59e0b' },
  purple: { bg: '#faf5ff', icon: '#9333ea', ring: '#d8b4fe44', dot: '#a855f7' },
  red: { bg: '#fef2f2', icon: '#dc2626', ring: '#fca5a544', dot: '#ef4444' },
  cyan: { bg: '#ecfeff', icon: '#0891b2', ring: '#67e8f944', dot: '#06b6d4' },
  rose: { bg: '#fff1f2', icon: '#e11d48', ring: '#fda4af44', dot: '#f43f5e' },
};

const StatCard = ({ label, value, color = 'blue', icon, loading, delay = 0 }) => {
  const c = palette[color] || palette.blue;
  return (
    <div className="cd-stat" style={{ animationDelay: `${delay}ms` }}>
      <div className="cd-stat__icon" style={{ background: c.bg, boxShadow: `0 0 0 4px ${c.ring}` }}>
        {React.cloneElement(icon, { style: { width: 20, height: 20, color: c.icon } })}
      </div>
      <div className="cd-stat__body">
        <span className="cd-stat__label">{label}</span>
        {loading
          ? <Shimmer h={26} r={6} />
          : <span className="cd-stat__value">{value ?? '—'}</span>
        }
      </div>
      <span className="cd-stat__dot" style={{ background: c.dot, boxShadow: `0 0 0 3px ${c.ring}` }} />
    </div>
  );
};

// ─── Section ─────────────────────────────────────────────────────────────────
const Section = ({ title, children, action, style: extra = {} }) => (
  <div className="cd-section" style={extra}>
    <div className="cd-section__head">
      <h2 className="cd-section__title">{title}</h2>
      {action}
    </div>
    <div className="cd-section__body">{children}</div>
  </div>
);

// ─── Campaign Autocomplete ───────────────────────────────────────────────────
const CampaignAutocomplete = ({ companyId, value, onChange }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const wrapRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!value) { setSelectedLabel(''); setQuery(''); }
  }, [value]);

  const doSearch = useCallback(async (q) => {
    if (!companyId) return;
    try {
      const data = await searchCampaigns(companyId, q);
      setResults(Array.isArray(data) ? data : []);
    } catch { setResults([]); }
  }, [companyId]);

  const handleInput = (e) => {
    const v = e.target.value;
    setQuery(v);
    setOpen(true);
    if (value) onChange('');
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(v), 250);
  };

  const handleFocus = () => { setOpen(true); doSearch(query); };

  const pick = (item) => {
    onChange(item._id);
    setSelectedLabel(item.title || item.name || item._id);
    setQuery(item.title || item.name || item._id);
    setOpen(false);
  };

  const clear = () => { onChange(''); setQuery(''); setSelectedLabel(''); };

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapRef} className="cd-autocomplete">
      <div className="cd-autocomplete__input-wrap">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aaa98" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search campaigns…"
          value={query || selectedLabel}
          onChange={handleInput}
          onFocus={handleFocus}
          className="cd-autocomplete__input"
        />
        {(value || query) && (
          <button onClick={clear} className="cd-autocomplete__clear" type="button">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <ul className="cd-autocomplete__list">
          {results.map(r => (
            <li key={r._id} className="cd-autocomplete__option" onMouseDown={() => pick(r)}>
              <span className="cd-autocomplete__opt-title">{r.title || r.name}</span>
              {r.status && <span className={`cd-autocomplete__badge cd-autocomplete__badge--${r.status}`}>
                {r.status === 1 ? 'Active' : r.status === 2 ? 'Started' : r.status === 3 ? 'Completed' : 'Cancelled'}
              </span>}
            </li>
          ))}
        </ul>
      )}
      {open && query && results.length === 0 && (
        <div className="cd-autocomplete__empty">No campaigns found</div>
      )}
    </div>
  );
};

// ─── Chart helpers ───────────────────────────────────────────────────────────
const chartOpts = (type) => ({
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e2b1a',
      titleFont: { family: "'DM Sans',sans-serif", size: 12 },
      bodyFont: { family: "'DM Sans',sans-serif", size: 11 },
      cornerRadius: 8,
      padding: 10,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#9aaa98', font: { size: 11, family: "'DM Sans',sans-serif" } },
      border: { display: false },
    },
    y: {
      grid: { color: 'rgba(180,190,175,0.15)', drawBorder: false },
      ticks: { color: '#9aaa98', font: { size: 11, family: "'DM Sans',sans-serif" }, stepSize: 1 },
      border: { display: false },
    },
  },
});

class ChartErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div className="cd-chart-err">Unable to render chart.</div>;
    return this.props.children;
  }
}
ChartErrorBoundary.propTypes = { children: PropTypes.node };

const isValidChartData = (d) =>
  d && Array.isArray(d.labels) && d.labels.length > 0 &&
  Array.isArray(d.datasets) && d.datasets.length > 0 &&
  d.datasets.every(ds => Array.isArray(ds.data) && ds.data.length === d.labels.length);

// ─── Lead Status helpers ─────────────────────────────────────────────────────
const STATUS_META = [
  { key: 'created', label: 'Created', color: '#3b82f6' },
  { key: 'not_responsed', label: 'No Response', color: '#94a3b8' },
  { key: 'not_intrested', label: 'Not Interested', color: '#ef4444' },
  { key: 'intrested_but_later', label: 'Interested Later', color: '#f59e0b' },
  { key: 'intrested', label: 'Interested', color: '#22c55e' },
];

// ══════════════════════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const CompanyDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', campigneId: '' });

  const today = dayjs().format('YYYY-MM-DD');
  const weekAgo = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
  const companyId = user?._id || user?.company?._id;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!companyId) throw new Error('Company ID not found');
        const params = { companyId };
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
        if (filters.campigneId) params.campigneId = filters.campigneId;
        setDashboard(await companyDashboard(params));
      } catch (e) {
        setError(e.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId, filters]);

  const cardData = dashboard?.cardData || {};
  const leadGraph = dashboard?.graphData?.leadGraph || [];
  const conversionGraph = dashboard?.graphData?.conversionGraph || [];
  const employeePerformance = dashboard?.employeePerformance || [];
  const suggestions = dashboard?.suggestions || [];

  const statCards = [
    {
      label: 'Total Leads', value: cardData.totalLeads, color: 'blue',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
    },
    {
      label: 'Conversions', value: cardData.totalConversions, color: 'green',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39-.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
    },
    {
      label: 'Active Campaigns', value: cardData.activeCampignes, color: 'purple',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" /></svg>
    },
    {
      label: 'Credits Left', value: cardData.creditsLeft, color: 'red',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" /></svg>
    },
    {
      label: 'Employees', value: cardData.totalEmployees, color: 'amber',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    },
    {
      label: 'New Created', value: cardData.created, color: 'cyan',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
    },
    {
      label: 'Lost Leads', value: cardData.lostLeads, color: 'rose',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
    },
  ];

  // ── Lead-status funnel from cardData ──
  const funnelData = STATUS_META.map(s => ({ ...s, count: cardData[s.key] || 0 }));
  const funnelMax = Math.max(...funnelData.map(f => f.count), 1);

  return (
    <>
      {/* ── Global dashboard styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&family=Space+Mono:wght@400;700&display=swap');

        @keyframes cdShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes cdFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

        .cd-root {
          --cd-bg: #f6f8f4;
          --cd-surface: #ffffff;
          --cd-border: rgba(200,210,195,0.55);
          --cd-text: #1e2b1a;
          --cd-text2: #374140;
          --cd-muted: #9aaa98;
          --cd-lime: #84cc16;
          --cd-lime-dark: #4d7c0f;
          --cd-radius: 14px;
          --cd-shadow: 0 1px 0 rgba(255,255,255,0.85) inset, 0 2px 6px -2px rgba(0,0,0,0.06), 0 8px 24px -6px rgba(0,0,0,0.08);
          font-family: 'DM Sans', system-ui, sans-serif;
          width: 100%;
          padding: 0 0 40px 0;
        }

        /* ── Filter bar ───────────────────────────────── */
        .cd-filter {
          display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap;
          padding: 16px 20px;
          background: var(--cd-surface);
          border: 1px solid var(--cd-border);
          border-radius: var(--cd-radius);
          box-shadow: var(--cd-shadow);
          margin-bottom: 24px;
          animation: cdFadeUp .4s ease both;
          position: relative;
          z-index: 10;
        }
        .cd-filter__field { display: flex; flex-direction: column; gap: 5px; flex: 0 0 auto; }
        .cd-filter__field--grow { flex: 1 1 220px; min-width: 200px; }
        .cd-filter__label {
          font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em;
          color: var(--cd-muted);
          font-family: 'Space Mono', monospace;
        }
        .cd-filter input[type="date"] {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; padding: 8px 12px;
          border: 1.5px solid var(--cd-border);
          border-radius: 10px; background: #fafcf8;
          color: var(--cd-text2);
          transition: border .15s, box-shadow .15s;
          outline: none; min-width: 150px;
        }
        .cd-filter input[type="date"]:focus {
          border-color: var(--cd-lime);
          box-shadow: 0 0 0 3px rgba(132,204,22,0.15);
        }
        .cd-filter__reset {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 22px; border-radius: 10px; border: none;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
          color: #1a3a00; cursor: pointer; white-space: nowrap;
          background: linear-gradient(160deg,#b5f053 0%,#84cc16 40%,#65a30d 100%);
          box-shadow: 0 1px 0 rgba(255,255,255,0.35) inset, 0 -2px 0 rgba(0,0,0,0.12) inset,
                      0 3px 0 var(--cd-lime-dark), 0 4px 8px rgba(74,120,8,0.3);
          transition: all .15s ease;
        }
        .cd-filter__reset:hover { transform: translateY(-1px); box-shadow: 0 1px 0 rgba(255,255,255,0.35) inset, 0 4px 0 var(--cd-lime-dark), 0 6px 12px rgba(74,120,8,0.35); }
        .cd-filter__reset:active { transform: translateY(2px); box-shadow: 0 2px 4px rgba(0,0,0,0.1) inset; }

        /* ── Stat cards ───────────────────────────────── */
        .cd-stats {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(185px, 1fr));
          gap: 14px;
          margin-bottom: 24px;
        }
        .cd-stat {
          position: relative;
          display: flex; align-items: flex-start; gap: 14px;
          padding: 18px 20px;
          background: var(--cd-surface);
          border: 1px solid var(--cd-border);
          border-radius: var(--cd-radius);
          box-shadow: var(--cd-shadow);
          overflow: hidden;
          animation: cdFadeUp .45s ease both;
          transition: transform .18s, box-shadow .18s;
        }
        .cd-stat:hover { transform: translateY(-2px); box-shadow: 0 6px 24px -4px rgba(0,0,0,0.12); }
        .cd-stat__icon {
          width: 42px; height: 42px; border-radius: 11px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .cd-stat__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
        .cd-stat__label {
          font-size: 10.5px; font-weight: 600; text-transform: uppercase;
          letter-spacing: .06em; color: var(--cd-muted);
          font-family: 'Space Mono', monospace;
        }
        .cd-stat__value { font-size: 28px; font-weight: 700; color: var(--cd-text); line-height: 1; }
        .cd-stat__dot {
          position: absolute; top: 12px; right: 12px;
          width: 7px; height: 7px; border-radius: 50%;
        }

        /* ── Section ──────────────────────────────────── */
        .cd-section {
          background: var(--cd-surface);
          border: 1px solid var(--cd-border);
          border-radius: var(--cd-radius);
          box-shadow: var(--cd-shadow);
          padding: 22px 24px;
          position: relative; overflow: hidden;
          animation: cdFadeUp .5s ease both;
        }
        .cd-section::before {
          content: ''; position: absolute; inset: 0;
          border-radius: var(--cd-radius); pointer-events: none;
          background: linear-gradient(180deg,rgba(255,255,255,0.5) 0%,transparent 35%);
        }
        .cd-section__head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 18px; position: relative;
        }
        .cd-section__title {
          font-family: 'Space Mono', monospace;
          font-size: 12px; font-weight: 700; color: var(--cd-text2);
          letter-spacing: .06em; text-transform: uppercase; margin: 0;
        }
        .cd-section__body { position: relative; }

        /* ── Charts grid ──────────────────────────────── */
        .cd-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .cd-chart-err { color: #dc2626; font-size: 13px; padding: 12px; background: #fef2f2; border-radius: 8px; }

        /* ── Employee table ────────────────────────────── */
        .cd-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
        .cd-table thead th {
          text-align: left; padding: 10px 14px;
          font-family: 'Space Mono', monospace; font-size: 10.5px; font-weight: 700;
          text-transform: uppercase; letter-spacing: .06em;
          color: var(--cd-muted); background: #f8faf7;
          border-bottom: 1.5px solid var(--cd-border);
        }
        .cd-table thead th:first-child { border-radius: 10px 0 0 0; }
        .cd-table thead th:last-child { border-radius: 0 10px 0 0; }
        .cd-table tbody td { padding: 12px 14px; color: var(--cd-text2); border-bottom: 1px solid rgba(200,210,195,0.3); }
        .cd-table tbody tr { transition: background .12s; }
        .cd-table tbody tr:hover { background: #f8faf7; }
        .cd-table tbody tr:last-child td { border-bottom: none; }

        /* ── Lead status grid ──────────────────────────── */
        .cd-status-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }
        .cd-status-card {
          display: flex; flex-direction: column; align-items: center;
          gap: 10px; padding: 20px 12px 16px;
          border-radius: 14px;
          border: 1px solid var(--cd-border);
          background: var(--cd-surface);
          transition: transform .18s, box-shadow .18s;
          position: relative; overflow: hidden;
        }
        .cd-status-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px -4px rgba(0,0,0,0.10); }
        .cd-status-card__ring { position: relative; width: 64px; height: 64px; flex-shrink: 0; }
        .cd-status-card__ring svg { width: 64px; height: 64px; transform: rotate(-90deg); }
        .cd-status-card__ring-bg { fill: none; stroke-width: 5; }
        .cd-status-card__ring-fill { fill: none; stroke-width: 5; stroke-linecap: round; transition: stroke-dashoffset .7s cubic-bezier(.4,0,.2,1); }
        .cd-status-card__count {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          font-family: 'Space Mono', monospace; font-size: 15px; font-weight: 700;
          color: var(--cd-text);
        }
        .cd-status-card__label {
          font-size: 11px; font-weight: 600; text-transform: uppercase;
          letter-spacing: .06em; color: var(--cd-muted);
          font-family: 'Space Mono', monospace;
          text-align: center; line-height: 1.35;
        }
        .cd-status-card__pct {
          font-size: 11px; font-weight: 600;
          padding: 2px 8px; border-radius: 99px;
        }
        @media (max-width: 900px) { .cd-status-grid { grid-template-columns: repeat(3,1fr); } }
        @media (max-width: 500px) { .cd-status-grid { grid-template-columns: repeat(2,1fr); } }

        /* ── Autocomplete ─────────────────────────────── */
        .cd-autocomplete { position: relative; width: 100%; }
        .cd-autocomplete__input-wrap {
          display: flex; align-items: center; gap: 8px;
          padding: 7px 12px;
          border: 1.5px solid var(--cd-border);
          border-radius: 10px; background: #fafcf8;
          transition: border .15s, box-shadow .15s;
        }
        .cd-autocomplete__input-wrap:focus-within {
          border-color: var(--cd-lime);
          box-shadow: 0 0 0 3px rgba(132,204,22,0.15);
        }
        .cd-autocomplete__input {
          flex: 1; border: none; outline: none; background: transparent;
          font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--cd-text2);
          min-width: 0;
        }
        .cd-autocomplete__input::placeholder { color: var(--cd-muted); }
        .cd-autocomplete__clear {
          display: flex; align-items: center; justify-content: center;
          width: 20px; height: 20px; border-radius: 50%;
          border: none; background: rgba(180,190,175,0.25);
          color: var(--cd-muted); cursor: pointer; flex-shrink: 0;
          transition: background .12s;
        }
        .cd-autocomplete__clear:hover { background: rgba(180,190,175,0.45); }
        .cd-autocomplete__list {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0;
          max-height: 220px; overflow-y: auto; z-index: 9999;
          background: var(--cd-surface);
          border: 1.5px solid var(--cd-border);
          border-radius: 12px;
          box-shadow: 0 12px 32px -4px rgba(0,0,0,0.14);
          padding: 4px; margin: 0; list-style: none;
        }
        .cd-autocomplete__option {
          display: flex; align-items: center; justify-content: space-between;
          padding: 9px 12px; border-radius: 8px; cursor: pointer;
          font-size: 13px; color: var(--cd-text2);
          transition: background .1s;
        }
        .cd-autocomplete__option:hover { background: #f0f4ee; }
        .cd-autocomplete__opt-title { font-weight: 500; }
        .cd-autocomplete__badge {
          font-size: 10px; font-weight: 600; padding: 2px 8px;
          border-radius: 6px; text-transform: uppercase; letter-spacing: .03em;
        }
        .cd-autocomplete__badge--1 { background: #dcfce7; color: #166534; }
        .cd-autocomplete__badge--2 { background: #dbeafe; color: #1e40af; }
        .cd-autocomplete__badge--3 { background: #f3f4f6; color: #374151; }
        .cd-autocomplete__badge--4 { background: #fef2f2; color: #991b1b; }
        .cd-autocomplete__empty {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0;
          padding: 14px; text-align: center;
          font-size: 12px; color: var(--cd-muted);
          background: var(--cd-surface); border: 1.5px solid var(--cd-border);
          border-radius: 12px; box-shadow: 0 8px 24px -4px rgba(0,0,0,0.1);
          z-index: 9999;
        }

        /* ── Suggestions ──────────────────────────────── */
        .cd-suggestion {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 14px; border-radius: 10px;
          background: linear-gradient(135deg,#fafcf8,#f0f4ee);
          border: 1px solid rgba(200,210,195,0.4);
          font-size: 13px; color: var(--cd-text2);
        }
        .cd-suggestion__dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--cd-lime); flex-shrink: 0; margin-top: 6px;
        }

        /* ── Responsive ───────────────────────────────── */
        @media (max-width: 900px) {
          .cd-charts { grid-template-columns: 1fr; }
          .cd-stats { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
          .cd-filter { gap: 12px; }
        }
        @media (max-width: 600px) {
          .cd-stats { grid-template-columns: 1fr 1fr; gap: 10px; }
          .cd-stat { padding: 14px 16px; }
          .cd-stat__value { font-size: 22px; }
          .cd-filter { flex-direction: column; align-items: stretch; }
          .cd-filter__field--grow { min-width: 100%; }
          .cd-section { padding: 16px; }
        }
      `}</style>

      <div className="cd-root">
        {/* ── Filter Bar ── */}
        <div className="cd-filter">
          <div className="cd-filter__field">
            <span className="cd-filter__label">From</span>
            <input
              type="date"
              value={filters.startDate || weekAgo}
              max={filters.endDate || today}
              onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
            />
          </div>
          <div className="cd-filter__field">
            <span className="cd-filter__label">To</span>
            <input
              type="date"
              value={filters.endDate || today}
              min={filters.startDate || weekAgo}
              max={today}
              onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
            />
          </div>
          <div className="cd-filter__field cd-filter__field--grow">
            <span className="cd-filter__label">Campaign</span>
            <CampaignAutocomplete
              companyId={companyId}
              value={filters.campigneId}
              onChange={val => setFilters(f => ({ ...f, campigneId: val }))}
            />
          </div>
          <button
            className="cd-filter__reset"
            onClick={() => setFilters({ startDate: '', endDate: '', campigneId: '' })}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
            </svg>
            Reset
          </button>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px', marginBottom: 16, borderRadius: 10,
            background: '#fef2f2', border: '1px solid #fecaca',
            color: '#991b1b', fontSize: 13,
          }}>{error}</div>
        )}

        {/* ── Stat Cards ── */}
        <div className="cd-stats">
          {statCards.map((c, i) => (
            <StatCard key={i} {...c} loading={loading} delay={i * 50} />
          ))}
        </div>

        {/* ── Charts ── */}
        <div className="cd-charts">
          <Section title="Leads Over Time">
            <ChartErrorBoundary>
              {loading ? <Shimmer h={200} r={10} /> : (() => {
                const data = {
                  labels: leadGraph.map(g => dayjs(g._id).format('MMM D')),
                  datasets: [{
                    label: 'Leads',
                    data: leadGraph.map(g => g.count),
                    backgroundColor: 'rgba(132,204,22,0.2)',
                    borderColor: '#84cc16',
                    borderWidth: 2,
                    borderRadius: 6,
                    hoverBackgroundColor: 'rgba(132,204,22,0.45)',
                  }],
                };
                return isValidChartData(data)
                  ? <Bar data={data} options={{ ...chartOpts('bar'), aspectRatio: 2 }} />
                  : <div style={{ color: 'var(--cd-muted)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>No lead data for this period.</div>;
              })()}
            </ChartErrorBoundary>
          </Section>

          <Section title="Conversions Over Time">
            <ChartErrorBoundary>
              {loading ? <Shimmer h={200} r={10} /> : (() => {
                const data = {
                  labels: conversionGraph.map(g => dayjs(g._id).format('MMM D')),
                  datasets: [{
                    label: 'Conversions',
                    data: conversionGraph.map(g => g.count),
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37,99,235,0.08)',
                    tension: 0.4,
                    borderWidth: 2.5,
                    pointRadius: 4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#2563eb',
                    pointBorderWidth: 2,
                    fill: true,
                  }],
                };
                return isValidChartData(data)
                  ? <Line data={data} options={{ ...chartOpts('line'), aspectRatio: 2 }} />
                  : <div style={{ color: 'var(--cd-muted)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>No conversion data for this period.</div>;
              })()}
            </ChartErrorBoundary>
          </Section>
        </div>

        {/* ── Lead Status Breakdown ── */}
        <div style={{ marginBottom: 20 }}>
          <Section title="Lead Status Breakdown">
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
                {[0, 1, 2, 3, 4].map(i => <Shimmer key={i} h={130} r={14} />)}
              </div>
            ) : (() => {
              const total = funnelData.reduce((s, f) => s + f.count, 0) || 1;
              const R = 27; const C = 2 * Math.PI * R;
              return (
                <div className="cd-status-grid">
                  {funnelData.map(f => {
                    const pct = Math.round((f.count / total) * 100);
                    const offset = C - (pct / 100) * C;
                    return (
                      <div key={f.key} className="cd-status-card">
                        {/* subtle tinted bg stripe */}
                        <div style={{
                          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                          background: f.color, borderRadius: '14px 14px 0 0', opacity: 0.7,
                        }} />
                        <div className="cd-status-card__ring">
                          <svg viewBox="0 0 64 64">
                            <circle className="cd-status-card__ring-bg" cx="32" cy="32" r={R}
                              stroke={`${f.color}1a`} />
                            <circle className="cd-status-card__ring-fill" cx="32" cy="32" r={R}
                              stroke={f.color}
                              strokeDasharray={C}
                              strokeDashoffset={f.count === 0 ? C : offset}
                            />
                          </svg>
                          <div className="cd-status-card__count">{f.count}</div>
                        </div>
                        <span className="cd-status-card__label">{f.label}</span>
                        <span className="cd-status-card__pct" style={{
                          background: `${f.color}18`, color: f.color,
                        }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </Section>
        </div>

        {/* ── Employee Performance ── */}
        <div style={{ marginBottom: 20 }}>
          <Section title="Employee Performance">
            {loading ? <Shimmer h={100} r={10} /> : employeePerformance.length === 0 ? (
              <div style={{ color: 'var(--cd-muted)', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>No employee data available.</div>
            ) : (
              <div style={{ overflowX: 'auto', margin: '0 -24px', padding: '0 24px' }}>
                <table className="cd-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Leads</th>
                      <th>Conversions</th>
                      <th>Rate</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeePerformance.map((emp, i) => {
                      const rate = emp.totalLeads > 0 ? ((emp.conversions / emp.totalLeads) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{emp.employee?.name || '—'}</td>
                          <td>
                            <span style={{
                              display: 'inline-block', padding: '2px 10px',
                              background: '#eff6ff', color: '#2563eb',
                              borderRadius: 6, fontWeight: 600, fontSize: 12,
                              fontFamily: "'Space Mono', monospace",
                            }}>{emp.totalLeads ?? '—'}</span>
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-block', padding: '2px 10px',
                              background: '#f0fdf4', color: '#16a34a',
                              borderRadius: 6, fontWeight: 600, fontSize: 12,
                              fontFamily: "'Space Mono', monospace",
                            }}>{emp.conversions ?? '—'}</span>
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-block', padding: '2px 10px',
                              background: rate > 50 ? '#f0fdf4' : rate > 0 ? '#fffbeb' : '#f3f4f6',
                              color: rate > 50 ? '#166534' : rate > 0 ? '#92400e' : '#6b7280',
                              borderRadius: 6, fontWeight: 600, fontSize: 12,
                              fontFamily: "'Space Mono', monospace",
                            }}>{rate}%</span>
                          </td>
                          <td style={{ color: 'var(--cd-muted)' }}>{emp.employee?.email || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>

        {/* ── Suggestions ── */}
        <Section title="Suggestions & Alerts">
          {loading ? <Shimmer h={48} r={10} /> : suggestions.length === 0 ? (
            <div style={{ color: 'var(--cd-muted)', fontSize: 13, padding: '12px 0', textAlign: 'center' }}>
              No suggestions at this time — keep up the great work!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {suggestions.map((sg, i) => (
                <div key={i} className="cd-suggestion">
                  <span className="cd-suggestion__dot" />
                  <span>{sg}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </>
  );
};

export default CompanyDashboard;