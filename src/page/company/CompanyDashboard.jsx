import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchActivityTimeline } from '../../api/activityApi';
import { exportData, importData } from '../../api/dataApi';
import { fetchCreditUsage } from '../../api/creditApi';
import { fetchPerformanceMetrics } from '../../api/performanceApi';
import { fetchAnalyticsData } from '../../api/analyticsApi';
import { Bar, Line, Pie } from 'react-chartjs-2';

// ─── Design tokens (mirrors Table.js / PageHeader style) ───────────────────
const s = {
  panel: {
    background: 'linear-gradient(160deg,#ffffff 0%,#f5f7f4 100%)',
    borderRadius: 16,
    border: '1px solid rgba(200,210,195,0.7)',
    boxShadow:
      '0 1px 0 rgba(255,255,255,0.9) inset,0 -1px 0 rgba(0,0,0,0.06) inset,0 4px 6px -2px rgba(0,0,0,0.05),0 12px 28px -6px rgba(0,0,0,0.10)',
  },
  limeBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '10px 22px', borderRadius: 11, cursor: 'pointer',
    fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
    color: '#1a3a00', letterSpacing: '0.01em', whiteSpace: 'nowrap',
    border: 'none',
    background: 'linear-gradient(160deg,#b5f053 0%,#84cc16 40%,#65a30d 100%)',
    borderTop: '1px solid rgba(255,255,255,0.45)',
    boxShadow:
      '0 1px 0 rgba(255,255,255,0.4) inset,0 -2px 0 rgba(0,0,0,0.15) inset,0 4px 0 #4d7c0f,0 5px 6px rgba(74,120,8,0.35),0 10px 20px rgba(101,163,13,0.20)',
    transition: 'all 0.15s ease',
  },
  outlineBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '9px 18px', borderRadius: 11, cursor: 'pointer',
    fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
    color: '#374140', whiteSpace: 'nowrap',
    background: 'linear-gradient(175deg,#ffffff 0%,#eff1ee 100%)',
    border: '1px solid rgba(180,190,175,0.6)',
    boxShadow:
      '0 1px 0 rgba(255,255,255,0.9) inset,0 -1px 0 rgba(0,0,0,0.06) inset,0 2px 4px rgba(0,0,0,0.08),0 2px 0 rgba(0,0,0,0.08)',
    transition: 'all 0.15s ease',
  },
};

const limeHover = (e) => {
  e.currentTarget.style.transform = 'translateY(-1px)';
  e.currentTarget.style.boxShadow =
    '0 1px 0 rgba(255,255,255,0.4) inset,0 5px 0 #4d7c0f,0 7px 10px rgba(74,120,8,0.40),0 14px 24px rgba(101,163,13,0.22)';
};
const limeLeave = (e) => {
  e.currentTarget.style.transform = '';
  e.currentTarget.style.boxShadow = s.limeBtn.boxShadow;
};
const limeDown = (e) => {
  e.currentTarget.style.transform = 'translateY(3px)';
  e.currentTarget.style.boxShadow =
    '0 2px 4px rgba(0,0,0,0.12) inset,0 1px 0 rgba(255,255,255,0.25) inset,0 1px 0 #4d7c0f';
};
const limeUp = (e) => {
  e.currentTarget.style.transform = 'translateY(-1px)';
  e.currentTarget.style.boxShadow =
    '0 1px 0 rgba(255,255,255,0.4) inset,0 5px 0 #4d7c0f,0 7px 10px rgba(74,120,8,0.40)';
};

// ─── Shimmer skeleton ────────────────────────────────────────────────────────
const Shimmer = ({ w = '100%', h = 16, r = 8, style = {} }) => (
  <>
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg,#f0f4ee 25%,#e4ebe0 50%,#f0f4ee 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      ...style,
    }} />
    <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
  </>
);

// ─── Stat Card ───────────────────────────────────────────────────────────────
const colorMap = {
  'bg-blue-50':   { bg: 'rgba(219,234,254,0.6)', icon: '#2563eb', text: '#1e40af', dot: '#3b82f6' },
  'bg-green-50':  { bg: 'rgba(220,252,231,0.6)', icon: '#16a34a', text: '#166534', dot: '#22c55e' },
  'bg-yellow-50': { bg: 'rgba(254,249,195,0.6)', icon: '#ca8a04', text: '#92400e', dot: '#f59e0b' },
  'bg-purple-50': { bg: 'rgba(243,232,255,0.6)', icon: '#9333ea', text: '#6b21a8', dot: '#a855f7' },
  'bg-red-50':    { bg: 'rgba(254,226,226,0.6)', icon: '#dc2626', text: '#991b1b', dot: '#ef4444' },
};

const StatCard = ({ label, value, bgColor, icon, loading }) => {
  const c = colorMap[bgColor] || colorMap['bg-blue-50'];
  return (
    <div style={{
      ...s.panel,
      padding: '20px 22px',
      display: 'flex', alignItems: 'flex-start', gap: 16,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Gloss */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 16, pointerEvents: 'none',
        background: 'linear-gradient(180deg,rgba(255,255,255,0.45) 0%,transparent 40%)',
      }} />
      {/* Icon bubble */}
      <div style={{
        width: 46, height: 46, borderRadius: 12, flexShrink: 0,
        background: c.bg,
        border: `1px solid ${c.dot}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 2px 8px ${c.dot}22`,
      }}>
        {React.cloneElement(icon, { style: { width: 22, height: 22, color: c.icon } })}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#9aaa98', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>
          {label}
        </div>
        {loading
          ? <Shimmer h={28} r={6} />
          : <div style={{ fontSize: 26, fontWeight: 700, color: '#1e2b1a', lineHeight: 1.1 }}>
              {value ?? '—'}
            </div>
        }
      </div>
      {/* Accent dot */}
      <div style={{
        position: 'absolute', top: 14, right: 14,
        width: 8, height: 8, borderRadius: '50%',
        background: c.dot,
        boxShadow: `0 0 0 3px ${c.dot}33`,
      }} />
    </div>
  );
};

// ─── Section wrapper ─────────────────────────────────────────────────────────
const Section = ({ title, children, action }) => (
  <div style={{ ...s.panel, padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
    <div style={{
      position: 'absolute', inset: 0, borderRadius: 16, pointerEvents: 'none',
      background: 'linear-gradient(180deg,rgba(255,255,255,0.45) 0%,transparent 40%)',
    }} />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, position: 'relative' }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: '#374140', letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>
        {title}
      </h2>
      {action}
    </div>
    <div style={{ position: 'relative' }}>{children}</div>
  </div>
);

// ─── Activity Timeline ───────────────────────────────────────────────────────
const ActivityTimeline = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityTimeline()
      .then(setActivities)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Section title="Activity Timeline">
      {loading
        ? [0,1,2].map(i => <Shimmer key={i} h={48} r={10} style={{ marginBottom: 10 }} />)
        : activities.length === 0
          ? <p style={{ fontSize: 13, color: '#9aaa98', margin: 0 }}>No recent activity.</p>
          : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activities.map((a, i) => (
                <li key={i} style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: 'linear-gradient(135deg,#f8faf7,#f0f4ee)',
                  border: '1px solid rgba(200,210,195,0.5)',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  <span style={{ fontSize: 13, color: '#374140' }}>{a.description}</span>
                  <span style={{ fontSize: 11, color: '#9aaa98' }}>{new Date(a.timestamp).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )
      }
    </Section>
  );
};

// ─── Credit Tracker ──────────────────────────────────────────────────────────
const CreditTracker = () => {
  const [credits, setCredits] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreditUsage()
      .then(setCredits)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const items = [
    { label: 'Employee Creation', key: 'employeeCreation', color: '#3b82f6' },
    { label: 'Campaign Usage',    key: 'campaignUsage',    color: '#22c55e' },
    { label: 'AI Processing',     key: 'aiProcessing',     color: '#a855f7' },
    { label: 'Recording Storage', key: 'recordingStorage', color: '#f59e0b' },
  ];

  const total = items.reduce((s, it) => s + (credits[it.key] || 0), 0) || 1;

  return (
    <Section title="Credit Usage">
      {loading
        ? [0,1,2,3].map(i => <Shimmer key={i} h={36} r={8} style={{ marginBottom: 8 }} />)
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map(it => {
              const val = credits[it.key] || 0;
              const pct = Math.round((val / total) * 100);
              return (
                <div key={it.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#374140', fontWeight: 500 }}>{it.label}</span>
                    <span style={{ fontSize: 12, color: '#9aaa98' }}>{val} cr</span>
                  </div>
                  <div style={{
                    height: 6, borderRadius: 99,
                    background: 'rgba(180,190,175,0.25)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.06) inset',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${it.color}cc, ${it.color})`,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </Section>
  );
};

// ─── Performance Evaluation ──────────────────────────────────────────────────
const PerformanceEvaluation = () => {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceMetrics()
      .then(setMetrics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const scoreColor = (score) => {
    if (score >= 80) return { bg: 'rgba(220,252,231,0.7)', text: '#166534', dot: '#22c55e' };
    if (score >= 50) return { bg: 'rgba(254,249,195,0.7)', text: '#92400e', dot: '#f59e0b' };
    return { bg: 'rgba(254,226,226,0.7)', text: '#991b1b', dot: '#ef4444' };
  };

  return (
    <Section title="AI Performance Evaluation">
      {loading
        ? [0,1,2].map(i => <Shimmer key={i} h={56} r={10} style={{ marginBottom: 10 }} />)
        : metrics.length === 0
          ? <p style={{ fontSize: 13, color: '#9aaa98', margin: 0 }}>No metrics available.</p>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {metrics.map((m, i) => {
                const c = scoreColor(m.score);
                return (
                  <div key={i} style={{
                    padding: '12px 14px', borderRadius: 10,
                    background: 'linear-gradient(135deg,#f8faf7,#f0f4ee)',
                    border: '1px solid rgba(200,210,195,0.5)',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#374140', marginBottom: 2 }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: '#9aaa98' }}>{m.description}</div>
                    </div>
                    <span style={{
                      padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: c.bg, color: c.text,
                      border: `1px solid ${c.dot}44`,
                      whiteSpace: 'nowrap',
                    }}>
                      {m.score}
                    </span>
                  </div>
                );
              })}
            </div>
          )
      }
    </Section>
  );
};

// ─── Data Import / Export ────────────────────────────────────────────────────
const DataImportExportTools = () => {
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      await importData(fd);
      alert('Data imported successfully!');
    } catch { alert('Failed to import data.'); }
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'exported_data.json'; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Failed to export data.'); }
  };

  return (
    <Section title="Data Import / Export">
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <label
          style={{ ...s.outlineBtn, position: 'relative' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 3v8M5 8l3 3 3-3M3 13h10" />
          </svg>
          Import Data
          <input type="file" style={{ display: 'none' }} onChange={handleImport} />
        </label>

        <button
          style={s.limeBtn}
          onClick={handleExport}
          onMouseEnter={limeHover} onMouseLeave={limeLeave}
          onMouseDown={limeDown} onMouseUp={limeUp}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 13V5M5 8l3-3 3 3M3 13h10" />
          </svg>
          Export Data
        </button>
      </div>
    </Section>
  );
};

// ─── Analytics Charts ────────────────────────────────────────────────────────
const chartOpts = (label) => ({
  responsive: true,
  plugins: {
    legend: { position: 'top', labels: { font: { size: 12 }, color: '#374140' } },
    title: { display: false },
  },
  scales: label !== 'pie' ? {
    x: { grid: { color: 'rgba(180,190,175,0.2)' }, ticks: { color: '#9aaa98', font: { size: 11 } } },
    y: { grid: { color: 'rgba(180,190,175,0.2)' }, ticks: { color: '#9aaa98', font: { size: 11 } } },
  } : undefined,
});

const AdvancedAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData()
      .then(setAnalytics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <>
      {[0,1,2].map(i => (
        <div key={i} style={{ ...s.panel, padding: '20px 22px', marginBottom: 16 }}>
          <Shimmer h={200} r={10} />
        </div>
      ))}
    </>
  );

  if (!analytics) return (
    <div style={{ ...s.panel, padding: '24px', textAlign: 'center', color: '#9aaa98', fontSize: 13 }}>
      No analytics data available.
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Section title="Total Leads">
        <Bar data={analytics.totalLeads} options={chartOpts('bar')} />
      </Section>
      <Section title="Conversion Rate">
        <Line data={analytics.conversionRate} options={chartOpts('line')} />
      </Section>
      <Section title="Revenue Growth">
        <Pie data={analytics.revenueGrowth} options={chartOpts('pie')} />
      </Section>
    </div>
  );
};

// ─── Main Dashboard ──────────────────────────────────────────────────────────
const CompanyDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const companyId = user?.company?._id || JSON.parse(localStorage.getItem('_id'));
        if (!companyId) throw new Error('Company ID not found');
        const res = await fetch(`/api/company/${companyId}/stats`);
        const data = await res.json();
        setStats(data.stats);
        setCredits(data.credits);
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  const statCards = [
    {
      label: 'Total Leads', value: stats.totalLeads, bgColor: 'bg-blue-50',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>,
    },
    {
      label: 'Conversion Rate', value: stats.conversionRate != null ? `${stats.conversionRate}%` : undefined, bgColor: 'bg-green-50',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>,
    },
    {
      label: 'Revenue Growth', value: stats.revenueGrowth != null ? `$${stats.revenueGrowth}` : undefined, bgColor: 'bg-yellow-50',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>,
    },
    {
      label: 'Active Campaigns', value: stats.activeCampaigns, bgColor: 'bg-purple-50',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" /></svg>,
    },
    {
      label: 'Credits Remaining', value: credits, bgColor: 'bg-red-50',
      icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" /></svg>,
    },
  ];

  return (
    <div style={{ padding: '8px 4px' }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1e2b1a', marginBottom: 2 }}>
          Dashboard
        </div>
        <div style={{ fontSize: 13, color: '#9aaa98' }}>
          Welcome back, {user?.name || 'there'} — here's what's happening.
        </div>
      </div>

      {/* ── Stat cards row ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 14,
        marginBottom: 20,
      }}>
        {statCards.map((c, i) => <StatCard key={i} {...c} loading={loading} />)}
      </div>

      {/* ── Main content grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: 14,
        alignItems: 'start',
      }}>
        <ActivityTimeline />
        <CreditTracker />
        <PerformanceEvaluation />
        <DataImportExportTools />
      </div>

      {/* ── Analytics (full width) ── */}
      <div style={{ marginTop: 14 }}>
        <AdvancedAnalyticsDashboard />
      </div>

    </div>
  );
};

export default CompanyDashboard;