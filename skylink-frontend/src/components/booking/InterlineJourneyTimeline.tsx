import React from 'react';
import { Plane, Clock, MapPin } from 'lucide-react';
import type { FlightSegment } from '@/features/flight/types';

interface InterlineJourneyTimelineProps {
    segments: FlightSegment[];
    transferCity?: string;
    transferDuration?: number;
    className?: string;
}

/**
 * 联程航班时间线组件
 * 用于展示多段航程的连接关系和中转信息
 */
const InterlineJourneyTimeline: React.FC<InterlineJourneyTimelineProps> = ({
    segments,
    transferCity,
    transferDuration,
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
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return '';
        }
    };

    if (!segments || segments.length === 0) {
        return null;
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* 联程标识 */}
            {segments.length > 1 && (
                <div className="flex items-center gap-2 text-sm">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                        <Plane className="w-4 h-4" />
                        联程航班 ({segments.length} 段航程)
                    </span>
                    {transferCity && (
                        <span className="text-gray-600">
                            经 <span className="font-bold text-gray-900">{transferCity}</span> 中转
                        </span>
                    )}
                </div>
            )}

            {/* 航程时间线 */}
            <div className="relative">
                {segments.map((segment, index) => (
                    <div key={index} className="relative">
                        {/* 航段卡片 */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">航班号</div>
                                        <div className="font-mono text-sm font-bold text-gray-900">
                                            {segment.flightNumber}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-500">航司</div>
                                    <div className="text-sm font-bold text-gray-900">{segment.airline || segment.airlineCode}</div>
                                </div>
                            </div>

                            {/* 航段详情 */}
                            <div className="flex items-center gap-4">
                                {/* 出发 */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <MapPin className="w-4 h-4 text-emerald-600" />
                                        <span className="text-lg font-bold text-gray-900">{segment.origin}</span>
                                    </div>
                                    <div className="text-2xl font-extrabold text-gray-900">
                                        {formatTime(segment.departureTime)}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {formatDate(segment.departureTime)}
                                    </div>
                                </div>

                                {/* 飞行时长 */}
                                <div className="flex flex-col items-center px-3">
                                    <div className="text-xs text-gray-400 mb-1">{segment.duration}</div>
                                    <div className="w-20 h-[2px] bg-gradient-to-r from-emerald-300 to-blue-300 relative">
                                        <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 rotate-90" />
                                    </div>
                                </div>

                                {/* 到达 */}
                                <div className="flex-1 text-right">
                                    <div className="flex items-center gap-2 mb-1 justify-end">
                                        <span className="text-lg font-bold text-gray-900">{segment.destination}</span>
                                        <MapPin className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="text-2xl font-extrabold text-gray-900">
                                        {formatTime(segment.arrivalTime)}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {formatDate(segment.arrivalTime)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 中转信息 */}
                        {index < segments.length - 1 && (
                            <div className="flex items-center justify-center py-3">
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 border border-orange-200">
                                    <Clock className="w-4 h-4 text-orange-600" />
                                    <span className="text-sm font-bold text-orange-700">
                                        中转停留 {transferDuration != null
                                            ? `${Math.floor(transferDuration / 60)}h ${transferDuration % 60}m`
                                            : '待确认'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* 总览信息 */}
            {segments.length > 1 && (
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">出发地：</span>
                            <span className="font-bold text-gray-900">{segments[0]?.origin}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-gray-600">目的地：</span>
                            <span className="font-bold text-gray-900">{segments[segments.length - 1]?.destination}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InterlineJourneyTimeline;
