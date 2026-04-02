import { useState, useRef, useEffect } from "react";
import useFeedback from "../hooks/useFeedback";
import { TbLogout } from "react-icons/tb";
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

	const [activeTabIndex, setActiveTabIndex] = useState(0);
	const [showUserMenu, setShowUserMenu] = useState(false);
	const [indicator, setIndicator] = useState({ left: 0, width: 0 });

	const userMenuRef = useRef(null);
	const tabRefs = useRef([]);

	const activeRoute = routes?.[activeTabIndex];
	const ActiveComponent = activeRoute?.component;

	const userEmail = user?.email || user?.companyEmail || user?.adminEmail || "User";
	const userInitial = userEmail?.charAt(0)?.toUpperCase() || "U";

	// Track sliding indicator position
	useEffect(() => {
		const el = tabRefs.current[activeTabIndex];
		if (el) {
			setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
		}
	}, [activeTabIndex, routes]);

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
				{/* Left: Branding + Tabs */}
				<div className="flex items-center gap-6">
					{/* Branding */}
					<span
						className="text-[38px] font-normal select-none leading-none text-slate-900"
						style={{ fontFamily: "'Satisfy', cursive" }}
					>
						cally
					</span>

					{/* Tabs with sliding animation */}
					<nav
						className="relative flex items-center rounded-[10px] p-1.25 gap-0"
					>
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
									className={`relative z-10 flex items-center gap-1.5 px-3.5 py-1.5 rounded-[7px] text-[13px] font-medium whitespace-nowrap cursor-pointer transition-colors duration-150 outline-none ${isActive ? "text-slate-950" : "text-slate-500 hover:text-slate-700"
										}`}
								>
									{Icon && (
										<Icon
											className={`text-[15px] shrink-0 ${isActive ? "text-black" : "text-slate-400"
												}`}
										/>
									)}
									<span>{label}</span>
								</button>
							);
						})}
					</nav>
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
							{/* Email Section */}
							<div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
								<p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Signed in as</p>
								<p className="text-[13px] font-semibold text-slate-900 wrap-break-words max-w-xs" title={userEmail}>
									{userEmail}
								</p>
							</div>

							{/* Logout Button */}
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
