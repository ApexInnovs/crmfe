/**
 * Reusable Skeleton Loading Component
 * 
 * Usage:
 * <SkeletonLoader rows={10} columns={5} columnWidths={['40px', '1fr', '2fr', '150px', '120px']} />
 * 
 * Or with defaults:
 * <SkeletonLoader /> // 10 rows, 5 columns
 */

export const SkeletonLoader = ({
    rows = 10,
    columns = 5,
    columnWidths = ['40px', '1fr', '2fr', '150px', '120px'],
    isMultiLine = [false, false, true, false, false], // Which columns have multi-line content
}) => {
    return (
        <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid rgba(200,210,195,0.4)',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
            <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(90deg, #f0f0f0 0%, #e8f5e9 20%, #f0f0f0 40%, #ffffff 60%, #f0f0f0 100%);
          background-size: 1000px 100%;
          animation: shimmer 2.5s infinite;
        }
      `}</style>

            {Array.from({ length: rows }).map((_, rowIdx) => (
                <div key={rowIdx} style={{
                    display: 'grid',
                    gridTemplateColumns: columnWidths.join(' '),
                    gap: '16px',
                    padding: '10px 20px',
                    borderBottom: rowIdx < rows - 1 ? '1px solid rgba(200,210,195,0.2)' : 'none',
                    alignItems: 'center',
                }}>
                    {Array.from({ length: columns }).map((_, colIdx) => {
                        const hasMultiLine = isMultiLine[colIdx];
                        const widths = ['100%', '85%', '75%'];

                        if (hasMultiLine) {
                            return (
                                <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div className="skeleton-shimmer" style={{
                                        height: '14px',
                                        borderRadius: '4px',
                                        width: widths[0],
                                    }} />
                                    <div className="skeleton-shimmer" style={{
                                        height: '12px',
                                        borderRadius: '4px',
                                        width: widths[2],
                                    }} />
                                </div>
                            );
                        }

                        // Determine height based on column type
                        let height = '16px';
                        if (colIdx === 3) height = '20px'; // Status column (larger)
                        if (colIdx === 4) return ( // Actions column - icons
                            <div key={colIdx} style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="skeleton-shimmer" style={{
                                        height: '20px',
                                        width: '20px',
                                        borderRadius: '6px',
                                    }} />
                                ))}
                            </div>
                        );

                        return (
                            <div key={colIdx} className="skeleton-shimmer" style={{
                                height,
                                borderRadius: colIdx === 3 ? '8px' : '6px',
                                width: widths[colIdx % widths.length],
                            }} />
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

/**
 * Preset configurations for common table types
 */
export const SkeletonPresets = {
    // Standard admin table: # | Name | Description | Status | Actions
    admin: ({ rows = 10 } = {}) => (
        <SkeletonLoader
            rows={rows}
            columns={5}
            columnWidths={['40px', '1fr', '2fr', '150px', '120px']}
            isMultiLine={[false, false, true, false, false]}
        />
    ),

    // Compact table: Name | Meta | Status | Actions
    compact: ({ rows = 10 } = {}) => (
        <SkeletonLoader
            rows={rows}
            columns={4}
            columnWidths={['1fr', '1.5fr', '120px', '100px']}
            isMultiLine={[false, true, false, false]}
        />
    ),

    // Wide table: # | Title | Description | Date | Status | Budget | Actions
    wide: ({ rows = 10 } = {}) => (
        <SkeletonLoader
            rows={rows}
            columns={7}
            columnWidths={['40px', '1.2fr', '2fr', '120px', '100px', '100px', '120px']}
            isMultiLine={[false, false, true, false, false, false, false]}
        />
    ),

    // Data table: Name | Email | Phone | Company | Status | Actions
    dataTable: ({ rows = 10 } = {}) => (
        <SkeletonLoader
            rows={rows}
            columns={6}
            columnWidths={['1fr', '1.5fr', '130px', '150px', '130px', '120px']}
            isMultiLine={[false, false, false, false, false, false]}
        />
    ),
};

export default SkeletonLoader;
