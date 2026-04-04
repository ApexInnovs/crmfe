import { useState, useRef, useEffect } from "react";
import useFeedback from "../hooks/useFeedback";
import { TbLogout, TbMenu2, TbX } from "react-icons/tb";
import { useAuth } from "../context/AuthContext";
import adminRoutes from "../routes/adminRoutes";
import companyRoutes from "../routes/companyRoutes";
import { getEmployeeRoutes } from "../routes/employeeRoutes";

const layoutConfig = {
	admin: { routes: adminRoutes },
	company: { routes: companyRoutes },
	employee: { routes: null },
};

const MainLayout = ({ children }) => {
	const { fire } = useFeedback();
	const hapticTab = () => fire({ haptic: [{ duration: 30 }, { delay: 60, duration: 40, intensity: 1 }], sound: true });
	const { user, userType, permissions, logout } = useAuth();
	const config = layoutConfig[userType] || layoutConfig.admin;
	const routes = userType === "employee" ? getEmployeeRoutes(permissions) : config.routes;

	const isCompany = userType === "company";

	const [activeTabIndex, setActiveTabIndex] = useState(0);
	const [showUserMenu, setShowUserMenu] = useState(false);
	const [indicator, setIndicator] = useState({ left: 0, width: 0 });
	const [sidebarOpen, setSidebarOpen] = useState(false);

	const userMenuRef = useRef(null);
	const tabRefs = useRef([]);
	const sidebarRef = useRef(null);

	const activeRoute = routes?.[activeTabIndex];
	const ActiveComponent = activeRoute?.component;

	const userEmail = user?.email || user?.companyEmail || user?.adminEmail || "User";
	const userInitial = userEmail?.charAt(0)?.toUpperCase() || "U";

	// Track sliding indicator position (tabs — non-company only)
	useEffect(() => {
		if (isCompany) return;
		const el = tabRefs.current[activeTabIndex];
		if (el) {
			setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
		}
	}, [activeTabIndex, routes, isCompany]);

	// Close sidebar when clicking outside
	useEffect(() => {
		if (!sidebarOpen) return;
		const handler = (e) => {
			if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
				setSidebarOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [sidebarOpen]);

	const handleClickOutside = (e) => {
		if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
			setShowUserMenu(false);
		}
	};

	return (
		<div
			className="flex flex-col min-h-screen"
			style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
			onClick={handleClickOutside}
		>
			{/* Header */}
			<header
				className="bg-transparent shrink-0 flex items-center justify-between px-8 h-16"
				style={{ boxShadow: "0 1px 6px 0 rgb(0 0 0 / 0.06)" }}
			>
				{/* Left: Hamburger (company) OR Branding + Tabs (others) */}
				<div className="flex items-center gap-3">
					{isCompany && (
						<button
							onClick={(e) => { e.stopPropagation(); setSidebarOpen((o) => !o); hapticTab(); }}
							className="flex items-center justify-center w-8 h-8 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all duration-150 outline-none cursor-pointer"
							aria-label="Toggle navigation"
						>
							{sidebarOpen ? <TbX className="text-[20px]" /> : <TbMenu2 className="text-[20px]" />}
						</button>
					)}

					{/* Branding */}
					<span
						className="text-[38px] font-normal select-none leading-none text-slate-900"
						style={{ fontFamily: "'Satisfy', cursive" }}
					>
						cally
					</span>

					{/* Tabs — admin & employee only */}
					{!isCompany && (
						<nav className="relative flex items-center rounded-[10px] p-1.25 gap-0">
							{/* Sliding indicator */}
							<div
								className="absolute top-1.25 rounded-[7px] bg-lime-400"
								style={{
									left: indicator.left,
									width: indicator.width,
									height: "calc(100% - 10px)",
									backgroundImage: "linear-gradient(to bottom, #bef264 0%, #a3e635 45%, #84cc16 100%)",
									boxShadow:
										"0 1px 0 0 rgba(255,255,255,0.55) inset, " +
										"0 -1px 0 0 rgba(0,0,0,0.18) inset, " +
										"1px 0 0 0 rgba(255,255,255,0.12) inset, " +
										"-1px 0 0 0 rgba(255,255,255,0.08) inset, " +
										"0 2px 6px 0 rgba(132,204,22,0.55), " +
										"0 6px 16px 0 rgba(132,204,22,0.30), " +
										"0 12px 28px 0 rgba(132,204,22,0.15), " +
										"0 1px 2px 0 rgba(0,0,0,0.22)",
									transition: "left 0.22s cubic-bezier(0.4,0,0.2,1), width 0.22s cubic-bezier(0.4,0,0.2,1)",
								}}
							/>
							{routes?.map((route, index) => {
								const { label, icon: Icon } = route;
								const isActive = activeTabIndex === index;
								return (
									<button
										key={index}
										ref={(el) => (tabRefs.current[index] = el)}
										onClick={() => { hapticTab(); setActiveTabIndex(index); }}
										className={`relative z-10 flex items-center gap-1.5 px-3.5 py-1.5 rounded-[7px] text-[13px] font-medium whitespace-nowrap cursor-pointer transition-colors duration-150 outline-none ${isActive ? "text-slate-950" : "text-slate-500 hover:text-slate-700"}`}
									>
										{Icon && (
											<Icon className={`text-[15px] shrink-0 ${isActive ? "text-black" : "text-slate-400"}`} />
										)}
										<span>{label}</span>
									</button>
								);
							})}
						</nav>
					)}
				</div>

				{/* Right: Avatar */}
				<div className="relative" ref={userMenuRef}>
					<button
						onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}
						className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-900 text-white font-semibold text-[13px] hover:bg-slate-800 transition-all duration-150 select-none cursor-pointer"
						style={{
							boxShadow: "0 2px 6px rgba(0,0,0,0.16), 0 4px 12px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)"
						}}
					>
						{userInitial}
					</button>

					{showUserMenu && (
						<div className="absolute right-0 mt-3 bg-white rounded-lg z-50 overflow-hidden min-w-max"
							style={{ boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)" }}
						>
							<div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
								<p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Signed in as</p>
								<p className="text-[13px] font-semibold text-slate-900 wrap-break-words max-w-xs" title={userEmail}>
									{userEmail}
								</p>
							</div>
							<button
								onClick={() => { setShowUserMenu(false); logout(); }}
								className="w-full flex items-center gap-3 px-5 py-3.5 text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors duration-150 active:bg-red-100 cursor-pointer"
							>
								<TbLogout className="text-[15px] shrink-0" />
								<span>Logout</span>
							</button>
						</div>
					)}
				</div>
			</header>

			{/* Company floating sidebar */}
			{isCompany && (
				<>
					{/* Backdrop */}
					<div
						className="fixed inset-0 z-40 backdrop-blur-sm"
						style={{
							opacity: sidebarOpen ? 1 : 0,
							pointerEvents: sidebarOpen ? "auto" : "none",
							background:
								"linear-gradient(to bottom, rgba(220,220,225,0.5), rgba(180,180,190,0.6), rgba(140,140,150,0.8))",
							transition: "opacity 0.28s cubic-bezier(0.4,0,0.2,1)",
							filter: "url(#modal-grain)",
						}}
						onClick={() => setSidebarOpen(false)}
					/>

					{/* Sidebar panel */}
					<aside
						ref={sidebarRef}
						className="fixed top-0 left-0 h-full z-50 flex items-stretch pointer-events-none"
						style={{ width: "260px" }}
					>
						<div
							className="flex flex-col rounded-2xl m-3 flex-1 pointer-events-auto overflow-hidden"
							style={{
								background: "linear-gradient(160deg, #ffffff 0%, #f5f7f4 100%)",
								border: "1px solid rgba(200, 200, 200, 0.25)",
								borderTop: "4px solid #84cc16",
								transform: sidebarOpen ? "translateX(0)" : "translateX(calc(-100% - 24px))",
								transition: "transform 0.32s cubic-bezier(0.4,0,0.2,1)",
								boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
							}}
						>
							{/* Sidebar header */}
							<div
								className="flex items-center justify-between h-16 px-5 shrink-0 bg-white"
								style={{
									backgroundImage: 'radial-gradient(circle, rgba(180, 190, 175, 0.4) 2.5px, transparent 2.5px)',
									backgroundSize: '12px 2px',
									backgroundPosition: '0 100%',
									backgroundRepeat: 'repeat-x',
									borderBottom: 'none',
									paddingTop: '0.5rem',
									paddingBottom: '0.5rem',
								}}
							>
								<span
									className="text-[32px] font-normal select-none leading-none text-slate-900"
									style={{ fontFamily: "'Satisfy', cursive" }}
								>
									cally
								</span>
								<button
									onClick={() => {
										setSidebarOpen(false);
										hapticTab();
									}}
									className="flex items-center justify-center w-7 h-7 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-150 outline-none cursor-pointer"
								>
									<TbX className="text-[18px]" />
								</button>
							</div>

							{/* Nav items */}
							<nav
								className="flex-1 overflow-y-auto py-3 px-3 bg-white"
							>
								{routes?.map((route, index) => {
									const { label, icon: Icon } = route;
									const isActive = activeTabIndex === index;
									return (
										<button
											key={index}
											onClick={() => {
												hapticTab();
												setActiveTabIndex(index);
												setSidebarOpen(false);
											}}
											style={isActive ? {
												display: 'flex',
												alignItems: 'center',
												gap: '12px',
												padding: '10px 12px',
												borderRadius: '7px',
												marginBottom: '4px',
												cursor: 'pointer',
												fontSize: '13.5px',
												fontWeight: '600',
												color: '#1a3a00',
												border: 'none',
												width: '100%',
												background: 'linear-gradient(to bottom, #bef264 0%, #a3e635 45%, #84cc16 100%)',
												backgroundImage: 'linear-gradient(to bottom, #bef264 0%, #a3e635 45%, #84cc16 100%)',
												boxShadow:
													"0 1px 0 0 rgba(255,255,255,0.55) inset, " +
													"0 -1px 0 0 rgba(0,0,0,0.18) inset, " +
													"1px 0 0 0 rgba(255,255,255,0.12) inset, " +
													"-1px 0 0 0 rgba(255,255,255,0.08) inset, " +
													"0 2px 6px 0 rgba(132,204,22,0.55), " +
													"0 6px 16px 0 rgba(132,204,22,0.30), " +
													"0 12px 28px 0 rgba(132,204,22,0.15), " +
													"0 1px 2px 0 rgba(0,0,0,0.22)",
												transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
												outline: 'none'
											} : {
												display: 'flex',
												alignItems: 'center',
												gap: '12px',
												padding: '10px 12px',
												borderRadius: '7px',
												marginBottom: '4px',
												cursor: 'pointer',
												fontSize: '13.5px',
												fontWeight: '500',
												color: '#64748b',
												backgroundColor: 'transparent',
												border: 'none',
												width: '100%',
												transition: 'all 0.15s ease',
												outline: 'none',
											}}
											onMouseEnter={e => {
												if (!isActive) {
													e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)';
													e.currentTarget.style.color = '#334155';
												}
											}}
											onMouseLeave={e => {
												if (!isActive) {
													e.currentTarget.style.backgroundColor = 'transparent';
													e.currentTarget.style.color = '#64748b';
												}
											}}
										>
											{Icon && (
												<Icon
													className="shrink-0"
													style={{
														fontSize: '17px',
														color: isActive ? '#1a3a00' : '#94a3b8'
													}}
												/>
											)}
											<span>{label}</span>
										</button>
									);
								})}
							</nav>

							{/* Footer */}
							<div
								className="shrink-0 px-3 pb-4 pt-2 bg-white"
								style={{
									paddingTop: '0.5rem'
								}}
							>
								{/* Logout removed - footer spacing retained */}
							</div>
						</div>
					</aside>
				</>
			)}

			{/* Main content */}
			<main className="flex-1 overflow-auto px-6 py-3 bg-white">
				<div className="max-w-10xl mx-auto">
					{ActiveComponent ? <ActiveComponent /> : children}
				</div>
			</main>
		</div>
	);
};

export default MainLayout;
