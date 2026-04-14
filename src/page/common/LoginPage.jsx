import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, userType: currentUserType } = useAuth();

  const allLeads = [
    { name: 'Aryan Sharma', email: 'aryan@example.com', badge: 'Hot', bs: { background: 'rgba(239,68,68,.2)', color: '#fca5a5' } },
    { name: 'Priya Mehta', email: 'hi@priya.co', badge: 'Follow up', bs: { background: 'rgba(234,179,8,.2)', color: '#fde047' } },
    { name: 'Rahul Singh', email: 'rahul@startup.io', badge: 'New', bs: { background: 'rgba(59,130,246,.2)', color: '#93c5fd' } },
    { name: 'Sakshi Gupta', email: 'sakshi@corp.in', badge: 'Closed', bs: { background: 'rgba(132,204,22,.2)', color: '#bef264' } },
    { name: 'Vikas Patel', email: 'vikas@mail.com', badge: 'Meeting', bs: { background: 'rgba(168,85,247,.2)', color: '#d8b4fe' } },
    { name: 'Neha Verma', email: 'neha@venture.io', badge: 'New', bs: { background: 'rgba(59,130,246,.2)', color: '#93c5fd' } },
  ];

  const filteredLeads = allLeads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 3);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,600&family=Satisfy:wght@400&display=swap';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setSearchLoading(true);
      const timer = setTimeout(() => setSearchLoading(false), 1000);
      return () => clearTimeout(timer);
    } else {
      setSearchLoading(false);
    }
  }, [searchTerm]);

  if (isAuthenticated) return <Navigate to={`/${currentUserType}/dashboard`} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userType = await login('company', { email, password });
      toast.success('Welcome back! Signing in...', { duration: 2000 });
      navigate(`/${userType}/dashboard`);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Invalid credentials. Please try again.';
      toast.error(errorMessage, { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-page {
          font-family: 'DM Sans', system-ui, sans-serif;
          min-height: 100vh;
          background: #f5f0e8;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        /* ── THE TWO-CARD CONTAINER ── */
        .lp-container {
          display: flex;
          width: 100%;
          max-width: 1080px;
          min-height: 640px;
          border-radius: 0px;
          overflow: hidden;
          box-shadow:
            0 2px 4px rgba(0,0,0,.04),
            0 24px 68px rgba(0,0,0,.10);
        }

        /* ── LEFT CARD ── */
        .lp-left {
          flex: 0 0 440px;
          background: #fff;
          display: flex;
          flex-direction: column;
          padding: 0;
          position: relative;
          z-index: 2;
        }

        .lp-left-chrome {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 20px 28px 0;
        }
        .lp-chr-dot { width: 11px; height: 11px; border-radius: 50%; }

        .lp-left-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 50px 50px 50px;
        }

        /* ── staggered entrance ── */
        @keyframes lp-rise {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lp-a1 { animation: lp-rise .5s cubic-bezier(.22,1,.36,1) .05s both; }
        .lp-a2 { animation: lp-rise .5s cubic-bezier(.22,1,.36,1) .12s both; }
        .lp-a3 { animation: lp-rise .5s cubic-bezier(.22,1,.36,1) .2s both; }
        .lp-a4 { animation: lp-rise .5s cubic-bezier(.22,1,.36,1) .28s both; }
        .lp-a5 { animation: lp-rise .5s cubic-bezier(.22,1,.36,1) .36s both; }
        .lp-a6 { animation: lp-rise .5s cubic-bezier(.22,1,.36,1) .44s both; }
        .lp-a7 { animation: lp-rise .5s cubic-bezier(.22,1,.36,1) .52s both; }
        .lp-a8 { animation: lp-rise .5s cubic-bezier(.22,1,.36,1) .60s both; }

        /* ── brand logotype ── */
        .lp-brand {
          display: flex; align-items: center; gap: 11px;
          margin-bottom: 40px;
        }
        .lp-logomark {
          width: 38px; height: 38px; border-radius: 11px;
          background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        /* ── form headline ── */
        .lp-form-headline {
          font-size: 26px; font-weight: 600; color: #111;
          letter-spacing: -.02em; margin-bottom: 34px;
          line-height: 1.3; font-family: 'Cormorant Garamond', serif;
        }

        /* ── form group ── */
        .lp-form-group {
          display: flex; flex-direction: column; margin-bottom: 22px;
        }
        .lp-form-label {
          display: block; font-size: 13px; font-weight: 600;
          color: #222; margin-bottom: 10px; font-family: 'DM Sans', sans-serif;
          letter-spacing: -.005em;
        }

        /* ── inputs ── */
        .lp-input {
          width: 100%; padding: 12px 16px;
          border: 1.5px solid #e0e0e0; border-radius: 11px;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          background: #fff; color: #111; outline: none;
          transition: border-color .2s, box-shadow .2s, background .2s;
        }
        .lp-input:focus {
          border-color: #84cc16;
          box-shadow: 0 0 0 4px rgba(132,204,22,.08);
          background: #fafafa;
        }
        .lp-input::placeholder { color: #d0d0d0; }

        /* ── password toggle button ── */
        .lp-pwd-toggle {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: #999; cursor: pointer;
          padding: 0; display: flex; align-items: center; justify-content: center;
          transition: color .15s;
        }
        .lp-pwd-toggle:hover { color: #555; }

        /* ── submit button ── */
        .lp-btn {
          width: 100%; padding: 14px; border: none; border-radius: 11px;
          background: #111; color: #fff; font-size: 14px; font-weight: 600;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          transition: background .2s, transform .12s, box-shadow .2s;
          box-shadow: 0 2px 8px rgba(0,0,0,.10);
          letter-spacing: -.01em; margin-top: 12px;
        }
        .lp-btn:hover:not(:disabled) {
          background: #1f1f1f; transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,.18);
        }
        .lp-btn:active:not(:disabled) { transform: translateY(0); }
        .lp-btn:disabled { opacity: .55; cursor: not-allowed; }
        .lp-btn-inner { display: flex; align-items: center; justify-content: center; gap: 8px; }

        @keyframes lp-spin { to { transform: rotate(360deg); } }
        .lp-spinner { animation: lp-spin .9s linear infinite; }

        /* ── divider ── */
        .lp-divider {
          display: flex; align-items: center; gap: 14px;
          margin: 6px 0;
        }
        .lp-divider::before, .lp-divider::after {
          content: ''; flex: 1; height: 1px; background: #e8e8e8;
        }

        /* ── social buttons ── */
        .lp-social-row { display: flex; gap: 10px; }
        .lp-social-btn {
          flex: 1; padding: 10px; border: 1.5px solid #e5e5e5;
          border-radius: 9px; background: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: border-color .15s, background .15s;
          font-family: 'DM Sans', sans-serif;
        }
        .lp-social-btn:hover { border-color: #ccc; background: #fafafa; }

        /* ── RIGHT CARD ── */
        .lp-right {
          flex: 1; position: relative; overflow: hidden;
          min-width: 0;
        }
        @keyframes lp-fadein { from { opacity: 0; } to { opacity: 1; } }

        .lp-bg-img {
          position: absolute; inset: 0;
          width: 100%; height: 100%; object-fit: cover;
          transition: opacity .8s ease;
        }

        .lp-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(160deg,
            rgba(5,30,4,.55) 0%,
            rgba(15,60,20,.30) 55%,
            rgba(0,0,0,.10) 100%);
        }

        .lp-grain {
          position: absolute; inset: 0; pointer-events: none;
          opacity: .22; mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 160px 160px;
        }

        .lp-right-content {
          position: relative; z-index: 2; height: 100%;
          display: flex; flex-direction: column;
          justify-content: center; align-items: center;
          padding: 32px 32px;
          text-align: center;
        }

        .lp-tagline {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px; font-weight: 500; color: #bbf7d0;
          line-height: 1.2; letter-spacing: -.01em;
          margin-bottom: 24px;
        }

        /* ── floating CRM card ── */
        @keyframes lp-float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-7px); }
        }
        @keyframes lp-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: .35; transform: scale(.75); }
        }
        .lp-crm-card {
          background: rgba(255,255,255,.11);
          backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,.16);
          padding: 14px; width: 100%; max-width: 368px;
          box-shadow: 0 40px 80px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.07);
          animation: lp-float 5.5s ease-in-out infinite;
          text-align: left;
        }

        .lp-card-chrome {
          display: flex; align-items: center; gap: 6px;
          padding-bottom: 10px; margin-bottom: 10px;
          border-bottom: 1px solid rgba(255,255,255,.09);
        }
        .lp-dot { width: 9px; height: 9px; border-radius: 50%; }
        .lp-live-pill {
          margin-left: auto; display: flex; align-items: center; gap: 4px;
          font-size: 8px; font-weight: 700; color: #86efac;
          letter-spacing: .06em; font-family: 'DM Sans', sans-serif;
        }
        .lp-live-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #4ade80;
          animation: lp-pulse 2s ease-in-out infinite;
        }

        /* ── Search bar inside card ── */
        .lp-search-bar {
          display: flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,.07); border-radius: 9px;
          padding: 7px 10px; margin-bottom: 10px;
          border: 1px solid rgba(255,255,255,.06);
          transition: border-color .18s, background .18s;
        }
        .lp-search-bar:focus-within {
          border-color: rgba(255,255,255,.20);
          background: rgba(255,255,255,.13);
        }
        .lp-search-bar input {
          background: none; border: none; outline: none;
          color: #fff; flex: 1; font-size: 11.5px;
          font-family: 'DM Sans', sans-serif;
        }
        .lp-search-bar input::placeholder { color: rgba(255,255,255,.28); }
        .lp-search-clear {
          background: none; border: none; cursor: pointer; padding: 0;
          color: rgba(255,255,255,.30); font-size: 12px; line-height: 1;
          display: flex; align-items: center; transition: color .15s;
        }
        .lp-search-clear:hover { color: rgba(255,255,255,.65); }

        /* ── Stats Grid ── */
        .lp-stats-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px;
          margin-bottom: 10px;
        }
        .lp-stat-box {
          background: rgba(255,255,255,.06); border-radius: 9px;
          padding: 8px 8px 7px; text-align: center;
          border: 1px solid rgba(255,255,255,.08);
        }
        .lp-stat-label {
          font-size: 7px; font-weight: 600; letter-spacing: .06em;
          text-transform: uppercase; color: rgba(255,255,255,.30);
          margin-bottom: 3px; font-family: 'DM Sans', sans-serif;
        }
        .lp-stat-value {
          font-size: 17px; font-weight: 700; color: #fff; line-height: 1;
          font-family: 'DM Sans', sans-serif;
        }
        .lp-stat-trend {
          font-size: 7.5px; color: #4ade80; margin-top: 3px;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Conversion bar ── */
        .lp-conv-bar { margin-bottom: 9px; }
        .lp-conv-label {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 4px; font-size: 7.5px; font-weight: 600;
          letter-spacing: .05em; text-transform: uppercase;
          color: rgba(255,255,255,.28); font-family: 'DM Sans', sans-serif;
        }
        .lp-conv-track {
          height: 3px; background: rgba(255,255,255,.08);
          border-radius: 999px; overflow: hidden;
        }
        .lp-conv-fill {
          height: 100%; width: 22.5%; border-radius: 999px;
          background: linear-gradient(90deg,#4ade80,#84cc16);
        }

        /* ── Section labels ── */
        .lp-section-label {
          font-size: 8.5px; font-weight: 600; letter-spacing: .08em;
          text-transform: uppercase; color: rgba(255,255,255,.28);
          margin: 0 0 5px; font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; justify-content: space-between;
        }
        .lp-section-count {
          font-size: 8px; font-weight: 500; color: rgba(255,255,255,.20);
          letter-spacing: 0; text-transform: none;
        }

        /* ── Fixed-height leads list ── */
        .lp-leads-list { min-height: 156px; }
        .lp-lead-row {
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(255,255,255,.06); border-radius: 8px; padding: 7px 10px;
          margin-bottom: 4px; cursor: pointer;
          transition: background .15s;
        }
        .lp-lead-row:hover { background: rgba(255,255,255,.12); }
        .lp-lead-row:last-child { margin-bottom: 0; }
        .lp-avatar {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #4ade80, #065f46);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; color: #fff;
          font-family: 'DM Sans', sans-serif;
        }
        .lp-badge {
          font-size: 9px; font-weight: 600; padding: 2px 8px;
          border-radius: 999px; font-family: 'DM Sans', sans-serif; white-space: nowrap;
        }
        .lp-empty-state {
          display: flex; align-items: center; justify-content: center;
          height: 156px; flex-direction: column; gap: 7px;
          color: rgba(255,255,255,.25); font-size: 11px;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Skeleton loader ── */
        @keyframes lp-skeleton-pulse {
          0%, 100% { opacity: .6; }
          50% { opacity: 1; }
        }
        .lp-skeleton-row {
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(255,255,255,.06); border-radius: 8px; padding: 7px 10px;
          margin-bottom: 4px;
        }
        .lp-skeleton-avatar {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          background: rgba(255,255,255,.08);
          animation: lp-skeleton-pulse 1s ease-in-out infinite;
        }
        .lp-skeleton-text {
          display: flex; flex-direction: column; gap: 4px; flex: 1; margin-left: 9px;
        }
        .lp-skeleton-line {
          height: 8px; background: rgba(255,255,255,.08); border-radius: 4px;
          animation: lp-skeleton-pulse 1s ease-in-out infinite;
        }
        .lp-skeleton-line:first-child { width: 75px; }
        .lp-skeleton-line:nth-child(2) { width: 110px; }
        .lp-skeleton-badge {
          width: 50px; height: 18px; border-radius: 999px;
          background: rgba(255,255,255,.08);
          animation: lp-skeleton-pulse 1s ease-in-out infinite;
        }

        /* ── Card footer ── */
        .lp-card-footer {
          margin-top: 10px; padding-top: 9px;
          border-top: 1px solid rgba(255,255,255,.08);
          display: flex; align-items: center; justify-content: space-between;
        }
        .lp-card-footer-label {
          font-size: 8px; font-weight: 600; letter-spacing: .05em;
          text-transform: uppercase; color: rgba(255,255,255,.18);
          font-family: 'DM Sans', sans-serif;
        }
        .lp-card-footer-link {
          display: flex; align-items: center; gap: 4px;
          font-size: 9px; color: rgba(255,255,255,.35);
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: color .15s;
        }
        .lp-card-footer-link:hover { color: rgba(255,255,255,.7); }

        /* ── play button ── */
        .lp-play {
          width: 42px; height: 42px; border-radius: 50%;
          background: rgba(255,255,255,.18);
          backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center;
          margin-top: 18px; cursor: pointer;
          border: 1px solid rgba(255,255,255,.15);
          transition: background .2s, transform .15s;
        }
        .lp-play:hover { background: rgba(255,255,255,.28); transform: scale(1.08); }

        /* ── footer (below cards) ── */
        .lp-footer {
          margin-top: 16px;
          text-align: center;
          font-size: 12px;
          color: #a09880;
        }

        @media (max-width: 920px) {
          .lp-right { display: none; }
          .lp-left  { flex: 1; border-radius: 20px; }
          .lp-container { max-width: 440px; min-height: 480px; }
        }
      `}</style>

      <div className="lp-page">

        <div className="lp-container">

          {/* ════════ LEFT CARD ════════ */}
          <div className="lp-left">

            {/* macOS chrome */}
            <div className="lp-left-chrome lp-a1">
              <div className="lp-chr-dot" style={{ background: '#ff5f57' }} />
              <div className="lp-chr-dot" style={{ background: '#ffbd2e' }} />
              <div className="lp-chr-dot" style={{ background: '#28c840' }} />
            </div>

            <div className="lp-left-body">

              {/* Brand */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#111', fontFamily: "'Sallafi', 'Crimson Text', serif", letterSpacing: '0.5px' }}>apex-CRM</span>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

                <div className="lp-form-group lp-a3">
                  <label className="lp-form-label">Email</label>
                  <input
                    className="lp-input" type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    required autoComplete="email"
                    placeholder="you@company.com"
                  />
                </div>

                <div className="lp-form-group lp-a4">
                  <label className="lp-form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="lp-input" type={showPass ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      required autoComplete="current-password"
                      placeholder="••••••••" style={{ paddingRight: 44 }}
                    />
                    <button type="button" className="lp-pwd-toggle" onClick={() => setShowPass(p => !p)}>
                      {showPass ? (
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                      ) : (
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading} className="lp-btn lp-a5">
                  <span className="lp-btn-inner">
                    {loading ? (
                      <>
                        <svg className="lp-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.3)" strokeWidth="3" />
                          <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        Signing in…
                      </>
                    ) : 'Sign in'}
                  </span>
                </button>
              </form>
            </div>
          </div>

          {/* ════════ RIGHT CARD ════════ */}
          <div className="lp-right">

            <img
              className="lp-bg-img"
              src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=85"
              alt=""
              onLoad={() => setImgLoaded(true)}
              style={{ opacity: imgLoaded ? 1 : 0 }}
            />

            <div className="lp-overlay" />
            <div className="lp-grain" />

            <div className="lp-right-content">

              {/* Tagline */}
              <p className="lp-tagline">
                Turn every lead into<br />a loyal client.
              </p>

              {/* Floating CRM card */}
              <div className="lp-crm-card">

                {/* Chrome bar */}
                <div className="lp-card-chrome">
                  <div className="lp-dot" style={{ background: '#ff5f57' }} />
                  <div className="lp-dot" style={{ background: '#ffbd2e' }} />
                  <div className="lp-dot" style={{ background: '#28c840' }} />
                  <span style={{ marginLeft: 8, fontSize: 10, color: 'rgba(255,255,255,.38)', fontFamily: "'DM Sans', sans-serif" }}>Campaign Overview</span>
                  <div className="lp-live-pill"><div className="lp-live-dot" />LIVE</div>
                </div>

                {/* Search bar */}
                <div className="lp-search-bar">
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,.35)" strokeWidth={2}>
                    <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search leads by name or email…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button className="lp-search-clear" onClick={() => setSearchTerm('')}>✕</button>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="lp-stats-grid">
                  <div className="lp-stat-box s-green">
                    <div className="lp-stat-label">Total Leads</div>
                    <div className="lp-stat-value">2,847</div>
                    <div className="lp-stat-trend">↑ 17% this mo.</div>
                  </div>
                  <div className="lp-stat-box s-blue">
                    <div className="lp-stat-label">Converted</div>
                    <div className="lp-stat-value">641</div>
                    <div className="lp-stat-trend">↑ 8% this mo.</div>
                  </div>
                  <div className="lp-stat-box s-purple">
                    <div className="lp-stat-label">Active</div>
                    <div className="lp-stat-value">18</div>
                    <div className="lp-stat-trend">↑ 5% this mo.</div>
                  </div>
                </div>

                {/* Conversion rate bar */}
                <div className="lp-conv-bar">
                  <div className="lp-conv-label">
                    <span>Conversion Rate</span>
                    <span style={{ color: '#4ade80', fontWeight: 700 }}>22.5%</span>
                  </div>
                  <div className="lp-conv-track"><div className="lp-conv-fill" /></div>
                </div>

                {/* Recent Leads — fixed height, filled with invisible placeholders */}
                <div className="lp-section-label">
                  <span>Recent Leads</span>
                  <span className="lp-section-count">{searchTerm ? `${filteredLeads.length} found` : '6 total'}</span>
                </div>

                <div className="lp-leads-list">
                  {searchLoading && searchTerm ? (
                    <>
                      {[1, 2, 3].map((i) => (
                        <div key={`skeleton-${i}`} className="lp-skeleton-row">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1 }}>
                            <div className="lp-skeleton-avatar" />
                            <div className="lp-skeleton-text">
                              <div className="lp-skeleton-line" />
                              <div className="lp-skeleton-line" />
                            </div>
                          </div>
                          <div className="lp-skeleton-badge" />
                        </div>
                      ))}
                    </>
                  ) : filteredLeads.length === 0 && searchTerm ? (
                    <div className="lp-empty-state">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,.22)" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                      </svg>
                      No leads match &ldquo;{searchTerm}&rdquo;
                    </div>
                  ) : (
                    <>
                      {filteredLeads.map(c => (
                        <div key={c.name} className="lp-lead-row">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div className="lp-avatar">{c.name[0]}</div>
                            <div>
                              <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>{c.name}</p>
                              <p style={{ margin: 0, fontSize: 9, color: 'rgba(255,255,255,.36)', fontFamily: "'DM Sans', sans-serif" }}>{c.email}</p>
                            </div>
                          </div>
                          <span className="lp-badge" style={c.bs}>{c.badge}</span>
                        </div>
                      ))}
                      {Array.from({ length: Math.max(0, 3 - filteredLeads.length) }).map((_, i) => (
                        <div key={`ph-${i}`} className="lp-lead-row" style={{ opacity: 0, pointerEvents: 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div className="lp-avatar">-</div>
                            <div><p style={{ margin: 0, fontSize: 11.5, color: '#fff' }}>-</p><p style={{ margin: 0, fontSize: 9 }}>-</p></div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Card footer */}
                <div className="lp-card-footer">
                  <span className="lp-card-footer-label">ApexInnovs CRM</span>
                  <span className="lp-card-footer-link">
                    View all leads
                    <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </span>
                </div>
              </div>

              {/* Play button */}
              <div className="lp-play">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>

        </div>

        {/* Footer below cards */}
        {/* <p className="lp-footer">
          By creating an account, you agree to our <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>terms of use</span>.
        </p> */}

      </div>
    </>
  );
};

export default LoginPage;
