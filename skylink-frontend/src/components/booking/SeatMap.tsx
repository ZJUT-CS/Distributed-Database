import React from 'react';

export interface SeatData {
    seatId: string;
    seatNumber: string;
    rowNumber: number;
    columnLetter: string;
    /** 1=可用, 2=已售, 3=锁定中 */
    status: 1 | 2 | 3;
}

export interface SeatMapProps {
    seats: SeatData[];
    layout: { rows: number; cols: number };
    selectedSeatId?: string | null;
    currentSeatId?: string | null;
    onSelect?: (seat: SeatData) => void;
    disabled?: boolean;
}

const STATUS_STYLES: Record<number, { bg: string; border: string; text: string; cursor: string }> = {
    1: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', cursor: 'cursor-pointer hover:bg-emerald-100 hover:border-emerald-400' },
    2: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-400', cursor: 'cursor-not-allowed' }, // 已售：红色
    3: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', cursor: 'cursor-not-allowed' }, // 锁定：橙色
};

const SeatMap: React.FC<SeatMapProps> = ({
    seats,
    layout,
    selectedSeatId,
    currentSeatId,
    onSelect,
    disabled = false,
}) => {
    // 按行列组织座位
    const seatGrid: Record<string, SeatData> = {};
    const columnLetters = [...new Set(seats.map((s) => s.columnLetter))].sort();

    seats.forEach((seat) => {
        const key = `${seat.rowNumber}-${seat.columnLetter}`;
        seatGrid[key] = seat;
    });

    const handleClick = (seat: SeatData) => {
        if (disabled) return;
        if (seat.status !== 1) return; // 只能选可用座位
        onSelect?.(seat);
    };

    return (
        <div className="w-full overflow-x-auto">
            {/* 图例 */}
            <div className="flex items-center justify-center gap-6 mb-6 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 border-2 border-emerald-200" />
                    <span className="text-gray-600">可选</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-red-50 border-2 border-red-200" />
                    <span className="text-gray-600">不可选</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-yellow-400 border-2 border-yellow-500" />
                    <span className="text-gray-600">已选</span>
                </div>
                {currentSeatId && (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-600 border-2 border-emerald-600 ring-2 ring-emerald-300" />
                        <span className="text-gray-600">当前座位</span>
                    </div>
                )}
            </div>

            {/* 机头 */}
            <div className="flex justify-center mb-4">
                <div className="px-6 py-2 bg-gradient-to-b from-gray-100 to-gray-200 rounded-t-full text-xs text-gray-500 font-medium">
                    ✈ 机头
                </div>
            </div>

            {/* 座位网格 */}
            <div className="flex flex-col items-center gap-1">
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
                {Array.from({ length: layout.rows }, (_, rowIdx) => {
                    const rowNum = rowIdx + 1;
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

                                return (
                                    <React.Fragment key={key}>
                                        <button
                                            type="button"
                                            onClick={() => handleClick(seat)}
                                            disabled={disabled || seat.status !== 1}
                                            className={`
                        w-10 h-10 rounded-lg border-2 text-xs font-bold transition-all duration-150
                        flex items-center justify-center
                        ${isSelected
                                                    ? 'bg-yellow-400 border-yellow-500 text-white shadow-lg shadow-yellow-500/30'
                                                    : isCurrent
                                                        ? 'bg-emerald-600 border-emerald-600 text-white ring-2 ring-emerald-300'
                                                        : `${style.bg} ${style.border} ${style.text}`
                                                }
                        ${!disabled && seat.status === 1 && !isSelected ? style.cursor : ''}
                        ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
                      `}
                                            title={`${seat.seatNumber} - ${seat.status === 1 ? '可选' : '不可选'}`}
                                        >
                                            {seat.columnLetter}
                                        </button>
                                        {aisleAfter && <div className="w-6 h-10 flex items-center justify-center text-gray-300 text-xs">|</div>}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    );
                })}
            </div>


            {/* 机尾 */}
            <div className="flex justify-center mt-4">
                <div className="px-6 py-2 bg-gradient-to-t from-gray-100 to-gray-200 rounded-b-full text-xs text-gray-500 font-medium">
                    机尾
                </div>
            </div>
        </div>
    );
};

export default SeatMap;
