import React from "react";

/**
 * InnerBox component for use inside modals.
 * Creates a bordered container with light background.
 *
 * Props:
 *   children  – content inside the box
 *   className – additional CSS classes
 */
export const InnerBox = ({ children, className = "" }) => {
    return (
        <div
            className={`rounded-lg border border-gray-200 bg-gray-50 p-5 ${className}`}
            style={{
                backgroundColor: 'rgba(248, 248, 248, 0.8)',
                border: '1px solid rgba(200, 200, 200, 0.4)',
            }}
        >
            {children}
        </div>
    );
};

export default InnerBox;
