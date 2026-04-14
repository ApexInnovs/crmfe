import { LogOut } from "lucide-react";

const Sidebar = ({ brandHighlight = "", onLogout }) => {
  return (
    <aside
      className="w-50 bg-[#0b0d17] min-h-screen flex flex-col shrink-0"
      style={{ boxShadow: "2px 0 16px 0 rgb(0 0 0 / 0.18)" }}
    >
      {/* Brand */}
      <div className="flex items-end gap-2 h-16 px-5 border-b border-white/6">
        <span
          className="text-[24px] font-extrabold tracking-tight select-none leading-none pb-3"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <span className="text-white">ca</span>
          <span className="text-indigo-400">lly</span>
        </span>
        {brandHighlight && (
          <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest pb-3.5 select-none">
            {brandHighlight}
          </span>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Logout */}
      {onLogout && (
        <div className="px-3 pb-4">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium
              text-gray-500 hover:bg-red-500/15 hover:text-red-400 transition-all duration-150 focus:outline-none"
          >
            <LogOut className="shrink-0" size={15} />
            <span>Logout</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="py-3 px-4 border-t border-white/6 text-[11px] text-gray-700 text-center select-none">
        &copy; {new Date().getFullYear()} <span style={{ fontFamily: "'Sallafi', 'Crimson Text', serif", fontWeight: 700, fontSize: '10px' }}>apex-CRM</span>
      </div>
    </aside>
  );
};

export default Sidebar;
