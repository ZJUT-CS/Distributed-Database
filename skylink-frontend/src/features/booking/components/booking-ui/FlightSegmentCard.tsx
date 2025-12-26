import React from 'react';
import { Plane, MapPin } from 'lucide-react';

interface FlightSegmentCardProps {
    /** 航班号 */
    flightNumber: string;
    /** 航司名称 */
    airline?: string;
    /** 航司代码 */
    airlineCode?: string;
    /** 出发地 */
    origin: string;
    /** 目的地 */
    destination: string;
    /** 出发时间 (ISO string) */
    departureTime: string;
    /** 到达时间 (ISO string) */
    arrivalTime: string;
    /** 飞行时长 */
    duration?: string;
    /** 段序号 (联程时显示) */
    segmentIndex?: number;
    /** 紧凑模式 (用于侧边栏等) */
    compact?: boolean;
    className?: string;
}

/**
 * 通用航班段卡片组件
 * 适用于单程和联程航班的展示
 */
const FlightSegmentCard: React.FC<FlightSegmentCardProps> = ({
    flightNumber,
    airline,
    airlineCode,
    origin,
    destination,
    departureTime,
    arrivalTime,
    duration,
    segmentIndex,
    compact = false,
    className = '',
}) => {
    const formatTime = (isoString: string) => {
        try {
            return new Date(isoString).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '--:--';
        }
    };

    const formatDate = (isoString: string) => {
        try {
            return new Date(isoString).toLocaleDateString('zh-CN', {
                month: 'numeric',
                day: 'numeric',
            }).replace('/', '月') + '日';
        } catch {
            return '';
        }
    };

    const displayAirline = airline || airlineCode || '未知航司';

    if (compact) {
        // 紧凑模式 - 适用于侧边栏、确认页等
        return (
            <div className={`rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 ${className}`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        {segmentIndex != null && (
                            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold">
                                {segmentIndex}
                            </span>
                        )}
                        <span className="font-mono text-xs font-medium text-gray-700 dark:text-gray-200">{flightNumber}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{displayAirline}</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="text-center">
                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatTime(departureTime)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{origin}</div>
                    </div>
                    <div className="flex-1 flex flex-col items-center px-2">
                        <div className="text-[10px] text-gray-400 dark:text-gray-500">{duration}</div>
                        <div className="w-full h-[1px] bg-gradient-to-r from-emerald-300 to-blue-300 relative my-1">
                            <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-blue-500 dark:text-blue-400 rotate-90" />
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatTime(arrivalTime)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{destination}</div>
                    </div>
                </div>
            </div>
        );
    }

    // 标准模式 - 完整信息展示
    return (
        <div className={`rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 hover:shadow-md transition-shadow ${className}`}>
            {/* 头部：航班号 + 航司 */}
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                    {segmentIndex != null && (
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
                            {segmentIndex}
                        </div>
                    )}
                    <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">航班号</div>
                        <div className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">{flightNumber}</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400">航司</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{displayAirline}</div>
                </div>
            </div>

            {/* 主体：出发 → 到达 */}
            <div className="flex items-center gap-4">
                {/* 出发 */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{origin}</span>
                    </div>
                    <div className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                        {formatTime(departureTime)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {formatDate(departureTime)}
                    </div>
                </div>

                {/* 飞行时长 */}
                <div className="flex flex-col items-center px-3">
                    <div className="text-xs text-gray-400 mb-1">{duration || '—'}</div>
                    <div className="w-20 h-[2px] bg-gradient-to-r from-emerald-300 to-blue-300 relative">
                        <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 dark:text-blue-400 rotate-90" />
                    </div>
                </div>

                {/* 到达 */}
                <div className="flex-1 text-right">
                    <div className="flex items-center gap-2 mb-1 justify-end">
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{destination}</span>
                        <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                        {formatTime(arrivalTime)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {formatDate(arrivalTime)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlightSegmentCard;
