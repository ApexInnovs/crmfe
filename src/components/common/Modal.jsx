import React from "react";
import { createPortal } from "react-dom";
import useFeedback from "../../hooks/useFeedback";

const XIcon = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
		<line x1="18" y1="6" x2="6" y2="18" />
		<line x1="6" y1="6" x2="18" y2="18" />
	</svg>
);

/**
 * Reusable Modal component rendered via portal.
 *
 * Props:
 *   isOpen    – boolean, controls visibility
 *   onClose   – callback when the modal is dismissed
 *   title     – string displayed in the header
 *   subtitle  – optional subtitle text below title
 *   icon      – optional icon JSX for header
 *   children  – modal body content
 *   size      – "sm" | "md" | "lg" | "xl"  (default "md")
 *   footer    – optional JSX rendered below the body (sticky footer area)
 *   footerLeft – optional JSX for left side of footer
 */
export const Modal = ({
	isOpen,
	onClose,
	title,
	subtitle,
	icon,
	children,
	size = "md",
	footer,
	footerLeft,
}) => {
	if (!isOpen) return null;

	const sizeClass =
		size === "sm"
			? "max-w-sm"
			: size === "lg"
				? "max-w-3xl"
				: size === "xl"
					? "max-w-5xl"
					: "max-w-lg";

	const modal = (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			aria-modal="true"
			role="dialog"
		>
			{/* Backdrop with blur and grain */}
			<div
				className="fixed inset-0 backdrop-blur-sm"
				onClick={onClose}
			>
				{/* Gradient base */}
				<div
					className="absolute inset-0"
					style={{
						background:
							"linear-gradient(to bottom, rgba(220,220,225,0.5), rgba(180,180,190,0.6), rgba(140,140,150,0.8))",
					}}
				/>

				{/* Grain overlay */}
				<div
					className="absolute inset-0 pointer-events-none"
					style={{
						filter: "url(#modal-grain)",
						opacity: 1,
						mixBlendMode: "multiply",
					}}
				/>
			</div>

			{/* Panel */}
			<div
				className={`relative bg-white rounded-2xl w-full ${sizeClass} mx-auto overflow-hidden flex flex-col max-h-[90vh]`}
				style={{
					border: '1px solid rgba(200, 200, 200, 0.25)',
					borderRadius: '20px',
					borderTop: '4px solid #84cc16',
					boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
				}}
			>
				{/* Header */}
				<div className="px-5 pt-4 pb-3 bg-white shrink-0" style={{
					backgroundImage: 'radial-gradient(circle, rgba(180, 190, 175, 0.4) 2.5px, transparent 2.5px)',
					backgroundSize: '12px 2px',
					backgroundPosition: '0 100%',
					backgroundRepeat: 'repeat-x',
					borderBottom: 'none',
					paddingBottom: 'calc(0.75rem + 4px)'
				}}>
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2 flex-1">
							{icon && (
								<div className="shrink-0">
									{icon}
								</div>
							)}
							<div className="flex-1 min-w-0">
								<h2 className="text-xl font-bold text-gray-900 leading-tight tracking-tight">
									{title}
								</h2>
								{subtitle && (
									<p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
										{subtitle}
									</p>
								)}
							</div>
						</div>
						<button
							onClick={onClose}
							aria-label="Close"
							className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all cursor-pointer rounded-full shrink-0"
							style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
						>
							<XIcon />
						</button>
					</div>
				</div>

				{/* Body */}
				<div className="px-5 py-3 overflow-y-auto flex-1" style={{
					backgroundImage: 'radial-gradient(circle, rgba(180, 190, 175, 0.4) 2.5px, transparent 2.5px)',
					backgroundSize: '12px 2px',
					backgroundPosition: '0 100%',
					backgroundRepeat: 'repeat-x',
					paddingBottom: 'calc(0.75rem + 4px)',
					scrollbarWidth: 'none',
					msOverflowStyle: 'none',
				}}>
					{children}
				</div>

				{/* Footer */}
				{(footer || footerLeft) && (
					<div className="px-5 py-2.5 bg-white shrink-0 flex items-center justify-between gap-3 border-t border-gray-100">
						<div>
							{footerLeft}
						</div>
						<div>
							{footer}
						</div>
					</div>
				)}
			</div>
		</div>
	);

	return createPortal(modal, document.body);
};

/**
 * Reusable ConfirmDialog component.
 *
 * Props:
 *   isOpen    – boolean
 *   onClose   – dismiss callback
 *   onConfirm – confirm callback
 *   title     – heading text
 *   message   – body text (string or JSX)
 *   confirmLabel – button label (default "Confirm")
 *   cancelLabel  – button label (default "Cancel")
 *   variant   – "danger" | "warning" | "default"  (default "default")
 */
export const ConfirmDialog = ({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	variant = "default",
}) => {
	const { fire } = useFeedback();

	if (!isOpen) return null;

	const colorMap = {
		danger: {
			bg: "from-red-100 to-red-50",
			text: "text-red-700",
			border: "border-red-200",
			btn: "linear-gradient(160deg, #fca5a5 0%, #ef4444 40%, #dc2626 100%)",
			btnText: "#7f1d1d",
			icon: "text-red-600"
		},
		warning: {
			bg: "from-orange-100 to-orange-50",
			text: "text-orange-700",
			border: "border-orange-200",
			btn: "linear-gradient(160deg, #fed7aa 0%, #fb923c 40%, #ea580c 100%)",
			btnText: "#7c2d12",
			icon: "text-orange-600"
		},
		default: {
			bg: "from-amber-100 to-amber-50",
			text: "text-amber-700",
			border: "border-amber-200",
			btn: "linear-gradient(160deg, #fcd34d 0%, #f59e0b 40%, #d97706 100%)",
			btnText: "#78350f",
			icon: "text-amber-600"
		},
	};
	const colors = colorMap[variant] || colorMap.default;

	const dialog = (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			role="dialog"
			aria-modal="true"
		>
			{/* Backdrop with blur and grain */}
			<div
				className="fixed inset-0 backdrop-blur-sm"
				onClick={onClose}
			>
				{/* Gradient base */}
				<div
					className="absolute inset-0"
					style={{
						background:
							"linear-gradient(to bottom, rgba(220,220,225,0.5), rgba(180,180,190,0.6), rgba(140,140,150,0.8))",
					}}
				/>

				{/* Grain overlay */}
				<div
					className="absolute inset-0 pointer-events-none"
					style={{
						filter: "url(#modal-grain)",
						opacity: 1,
						mixBlendMode: "multiply",
					}}
				/>
			</div>

			{/* Panel */}
			<div
				className="relative bg-white rounded-2xl w-full max-w-sm mx-auto overflow-hidden"
				style={{
					border: '1px solid rgba(200, 200, 200, 0.25)',
					boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
					animation: 'slideIn 0.3s ease-out',
				}}
			>
				<style>{`
					@keyframes slideIn {
						from { 
							transform: translateY(-20px) scale(0.95);
							opacity: 0;
						}
						to { 
							transform: translateY(0) scale(1);
							opacity: 1;
						}
					}
				`}</style>

				{/* Header with Icon */}
				<div
					className={`bg-linear-to-br ${colors.bg} px-6 py-6 text-center relative`}
					style={{
						borderBottom: `3px dotted rgba(180, 190, 175, 0.4)`,
					}}
				>
					<div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-lg mb-4`}
						style={{
							background: colors.btn,
							boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
						}}
					>
						{variant === 'danger' ? (
							<svg className="w-7 h-7 text-white" fill="currentColor" version="1.1" viewBox="0 0 41.336 41.336" xmlns="http://www.w3.org/2000/svg">
								<path d="M36.335,5.668h-8.167V1.5c0-0.828-0.672-1.5-1.5-1.5h-12c-0.828,0-1.5,0.672-1.5,1.5v4.168H5.001c-1.104,0-2,0.896-2,2 s0.896,2,2,2h2.001v29.168c0,1.381,1.119,2.5,2.5,2.5h22.332c1.381,0,2.5-1.119,2.5-2.5V9.668h2.001c1.104,0,2-0.896,2-2 S37.438,5.668,36.335,5.668z M14.168,35.67c0,0.828-0.672,1.5-1.5,1.5s-1.5-0.672-1.5-1.5v-21c0-0.828,0.672-1.5,1.5-1.5 s1.5,0.672,1.5,1.5V35.67z M22.168,35.67c0,0.828-0.672,1.5-1.5,1.5s-1.5-0.672-1.5-1.5v-21c0-0.828,0.672-1.5,1.5-1.5 s1.5,0.672,1.5,1.5V35.67z M25.168,5.668h-9V3h9V5.668z M30.168,35.67c0,0.828-0.672,1.5-1.5,1.5s-1.5-0.672-1.5-1.5v-21 c0-0.828,0.672-1.5,1.5-1.5s1.5,0.672,1.5,1.5V35.67z" />
							</svg>
						) : variant === 'warning' ? (
							<svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						) : (
							<svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						)}
					</div>

					<h3 className="text-lg font-bold text-gray-900 mb-2 tracking-tight">{title}</h3>
					<p className="text-sm text-gray-600 leading-relaxed">{message}</p>
				</div>

				<div
					className="px-6 py-4 flex justify-end gap-3"
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'flex-end',
						gap: '12px',
					}}
				>
					<button
						type="button"
						className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer"
						onClick={() => {
							fire();
							onClose();
						}}
						style={{
							boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
						}}
						onMouseEnter={e => {
							e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)';
						}}
						onMouseLeave={e => {
							e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
						}}
					>
						{cancelLabel}
					</button>
					<button
						type="button"
						className="px-4 py-2 text-sm font-bold text-white rounded-lg transition-all cursor-pointer"
						style={{
							background: colors.btn,
							color: colors.btnText,
							boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
						}}
						onClick={() => {
							fire();
							onConfirm();
						}}
						onMouseEnter={e => {
							e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
							e.currentTarget.style.transform = 'translateY(-2px)';
						}}
						onMouseLeave={e => {
							e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
							e.currentTarget.style.transform = 'translateY(0)';
						}}
					>
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);

	return createPortal(dialog, document.body);
};

export default Modal;
