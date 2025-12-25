import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/features/auth';
import SeatMap, { type SeatData } from '@/components/booking/SeatMap';
import { getFlightSeats, changeSeat } from '@/features/booking/api/seat';
import { request } from '@/lib/axios';
import type { OrderSearchResult } from '@/features/booking/api/order';
import { logger } from '@/lib/logger';

const SeatSelectionPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    // 语义纠正：这里需要的是可操作的订单 ID（后端路径参数）
    // 为兼容旧链接，仍支持从 orderNo 读取。
    const orderId = searchParams.get('orderId') || searchParams.get('orderNo') || '';
    const flightId = searchParams.get('flightId') || '';
    const [cabinType, setCabinType] = useState<string>(searchParams.get('cabinType') || '');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [seats, setSeats] = useState<SeatData[]>([]);
    const [layout, setLayout] = useState({ rows: 0, cols: 0 });
    const [currentSeatId, setCurrentSeatId] = useState<string | null>(null);
    const [selectedSeat, setSelectedSeat] = useState<SeatData | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (!orderId || !flightId) {
            setError('缺少订单号或航班信息');
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const seatRes = await getFlightSeats(flightId, cabinType || undefined);
                const seatData: SeatData[] = seatRes.seats.map((s) => ({
                    seatId: s.seatId,
                    seatNumber: s.seatNumber,
                    rowNumber: s.rowNumber,
                    columnLetter: s.columnLetter,
                    status: s.status,
                }));
                setSeats(seatData);
                setLayout(seatRes.layout);

                // 获取当前订单座位信息：直查订单详情，避免 searchOrders 取第一个的不确定性
                const order = await request<OrderSearchResult>({
                    method: 'GET',
                    url: `/api/v1/orders/${encodeURIComponent(orderId)}`,
                });
                if (order?.seatId) {
                    setCurrentSeatId(String(order.seatId));
                }
                if (order?.cabinType && order.cabinType !== cabinType) {
                    setCabinType(order.cabinType);
                    const seatRes2 = await getFlightSeats(flightId, order.cabinType);
                    const seatData2: SeatData[] = seatRes2.seats.map((s) => ({
                        seatId: s.seatId,
                        seatNumber: s.seatNumber,
                        rowNumber: s.rowNumber,
                        columnLetter: s.columnLetter,
                        status: s.status,
                    }));
                    setSeats(seatData2);
                    setLayout(seatRes2.layout);
                }
            } catch (e: any) {
                setError(e?.message || '加载座位信息失败');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, navigate, orderId, flightId, cabinType]);

    const handleSelect = (seat: SeatData) => {
        if (seat.seatId === currentSeatId) {
            setSelectedSeat(null);
            return;
        }
        setSelectedSeat(seat);
        setSuccessMsg(null);
    };

    const handleConfirm = async () => {
        if (!selectedSeat) return;
        setSubmitting(true);
        setError(null);
        setSuccessMsg(null);

        // 定义刷新逻辑
        const refreshSeats = async () => {
            try {
                const seatRes = await getFlightSeats(flightId, cabinType || undefined);
                const seatData: SeatData[] = seatRes.seats.map((s) => ({
                    seatId: s.seatId,
                    seatNumber: s.seatNumber,
                    rowNumber: s.rowNumber,
                    columnLetter: s.columnLetter,
                    status: s.status,
                }));
                setSeats(seatData);
            } catch (err) {
                logger.error('刷新座位失败', err);
            }
        };

        try {
            // 直接传递字符串 ID，避免 Number 转换导致精度丢失
            await changeSeat(orderId, selectedSeat.seatId);
            setSuccessMsg(`座位已更换为 ${selectedSeat.seatNumber}`);
            setCurrentSeatId(selectedSeat.seatId);
            setSelectedSeat(null);
            await refreshSeats();
        } catch (e: any) {
            setError(e?.message || '换座失败，请重试');
            await refreshSeats(); // 失败后刷新，解决并发冲突导致的视图过时
        } finally {
            setSubmitting(false);
        }
    };

    if (!user) return null;

    return (
        <div className="animate-fade-in-up mt-8 w-full max-w-screen-xl mx-auto mb-20 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-sm text-gray-600 transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">在线选座</h2>
                    <p className="text-gray-500 text-sm mt-1">订单号：{orderId}</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8">
                    {/* Messages */}
                    {error && (
                        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
                            <Check className="w-5 h-5 shrink-0" />
                            {successMsg}
                        </div>
                    )}

                    {/* Loading */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                            <p className="mt-4 text-gray-500 text-sm">加载座位图中...</p>
                        </div>
                    ) : seats.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            暂无可用座位信息
                        </div>
                    ) : (
                        <>
                            {/* Seat Map */}
                            <SeatMap
                                seats={seats}
                                layout={layout}
                                selectedSeatId={selectedSeat?.seatId}
                                currentSeatId={currentSeatId}
                                onSelect={handleSelect}
                                disabled={submitting}
                            />

                            {/* Selection Info */}
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div>
                                        {currentSeatId && (
                                            <p className="text-sm text-gray-600">
                                                当前座位：<span className="font-bold text-purple-700">{seats.find(s => s.seatId === currentSeatId)?.seatNumber || '-'}</span>
                                            </p>
                                        )}
                                        {selectedSeat && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                已选座位：<span className="font-bold text-yellow-600">{selectedSeat.seatNumber}</span>
                                            </p>
                                        )}
                                        {!currentSeatId && !selectedSeat && (
                                            <p className="text-sm text-gray-500">点击绿色座位进行选择</p>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleConfirm}
                                        disabled={!selectedSeat || submitting}
                                        className={`
                      inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold transition-all
                      ${!selectedSeat || submitting
                                                ? 'bg-gray-300 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/20'
                                            }
                    `}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                确认中...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4" />
                                                确认选座
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SeatSelectionPage;
