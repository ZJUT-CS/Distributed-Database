import React, { useMemo, useState, useEffect } from 'react';

export interface SeatData {
    seatId: string;
    seatNumber: string;
    rowNumber: number;
    columnLetter: string;
    /** 1=可用, 2=已售, 3=锁定中 */
    status: 1 | 2 | 3;

    /** 可选：座位类型（后端若有可直接透传；没有则默认不展示类型区分） */
    seatType?: 'standard' | 'vip' | 'accessible' | 'exit_row' | 'extra_legroom';
}

export interface SeatMapProps {
    seats: SeatData[];
    layout: { rows: number; cols: number };
    selectedSeatId?: string | null;
    currentSeatId?: string | null;
    onSelect?: (seat: SeatData) => void;
    disabled?: boolean;
    effectiveCabinType?: string | null;
}

const SeatIcon: React.FC<{ className?: string; status?: 1 | 2 | 3; isSelected?: boolean }> = ({ className, status, isSelected }) => {
    const getGradientId = () => {
        if (isSelected) return 'seat-selected-gradient';
        if (status === 1) return 'seat-available-gradient';
        if (status === 3) return 'seat-locked-gradient';
        return 'seat-sold-gradient';
    };

    return (
        <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
            <defs>
                {/* 可用座位渐变 */}
                <linearGradient id="seat-available-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                {/* 已选座位渐变 */}
                <linearGradient id="seat-selected-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                {/* 锁定座位渐变 */}
                <linearGradient id="seat-locked-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fb923c" />
                    <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
                {/* 已售座位渐变 */}
                <linearGradient id="seat-sold-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#d1d5db" />
                    <stop offset="100%" stopColor="#9ca3af" />
                </linearGradient>
            </defs>
            {/* 座椅背部 */}
            <path 
                d="M 8 6 Q 8 4, 10 4 L 22 4 Q 24 4, 24 6 L 24 16 Q 24 18, 22 18 L 10 18 Q 8 18, 8 16 Z" 
                fill={`url(#${getGradientId()})`}
                opacity="0.9"
            />
            {/* 座椅底座 */}
            <path 
                d="M 6 18 L 26 18 Q 27 18, 27 19 L 27 24 Q 27 26, 25 26 L 7 26 Q 5 26, 5 24 L 5 19 Q 5 18, 6 18 Z" 
                fill={`url(#${getGradientId()})`}
            />
            {/* 扶手左 */}
            <rect x="5" y="16" width="2" height="8" rx="1" fill={`url(#${getGradientId()})`} opacity="0.7" />
            {/* 扶手右 */}
            <rect x="25" y="16" width="2" height="8" rx="1" fill={`url(#${getGradientId()})`} opacity="0.7" />
        </svg>
    );
};

const seatStatusText = (s: 1 | 2 | 3) => (s === 1 ? '可选' : s === 3 ? '锁定中' : '已售/不可选');

const cabinLabel = (c?: string | null) => {
    if (!c) return '商务舱';
    const v = String(c).toUpperCase();
    if (v === 'ECONOMY' || v === 'Y') return '经济舱';
    if (v === 'BUSINESS' || v === 'C' || v === 'J') return '商务舱';
    if (v === 'FIRST' || v === 'F') return '头等舱';
    return v;
};

const seatTypeBadge = (t?: SeatData['seatType']) => {
    if (!t || t === 'standard') return null;
    const map: Record<string, { label: string; cls: string }> = {
        vip: { label: 'VIP', cls: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
        accessible: { label: '无障碍', cls: 'bg-sky-50 text-sky-700 border-sky-100' },
        exit_row: { label: '出口', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
        extra_legroom: { label: '加长', cls: 'bg-violet-50 text-violet-700 border-violet-100' },
    };
    const v = map[t];
    if (!v) return null;
    return (
        <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${v.cls}`}>
            {v.label}
        </span>
    );
};

const STATUS_STYLES: Record<number, { bg: string; border: string; text: string; cursor: string }> = {
    1: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', cursor: 'cursor-pointer hover:bg-emerald-100 hover:border-emerald-400' },
    2: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-400', cursor: 'cursor-not-allowed' }, // 已售/不可用
    3: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', cursor: 'cursor-not-allowed' }, // 锁定
};

const SeatMap: React.FC<SeatMapProps> = ({
    seats,
    layout,
    selectedSeatId,
    currentSeatId,
    onSelect,
    disabled = false,
    effectiveCabinType,
}) => {
    const [hoveredSeat, setHoveredSeat] = useState<SeatData | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 快速显示内容
        const timer = setTimeout(() => setIsLoading(false), 100);
        return () => clearTimeout(timer);
    }, [seats.length]);

    const columnLetters = useMemo(() => {
        const cols = [...new Set(seats.map((s) => s.columnLetter))].filter(Boolean).sort();
        return cols;
    }, [seats]);

    // 只渲染实际存在的行号，避免经济舱从 31 行开始导致 1-30 行全是空白
    const rowNumbers = useMemo(() => {
        const rows = [...new Set(seats.map((s) => s.rowNumber))]
            .filter((x) => Number.isFinite(x) && x > 0)
            .sort((a, b) => a - b);
        // 若 seats 为空，回退到 layout.rows
        if (rows.length > 0) return rows;
        return Array.from({ length: layout.rows }, (_, i) => i + 1);
    }, [seats, layout.rows]);

    // 按行列组织座位
    const seatGrid = useMemo(() => {
        const grid: Record<string, SeatData> = {};
        seats.forEach((seat) => {
            const key = `${seat.rowNumber}-${seat.columnLetter}`;
            grid[key] = seat;
        });
        return grid;
    }, [seats]);

    const handleClick = (seat: SeatData) => {
        if (disabled) return;
        if (seat.status !== 1) return; // 只能选可用座位
        onSelect?.(seat);
    };

    if (isLoading) {
        return (
            <div className="w-full overflow-x-auto relative animate-pulse">
                <div className="flex flex-col items-center gap-3 py-8">
                    <div className="h-8 w-32 bg-gray-200 rounded-full"></div>
                    <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
                    <div className="grid grid-cols-6 gap-2 mt-4">
                        {Array.from({ length: 36 }).map((_, i) => (
                            <div key={i} className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto relative">
            {/* 飞机轮廓背景 */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                <svg viewBox="0 0 600 800" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                    <path d="M 150 50 Q 120 100, 120 400 Q 120 700, 150 750 L 450 750 Q 480 700, 480 400 Q 480 100, 450 50 Z" 
                          fill="#3b82f6" opacity={0.15} />
                    {Array.from({ length: 15 }).map((_, i) => (
                        <ellipse key={`left-${i}`} cx={100} cy={100 + i * 45} rx={12} ry={18} fill="#60a5fa" opacity={0.4} />
                    ))}
                    {Array.from({ length: 15 }).map((_, i) => (
                        <ellipse key={`right-${i}`} cx={500} cy={100 + i * 45} rx={12} ry={18} fill="#60a5fa" opacity={0.4} />
                    ))}
                </svg>
            </div>

            {/* 图例 */}
            <div className="flex items-center justify-center gap-5 mb-8 text-xs relative z-10">
                <div className="flex items-center gap-1.5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-300 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                        <SeatIcon className="w-6 h-6" status={1} />
                    </div>
                    <span className="text-gray-600 font-medium">可选</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                        <SeatIcon className="w-6 h-6" status={3} />
                    </div>
                    <span className="text-gray-600 font-medium">锁定中</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 flex items-center justify-center opacity-60 shadow-sm">
                        <SeatIcon className="w-6 h-6" status={2} />
                    </div>
                    <span className="text-gray-600 font-medium">已售</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
                        <SeatIcon className="w-6 h-6" isSelected={true} />
                    </div>
                    <span className="text-gray-600 font-medium">已选</span>
                </div>
            </div>

            {/* 机头 */}
            <div className="flex justify-center mb-4">
                <div className="px-6 py-2 bg-gradient-to-b from-gray-50 to-gray-100 rounded-t-full text-xs text-gray-500 font-medium border border-gray-200">
                    机头
                </div>
            </div>

            {/* 舱位标识 */}
            <div className="flex justify-center mb-6 relative z-10">
                <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-blue-50 border-2 border-blue-200">
                    <span className="text-sm font-bold text-blue-600">{effectiveCabinType ? cabinLabel(effectiveCabinType) : '商务舱'}</span>
                </div>
            </div>

            {/* 座位布局 */}
            <div className="flex flex-col items-center gap-1 relative z-10">
                {/* 列标题 */}
                <div className="flex items-center gap-1 mb-2">
                    <div className="w-10 h-8" /> {/* 占位 */}
                    {columnLetters.map((col, idx) => (
                        <React.Fragment key={col}>
                            <div className="w-10 h-8 flex items-center justify-center text-xs font-bold text-gray-500">
                                {col}
                            </div>
                            {/* 过道 - 假设中间有过道 */}
                            {idx === Math.floor(columnLetters.length / 2) - 1 && (
                                <div className="w-6 h-8" />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* 每一行 */}
                    {rowNumbers.map((rowNum) => {
                    return (
                        <div key={rowNum} className="flex items-center gap-1">
                            {/* 行号 */}
                            <div className="w-10 h-10 flex items-center justify-center text-xs font-bold text-gray-500">
                                {rowNum}
                            </div>

                            {columnLetters.map((col, colIdx) => {
                                const key = `${rowNum}-${col}`;
                                const seat = seatGrid[key];

                                // 过道
                                const aisleAfter = colIdx === Math.floor(columnLetters.length / 2) - 1;

                                if (!seat) {
                                    return (
                                        <React.Fragment key={key}>
                                            <div className="w-10 h-10" />
                                            {aisleAfter && <div className="w-6 h-10" />}
                                        </React.Fragment>
                                    );
                                }

                                const isSelected = seat.seatId === selectedSeatId;
                                const isCurrent = seat.seatId === currentSeatId;
                                const style = STATUS_STYLES[seat.status] || STATUS_STYLES[2];

                                const title =
                                    `${seat.seatNumber}（${seatStatusText(seat.status)}）`;

                                return (
                                    <React.Fragment key={key}>
                                        <button
                                            type="button"
                                            onClick={() => handleClick(seat)}
                                            disabled={disabled || seat.status !== 1}
                                            className={`
                        w-14 h-14 rounded-2xl border-2 transition-all duration-300
                        flex items-center justify-center relative group
                        animate-seat-appear
                        ${isSelected
                                                    ? 'bg-gradient-to-br from-blue-400 to-blue-600 border-blue-600 shadow-xl shadow-blue-500/50 scale-105'
                                                    : isCurrent
                                                        ? 'bg-gradient-to-br from-purple-400 to-purple-600 border-purple-600 ring-2 ring-purple-300 shadow-xl'
                                                        : seat.status === 1
                                                            ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300 hover:shadow-xl hover:-translate-y-1'
                                                            : seat.status === 3
                                                                ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300 animate-pulse'
                                                                : 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300 opacity-60'
                                                }
                        ${!disabled && seat.status === 1 && !isSelected ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}
                        ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
                      `}
                                            aria-label={title}
                                            title={title}
                                            onMouseEnter={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
                                                setHoveredSeat(seat);
                                            }}
                                            onMouseLeave={() => setHoveredSeat(null)}
                                            style={{
                                                transformOrigin: 'center',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                animationDelay: `${(rowNumbers.indexOf(rowNum) * columnLetters.length + colIdx) * 10}ms`,
                                            }}
                                        >
                                            <SeatIcon 
                                                className="w-8 h-8" 
                                                status={seat.status}
                                                isSelected={isSelected}
                                            />
                                            <span className={`absolute bottom-1 right-1 text-[9px] font-bold ${isSelected || isCurrent ? 'text-white/90' : 'text-gray-600'}`}>
                                                {seat.columnLetter}
                                            </span>
                                        </button>
                                        {aisleAfter && <div className="w-6 h-10 flex items-center justify-center text-gray-300 text-xs">|</div>}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
            {/* 洗手间区域 */}
            <div className="mt-8 flex justify-center gap-12 relative z-10">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-10 h-10 text-blue-400" fill="currentColor">
                            <path d="M12 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm-1.5 7A1.5 1.5 0 0 0 9 10.5v8a.5.5 0 0 0 1 0V14h4v4.5a.5.5 0 0 0 1 0v-8A1.5 1.5 0 0 0 13.5 9h-3z"/>
                        </svg>
                    </div>
                    <span className="text-xs text-gray-400">洗手间</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-32 h-20 rounded-2xl bg-gray-50 border-2 border-gray-200 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-10 h-10 text-gray-400" fill="currentColor">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                            <path d="M7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>
                        </svg>
                    </div>
                    <span className="text-xs text-gray-400">餐饮服务</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-10 h-10 text-blue-400" fill="currentColor">
                            <path d="M12 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm-1.5 7A1.5 1.5 0 0 0 9 10.5v8a.5.5 0 0 0 1 0V14h4v4.5a.5.5 0 0 0 1 0v-8A1.5 1.5 0 0 0 13.5 9h-3z"/>
                        </svg>
                    </div>
                    <span className="text-xs text-gray-400">洗手间</span>
                </div>
            </div>
            {/* Tooltip */}
            {hoveredSeat && (
                <div
                    className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full"
                    style={{ left: tooltipPos.x, top: tooltipPos.y - 10 }}
                >
                    <div className="rounded-xl border border-slate-700 bg-slate-900/95 text-white shadow-2xl backdrop-blur px-3 py-2 text-xs">
                        <div className="flex items-center justify-between gap-3">
                            <div className="font-bold text-slate-100">{hoveredSeat.seatNumber}</div>
                            {seatTypeBadge(hoveredSeat.seatType)}
                        </div>
                        <div className="mt-1 text-slate-300">
                            行 {hoveredSeat.rowNumber} · 列 {hoveredSeat.columnLetter}
                        </div>
                        <div className="mt-1 text-slate-200">状态：{seatStatusText(hoveredSeat.status)}</div>
                    </div>
                </div>
            )}


            {/* 机尾 */}
            <div className="flex justify-center mt-4">
                <div className="px-6 py-2 bg-gradient-to-t from-gray-50 to-gray-100 rounded-b-full text-xs text-gray-500 font-medium border border-gray-200">
                    机尾
                </div>
            </div>
        </div>
    );
};

export default SeatMap;

// 添加全局样式用于座位淡入动画
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes seat-appear {
            from {
                opacity: 0;
                transform: translateY(10px) scale(0.8);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        .animate-seat-appear {
            animation: seat-appear 0.5s ease-out forwards;
            opacity: 0;
        }
    `;
    document.head.appendChild(style);
}
