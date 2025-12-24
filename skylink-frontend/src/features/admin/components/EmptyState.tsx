import React from 'react';
import { Inbox, Plus } from 'lucide-react';

export interface EmptyStateProps {
    /** 自定义图标组件 */
    icon?: React.ElementType;
    /** 标题文字 */
    title?: string;
    /** 描述文字 */
    description?: string;
    /** 操作按钮文字 */
    actionText?: string;
    /** 操作按钮点击回调 */
    onAction?: () => void;
    /** 自定义类名 */
    className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon = Inbox,
    title = '暂无数据',
    description = '当前列表为空',
    actionText,
    onAction,
    className = '',
}) => {
    return (
        <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
            {/* 图标区域 */}
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-2xl scale-150" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/50 flex items-center justify-center shadow-sm">
                    <Icon className="w-10 h-10 text-slate-400" />
                </div>
            </div>

            {/* 文字区域 */}
            <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
            <p className="text-sm text-gray-500 text-center max-w-xs mb-6">{description}</p>

            {/* 操作按钮 */}
            {actionText && onAction && (
                <button
                    onClick={onAction}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300"
                >
                    <Plus className="w-4 h-4" />
                    {actionText}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
