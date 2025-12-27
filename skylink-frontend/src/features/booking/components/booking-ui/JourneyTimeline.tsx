import React from 'react';
import { Plane, Clock } from 'lucide-react';
import FlightSegmentCard from './FlightSegmentCard';
import type { FlightSegment } from '@/features/flight/types';
import type { Flight } from '@/features/flight/types';

interface JourneyTimelineProps {
    /** 航班数据 - 支持单个 Flight 或多个 FlightSegment */
    flight?: Flight;
    /** 航段列表 (如果不提供 flight) */
    segments?: FlightSegment[];
    /** 中转城市 */
    transferCity?: string;
    /** 中转时长 (分钟) */
    transferDuration?: number;
    /** 紧凑模式 */
    compact?: boolean;
    /** 显示联程标识 */
    showInterlineBadge?: boolean;
    className?: string;
}

/**
 * 通用行程时间线组件
 * 同时支持单程和联程航班的展示
 */
const JourneyTimeline: React.FC<JourneyTimelineProps> = ({
    flight,
    segments: propsSegments,
    transferCity,
    transferDuration,
    compact = false,
    showInterlineBadge = true,
    className = '',
}) => {
    // 将 Flight 转换为 FlightSegment 数组
    const getSegments = (): FlightSegment[] => {
        // 优先使用 props 传入的 segments
        if (propsSegments && propsSegments.length > 0) {
            return propsSegments;
        }

        // 如果 flight 本身有 segments (联程)
        if (flight?.segments && flight.segments.length > 0) {
            return flight.segments;
        }

        // 单程航班 - 将 Flight 转换为单个 segment
        if (flight) {
            return [{
                flightNumber: flight.flightNumber,
                airline: flight.airline,
                airlineCode: flight.airlineCode,
                origin: flight.origin,
                destination: flight.destination,
                departureTime: flight.departureTime,
                arrivalTime: flight.arrivalTime,
                duration: flight.duration,
            }];
        }

        return [];
    };

    const segments = getSegments();
    const isInterline = segments.length > 1;
    const effectiveTransferCity = transferCity || flight?.transferCity;
    const effectiveTransferDuration = transferDuration ?? flight?.transferDuration;

    if (segments.length === 0) {
        return null;
    }

    return (
        <div className={`space-y-3 ${className}`}>
            {/* 联程航班标识 */}
            {isInterline && showInterlineBadge && (
                <div className="flex items-center gap-2 text-sm flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50 font-bold shadow-sm transition-colors">
                        <Plane className="w-4 h-4" />
                        联程航班 ({segments.length} 段航程)
                    </span>
                    {effectiveTransferCity && (
                        <span className="text-gray-600 dark:text-slate-400">
                            经 <span className="font-bold text-gray-900 dark:text-white">{effectiveTransferCity}</span> 中转
                        </span>
                    )}
                </div>
            )}

            {/* 航段列表 */}
            <div className="space-y-0">
                {segments.map((segment, index) => (
                    <div key={index}>
                        <FlightSegmentCard
                            flightNumber={segment.flightNumber}
                            airline={segment.airline}
                            airlineCode={segment.airlineCode}
                            origin={segment.origin}
                            destination={segment.destination}
                            departureTime={segment.departureTime}
                            arrivalTime={segment.arrivalTime}
                            duration={segment.duration}
                            segmentIndex={isInterline ? index + 1 : undefined}
                            compact={compact}
                        />

                        {/* 中转信息 (仅在联程且不是最后一段时显示) */}
                        {isInterline && index < segments.length - 1 && (
                            <div className="flex items-center justify-center py-2">
                                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 border border-orange-200 dark:border-orange-700/50 shadow-sm backdrop-blur-sm">
                                    <Clock className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                                    <span className="text-xs font-bold text-orange-700 dark:text-orange-200">
                                        中转停留 {effectiveTransferDuration != null
                                            ? `${Math.floor(effectiveTransferDuration / 60)}h ${effectiveTransferDuration % 60}m`
                                            : '待确认'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* 总览信息 (仅联程时显示) */}
            {isInterline && !compact && (
                <div className="rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 dark:from-slate-800/40 dark:to-slate-900/40 border border-gray-100 dark:border-slate-700 p-3 mt-2">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 dark:text-slate-400">全程</span>
                            <span className="font-bold text-gray-900 dark:text-white">
                                {segments[0]?.origin} → {segments[segments.length - 1]?.destination}
                            </span>
                        </div>
                        {effectiveTransferDuration != null && (
                            <span className="text-xs text-gray-500 dark:text-slate-500">
                                含中转 {Math.floor(effectiveTransferDuration / 60)}h {effectiveTransferDuration % 60}m
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default JourneyTimeline;
