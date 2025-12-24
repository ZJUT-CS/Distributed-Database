import React from 'react';

export interface TableSkeletonProps {
    /** 行数 */
    rows?: number;
    /** 列数 */
    columns?: number;
    /** 是否显示表头骨架 */
    showHeader?: boolean;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({
    rows = 5,
    columns = 6,
    showHeader = true,
}) => {
    return (
        <div className="animate-pulse">
            {/* 表头骨架 */}
            {showHeader && (
                <div className="bg-gray-50/80 border-b border-gray-100 px-6 py-4 flex gap-4">
                    {Array.from({ length: columns }).map((_, i) => (
                        <div
                            key={`header-${i}`}
                            className="h-3 bg-gray-200 rounded flex-1"
                            style={{ maxWidth: i === 0 ? '120px' : i === columns - 1 ? '80px' : '150px' }}
                        />
                    ))}
                </div>
            )}

            {/* 行骨架 */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div
                    key={`row-${rowIndex}`}
                    className="px-6 py-4 border-b border-gray-50 flex items-center gap-4"
                >
                    {/* 头像/图标占位 */}
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0" />

                    {/* 内容列骨架 */}
                    {Array.from({ length: columns - 1 }).map((_, colIndex) => (
                        <div key={`col-${colIndex}`} className="flex-1 space-y-2">
                            <div
                                className="h-3 bg-gray-200 rounded"
                                style={{
                                    width: colIndex === 0 ? '80%' : colIndex === columns - 2 ? '50%' : '70%',
                                }}
                            />
                            {colIndex === 0 && (
                                <div className="h-2 bg-gray-100 rounded w-1/2" />
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default TableSkeleton;
