import React from "react";
import { createPortal } from "react-dom";

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
 *   children  – modal body content
 *   size      – "sm" | "md" | "lg" | "xl"  (default "md")
 *   footer    – optional JSX rendered below the body (sticky footer area)
 */
export const Modal = ({
	isOpen,
	onClose,
	title,
	children,
	size = "md",
	footer,
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
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
				onClick={onClose}
			/>

			{/* Panel */}
			<div
				className={`relative bg-white rounded-xl w-full ${sizeClass} mx-auto border border-gray-200/60 overflow-hidden flex flex-col max-h-[90vh]
					shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25),0_4px_20px_-8px_rgba(0,0,0,0.15)]`}
			>
				{/* Header */}
				<div className="px-5 py-3 border-b border-purple-200 bg-purple-100 rounded-t-xl shrink-0">
					<div className="flex items-center justify-between">
						<h2 className="text-sm font-semibold text-gray-900">
							{title}
						</h2>
						<button
							onClick={onClose}
							aria-label="Close"
							className="p-1 rounded-md text-gray-600 hover:text-black hover:bg-purple-200 transition cursor-pointer"
						>
							<XIcon />
						</button>
					</div>
				</div>

				{/* Body */}
				<div className="px-5 py-4 overflow-y-auto flex-1">
					{children}
				</div>

				{/* Footer */}
				{footer && (
					<div className="px-5 py-3 border-t border-gray-100 bg-gray-50 shrink-0">
						{footer}
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
	if (!isOpen) return null;

	const colorMap = {
		danger: { bg: "bg-red-100", text: "text-red-600", btn: "bg-red-600 hover:bg-red-700" },
		warning: { bg: "bg-orange-100", text: "text-orange-600", btn: "bg-orange-600 hover:bg-orange-700" },
		default: { bg: "bg-emerald-100", text: "text-emerald-600", btn: "bg-emerald-600 hover:bg-emerald-700" },
	};
	const colors = colorMap[variant] || colorMap.default;

	const dialog = (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			role="dialog"
			aria-modal="true"
		>
			<div
				className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
				onClick={onClose}
			/>

			<div className="relative bg-white rounded-xl w-full max-w-sm mx-auto border border-gray-200/60 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25),0_4px_20px_-8px_rgba(0,0,0,0.15)]">
				<div className="px-6 py-6 text-center">
					<div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${colors.bg} mb-4`}>
						<svg className={`h-7 w-7 ${colors.text}`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
						</svg>
					</div>
					<h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
					<p className="text-sm text-gray-500 mb-6">{message}</p>
					<div className="flex justify-center gap-3">
						<button
							type="button"
							className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
							onClick={onClose}
						>
							{cancelLabel}
						</button>
						<button
							type="button"
							className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm cursor-pointer ${colors.btn}`}
							onClick={onConfirm}
						>
							{confirmLabel}
						</button>
					</div>
				</div>
			</div>
		</div>
	);

	return createPortal(dialog, document.body);
};

export default Modal;
