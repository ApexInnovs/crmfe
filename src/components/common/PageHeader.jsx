import React from "react";

/**
 * Reusable PageHeader component for page-level titles and actions.
 *
 * Props:
 *   title       – string, the page heading
 *   subtitle    – optional string, description text below the title
 *   actions     – optional JSX, rendered on the right side (buttons, etc.)
 *   searchValue – optional string, controlled search input value
 *   onSearch    – optional callback (value) => void, enables the search bar
 *   searchPlaceholder – optional string (default "Search...")
 *   children    – optional JSX, extra content rendered below the header row
 */
const PageHeader = ({
	title,
	subtitle,
	actions,
	searchValue,
	onSearch,
	searchPlaceholder = "Search...",
	children,
}) => {
	return (
		<div className="mb-4 space-y-3 bg-gray-100 p-4 rounded-lg shadow-sm">
			{/* Top row: title + actions */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold text-gray-800 tracking-tight">{title}</h1>
					{subtitle && (
						<p className="text-sm text-gray-600 mt-1">{subtitle}</p>
					)}
				</div>
				{actions && (
					<div className="flex items-center gap-2 flex-wrap">
						{actions}
					</div>
				)}
			</div>

			{/* Search bar (only if onSearch provided) */}
			{onSearch && (
				<div className="relative max-w-sm">
					<svg
						className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.5"
					>
						<circle cx="11" cy="11" r="8" />
						<line x1="21" y1="21" x2="16.65" y2="16.65" />
					</svg>
					<input
						type="text"
						placeholder={searchPlaceholder}
						value={searchValue || ""}
						onChange={(e) => onSearch(e.target.value)}
						className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
					/>
				</div>
			)}

			{/* Extra content */}
			{children}
		</div>
	);
};

export default PageHeader;
