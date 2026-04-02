import React from 'react';

const Loader = () => {
  const letters = ['L', 'o', 'a', 'd', 'i', 'n', 'g'];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: '100%',
      minHeight: '340px',
    }}>
      <style>{`
        @keyframes spin-cw  { to { transform: rotate(360deg); } }
        @keyframes spin-ccw { to { transform: rotate(-360deg); } }

        @keyframes core-pulse {
          0%,100% { transform: scale(1);   box-shadow: 0 0 0 0 rgba(99,102,241,0.5), 0 0 20px 4px rgba(99,102,241,0.2); }
          50%      { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(99,102,241,0), 0 0 32px 8px rgba(99,102,241,0.35); }
        }

        @keyframes sat-orbit {
          0%   { transform: rotate(var(--start)) translateX(52px) rotate(calc(-1 * var(--start))); }
          100% { transform: rotate(calc(var(--start) + 360deg)) translateX(52px) rotate(calc(-1 * (var(--start) + 360deg))); }
        }

        @keyframes spark {
          0%   { transform: rotate(var(--a)) translateX(0px) scale(1); opacity: 1; }
          100% { transform: rotate(var(--a)) translateX(70px) scale(0); opacity: 0; }
        }

        @keyframes ripple {
          0%   { transform: scale(0.5); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        @keyframes progress {
          0%   { width: 0%;   opacity: 1; }
          80%  { width: 100%; opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }

        @keyframes letter-wave {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-5px); }
        }

        .loader-ring-outer {
          position: absolute; width: 120px; height: 120px;
          border-radius: 50%;
          border: 2px dashed rgba(99,102,241,0.35);
          animation: spin-cw 8s linear infinite;
        }
        .loader-ring-mid {
          position: absolute; width: 90px; height: 90px;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: #6366f1; border-right-color: #818cf8;
          animation: spin-ccw 1.2s cubic-bezier(0.6,0,0.4,1) infinite;
        }
        .loader-ring-inner {
          position: absolute; width: 66px; height: 66px;
          border-radius: 50%;
          border: 2px solid transparent;
          border-bottom-color: #a5b4fc; border-left-color: #c7d2fe;
          animation: spin-cw 0.9s cubic-bezier(0.6,0,0.4,1) infinite;
        }
        .loader-core {
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #818cf8);
          animation: core-pulse 1.8s ease-in-out infinite;
        }
        .loader-sat {
          position: absolute; top: 50%; left: 50%;
          border-radius: 50%;
          animation: sat-orbit var(--dur) linear infinite;
        }
        .loader-spark {
          position: absolute; width: 3px; height: 3px;
          border-radius: 50%; background: #6366f1;
          animation: spark 1.6s ease-out infinite;
          animation-delay: var(--d);
        }
        .loader-ripple {
          position: absolute; width: 60px; height: 60px;
          border-radius: 50%;
          border: 1.5px solid rgba(99,102,241,0.5);
          animation: ripple 2.4s ease-out infinite;
        }
        .loader-bar-fill {
          height: 100%; border-radius: 99px;
          background: linear-gradient(90deg, #6366f1, #a5b4fc, #6366f1);
          animation: progress 2.2s ease-in-out infinite;
        }
        .loader-letter {
          display: inline-block;
          font-size: 15px; font-weight: 600;
          color: #6366f1; letter-spacing: 0.05em;
          animation: letter-wave 1.4s ease-in-out infinite;
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', position: 'relative' }}>

        {/* Ripple rings */}
        <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '120px', height: '120px' }}>
          {[0, 0.8, 1.6].map((delay, i) => (
            <div key={i} className="loader-ripple" style={{ animationDelay: `${delay}s` }} />
          ))}
        </div>

        {/* Spinner stack */}
        <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loader-ring-outer" />
          <div className="loader-ring-mid" />
          <div className="loader-ring-inner" />

          {/* Satellites */}
          {[
            { start: '0deg',   dur: '2s',   size: 10, color: '#6366f1' },
            { start: '90deg',  dur: '2.8s', size: 8,  color: '#818cf8' },
            { start: '180deg', dur: '2s',   size: 6,  color: '#a5b4fc' },
            { start: '270deg', dur: '2.8s', size: 5,  color: '#c7d2fe' },
          ].map((s, i) => (
            <div key={i} className="loader-sat" style={{
              '--start': s.start, '--dur': s.dur,
              width: `${s.size}px`, height: `${s.size}px`,
              marginTop: `-${s.size / 2}px`, marginLeft: `-${s.size / 2}px`,
              background: s.color,
            }} />
          ))}

          {/* Sparks */}
          <div style={{ position: 'absolute', width: 0, height: 0 }}>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <div key={i} className="loader-spark" style={{ '--a': `${angle}deg`, '--d': `${i * 0.2}s` }} />
            ))}
          </div>

          <div className="loader-core" />
        </div>

        {/* Progress bar */}
        <div style={{ width: '160px', height: '3px', background: 'rgba(99,102,241,0.15)', borderRadius: '99px', overflow: 'hidden' }}>
          <div className="loader-bar-fill" />
        </div>

        {/* Wave text */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
          {letters.map((l, i) => (
            <span key={i} className="loader-letter" style={{ animationDelay: `${i * 0.07}s` }}>{l}</span>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Loader;