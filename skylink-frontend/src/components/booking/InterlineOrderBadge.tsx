import React from 'react';
import { Route } from 'lucide-react';

interface InterlineOrderBadgeProps {
    /** 联程订单组内的序号（如 1, 2） */
    segmentIndex?: number;
    /** 联程订单组总数（如 2） */
    totalSegments?: number;
    /** 是否为父订单 */
    isParent?: boolean;
    className?: string;
}

/**
 * 联程订单标识组件
 * 用于在订单列表中标识联程订单及其关联关系
 */
const InterlineOrderBadge: React.FC<InterlineOrderBadgeProps> = ({
    segmentIndex,
    totalSegments,
    isParent = false,
    className = '',
}) => {
    // 如果没有联程信息，不显示徽章
    if (!segmentIndex && !totalSegments && !isParent) {
        return null;
    }

    return (
        <div className={`inline-flex items-center gap-1.5 ${className}`}>
            {isParent ? (
                // 父订单标识
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border border-purple-200">
                    <Route className="w-3.5 h-3.5" />
                    联程主订单
                </span>
            ) : segmentIndex && totalSegments ? (
                // 子订单标识（显示序号）
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200">
                    <Route className="w-3.5 h-3.5" />
                    联程 {segmentIndex}/{totalSegments}
                </span>
            ) : (
                // 通用联程标识
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    <Route className="w-3.5 h-3.5" />
                    联程
                </span>
            )}
        </div>
    );
};

export default InterlineOrderBadge;
