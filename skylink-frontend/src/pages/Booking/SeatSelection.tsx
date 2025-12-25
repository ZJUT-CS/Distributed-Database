import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Loader2, AlertCircle, RefreshCw, Plane, Clock, Calendar, User, X } from 'lucide-react';
import { useAuth } from '@/features/auth';
import SeatMap, { type SeatData } from '@/components/booking/SeatMap';
import { getFlightSeats, changeSeat } from '@/features/booking/api/seat';
import { request } from '@/lib/axios';
import type { OrderSearchResult } from '@/features/booking/api/order';
import { logger } from '@/lib/logger';

const POLL_INTERVAL_MS = 2000;

const cabinLabel = (c?: string | null) => {
    if (!c) return '当前舱位';
    const v = String(c).toUpperCase();
    if (v === 'ECONOMY' || v === 'Y') return '经济舱';
    if (v === 'BUSINESS' || v === 'C' || v === 'J') return '商务舱';
    if (v === 'FIRST' || v === 'F') return '头等舱';
    return v;
};

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

    const [orderCabinType, setOrderCabinType] = useState<string>('');
    const effectiveCabinType = useMemo(
        () => (cabinType || orderCabinType || '').trim(),
        [cabinType, orderCabinType],
    );

    const lastRefreshAtRef = useRef<number>(0);

    const mapSeatResponse = (seatRes: any): { seats: SeatData[]; layout: { rows: number; cols: number } } => {
        const seatData: SeatData[] = (seatRes?.seats ?? []).map((s: any) => ({
            seatId: String(s.seatId),
            seatNumber: String(s.seatNumber),
            rowNumber: Number(s.rowNumber),
            columnLetter: String(s.columnLetter),
            status: s.status as 1 | 2 | 3,
        }));

        const layoutFromApi = seatRes?.layout;
        if (layoutFromApi?.rows && layoutFromApi?.cols) {
            return { seats: seatData, layout: { rows: Number(layoutFromApi.rows), cols: Number(layoutFromApi.cols) } };
        }

        const rows = seatData.reduce((m, s) => Math.max(m, s.rowNumber), 0);
        const cols = new Set(seatData.map((s) => s.columnLetter)).size;
        return { seats: seatData, layout: { rows, cols } };
    };

    const fetchSeatsForCabin = async (cabType: string) => {
        const seatRes = await getFlightSeats(flightId, cabType || undefined);
        const mapped = mapSeatResponse(seatRes);
        setSeats(mapped.seats);
        setLayout(mapped.layout);
        lastRefreshAtRef.current = Date.now();
    };

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

    // 仅刷新“当前舱位”座位：页面可见 + 非提交中
    useEffect(() => {
        if (!user) return;
        if (!flightId) return;
        if (!effectiveCabinType) return;

        const tick = async () => {
            if (document.visibilityState !== 'visible') return;
            if (submitting) return;
            try {
                await fetchSeatsForCabin(effectiveCabinType);
            } catch (err) {
                logger.warn('轮询刷新座位失败', err);
            }
        };

        const timer = window.setInterval(tick, POLL_INTERVAL_MS);
        const onVisibility = () => {
            if (document.visibilityState === 'visible') tick();
        };
        window.addEventListener('visibilitychange', onVisibility);

        return () => {
            window.clearInterval(timer);
            window.removeEventListener('visibilitychange', onVisibility);
        };
    }, [user, flightId, effectiveCabinType, submitting]);

    const handleSelect = (seat: SeatData) => {
        if (seat.seatId === currentSeatId) {
            setSelectedSeat(null);
            return;
        }
        setSelectedSeat(seat);
        setSuccessMsg(null);
    };

    const handleRemoveSelected = () => {
        setSelectedSeat(null);
        setSuccessMsg(null);
    };

    const requiredSeatCount = 1;
    const selectedCount = selectedSeat ? 1 : 0;
    const progressPct = Math.round((selectedCount / requiredSeatCount) * 100);

    const handleConfirm = async () => {
        if (!selectedSeat) return;
        setSubmitting(true);
        setError(null);
        setSuccessMsg(null);

        try {
            // 直接传递字符串 ID，避免 Number 转换导致精度丢失
            await changeSeat(orderId, selectedSeat.seatId);
            setSuccessMsg(`座位已更换为 ${selectedSeat.seatNumber}`);
            setCurrentSeatId(selectedSeat.seatId);
            setSelectedSeat(null);
            if (effectiveCabinType) await fetchSeatsForCabin(effectiveCabinType);
        } catch (e: any) {
            setError(e?.message || '换座失败，请重试');
            // 失败后刷新，解决并发冲突导致的视图过时（仅当前舱位）
            if (effectiveCabinType) await fetchSeatsForCabin(effectiveCabinType);
        } finally {
            setSubmitting(false);
        }
    };

    const handleManualRefresh = async () => {
        if (!effectiveCabinType) return;
        try {
            await fetchSeatsForCabin(effectiveCabinType);
        } catch (e: any) {
            setError(e?.message || '刷新失败');
        }
    };

    const lastRefreshText = useMemo(() => {
        const t = lastRefreshAtRef.current;
        if (!t) return '未刷新';
        const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
        return `${sec}s 前`;
    }, [loading, seats.length, submitting]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
            {/* �机背景动画 */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <Plane className="absolute text-blue-200/30 animate-plane-fly" style={{ width: '120px', height: '120px', top: '10%', left: '-120px', animation: 'plane-fly 20s ease-in-out infinite' }} />
            </div>
            <style>{`
                @keyframes plane-fly {
                    0% { transform: translate(0, 0) rotate(-10deg); }
                    50% { transform: translate(calc(100vw + 240px), -50px) rotate(-5deg); }
                    100% { transform: translate(0, 0) rotate(-10deg); }
                }
                @keyframes slide-down {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slide-down {
                    animation: slide-down 0.4s ease-out;
                }
            `}</style>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/90 backdrop-blur border border-gray-200 hover:bg-white hover:shadow-md text-gray-700 transition-all font-medium group hover:scale-105 active:scale-95"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>返回</span>
                </button>
                <button
                    type="button"
                    onClick={handleManualRefresh}
                    disabled={loading || submitting || !effectiveCabinType}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 font-medium transition-all hover:scale-105 active:scale-95
                        ${loading || submitting || !effectiveCabinType
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white/90 backdrop-blur text-gray-700 border-gray-200 hover:bg-white hover:shadow-md'
                        }
                    `}
                >
                    <RefreshCw className={`w-4 h-4 transition-transform ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                    刷新座位
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2 shadow-sm animate-slide-down">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                </div>
            )}
            {successMsg && (
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2 shadow-sm animate-slide-down">
                    <Check className="w-5 h-5 shrink-0" />
                    {successMsg}
                </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-5">

                {/* Left: Seat Map */}
                <div className="lg:col-span-3">
                    {loading ? (
                        <div className="rounded-3xl bg-white/90 backdrop-blur shadow-lg p-8 flex flex-col items-center justify-center" style={{ minHeight: '600px' }}>
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                            <p className="mt-4 text-gray-500 text-sm">加载座位图中...</p>
                        </div>
                    ) : seats.length === 0 ? (
                        <div className="rounded-3xl bg-white/90 backdrop-blur shadow-lg p-8 text-center text-gray-500" style={{ minHeight: '600px' }}>
                            暂无可用座位信息
                        </div>
                    ) : (
                        <div className="rounded-3xl bg-white/90 backdrop-blur shadow-xl overflow-hidden border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
                            {/* 标签栏 */}
                            <div className="flex items-center border-b border-gray-200 bg-gray-50/50 relative">
                                <button className="flex-1 px-6 py-3.5 text-sm font-semibold text-gray-400 flex items-center justify-center gap-2 transition-colors hover:bg-gray-100/50">
                                    🔒 无法调整
                                </button>
                                <button className="flex-1 px-6 py-3.5 text-sm font-bold text-blue-600 bg-white flex items-center justify-center gap-1 relative transition-all hover:scale-105">
                                    ✈️ {cabinLabel(effectiveCabinType)}
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 animate-pulse"></div>
                                </button>
                            </div>

                            {/* 座位区域 - 可滚动 */}
                            <div className="overflow-y-auto relative group/scroll" style={{ maxHeight: '70vh' }}>
                                {/* 顶部滚动指示器 */}
                                <div className="sticky top-0 left-0 right-0 h-1 bg-gradient-to-b from-blue-500/20 to-transparent pointer-events-none z-10 opacity-0 group-hover/scroll:opacity-100 transition-opacity" />
                                <div className="p-6">
                                    <SeatMap
                                        seats={seats}
                                        layout={layout}
                                        selectedSeatId={selectedSeat?.seatId}
                                        currentSeatId={currentSeatId}
                                        onSelect={handleSelect}
                                        disabled={submitting}
                                        effectiveCabinType={effectiveCabinType}
                                    />
                                </div>
                                {/* 底部滚动指示器 */}
                                <div className="sticky bottom-0 left-0 right-0 h-1 bg-gradient-to-t from-blue-500/20 to-transparent pointer-events-none z-10 opacity-0 group-hover/scroll:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Flight Info & Selection Panel */}
                <div className="lg:col-span-2 space-y-3 lg:space-y-4">
                    {/* 航班信息卡片 */}
                    <div className="rounded-3xl bg-white/90 backdrop-blur shadow-xl border border-gray-200 overflow-hidden group hover:shadow-2xl transition-shadow duration-300">
                        <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 px-6 py-5 text-white overflow-hidden">
                            {/* 波浪形装饰 */}
                            <svg 
                                className="absolute -bottom-1 left-0 w-full h-4" 
                                viewBox="0 0 1200 12" 
                                preserveAspectRatio="none"
                            >
                                <path 
                                    d="M0,6 Q300,0 600,6 T1200,6 L1200,12 L0,12 Z" 
                                    fill="white" 
                                    opacity="0.9"
                                />
                            </svg>
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                        <Plane className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-xl">航班信息</span>
                                </div>
                                <span className="text-xs bg-white/30 backdrop-blur px-3 py-1.5 rounded-full font-semibold">
                                    {effectiveCabinType ? cabinLabel(effectiveCabinType) : '未知舱位'}
                                </span>
                            </div>
                        </div>
                        <div className="p-6 space-y-4 bg-gradient-to-b from-white to-gray-50">
                            <div className="flex items-center gap-3 text-sm group/item hover:bg-blue-50 p-2 rounded-lg transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="text-gray-500 min-w-[60px]">订单号</span>
                                <span className="font-bold text-gray-900">{orderId}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm group/item hover:bg-indigo-50 p-2 rounded-lg transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-4 h-4 text-indigo-600" />
                                </div>
                                <span className="text-gray-500 min-w-[60px]">航班号</span>
                                <span className="font-bold text-gray-900">{flightId}</span>
                            </div>
                            {currentSeatId && (
                                <div className="flex items-center gap-3 text-sm group/item hover:bg-purple-50 p-2 rounded-lg transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <span className="text-gray-500 min-w-[60px]">当前座位</span>
                                    <span className="font-bold text-purple-600">{seats.find((s) => s.seatId === currentSeatId)?.seatNumber || '-'}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 座位选择卡片 */}
                    <div className="rounded-3xl bg-white/90 backdrop-blur shadow-xl border border-gray-200 p-6 hover:shadow-2xl transition-shadow duration-300">
                        {selectedSeat ? (
                            <div className="rounded-2xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100 p-5 relative shadow-inner">
                                <button
                                    type="button"
                                    onClick={handleRemoveSelected}
                                    disabled={submitting}
                                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white hover:bg-red-50 flex items-center justify-center text-gray-500 hover:text-red-600 disabled:opacity-50 shadow-md transition-all hover:scale-110"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-lg shadow-blue-500/40">
                                        {selectedSeat.columnLetter}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-base font-bold text-gray-900">{user?.realName || user?.username || 'Guest'}</div>
                                        <div className="mt-1 text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                            {selectedSeat.seatNumber}
                                        </div>
                                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-xs text-emerald-700 font-bold">
                                            <Check className="w-3 h-3" />
                                            免费选座
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 px-6 py-12 text-center">
                                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-200 flex items-center justify-center">
                                    <Plane className="w-8 h-8 text-gray-400" />
                                </div>
                                <div className="text-gray-500 text-sm font-medium">请从左侧选择座位</div>
                            </div>
                        )}

                        <div className="mt-5 space-y-2 bg-orange-50 rounded-xl p-4 border border-orange-100">
                            <div className="flex items-center gap-2 text-sm text-orange-700">
                                <AlertCircle className="w-4 h-4" />
                                <span className="font-medium">无法退款</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-orange-700">
                                <AlertCircle className="w-4 h-4" />
                                <span className="font-medium">舱等改变之后失效</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="flex items-baseline justify-between mb-6">
                                <span className="text-sm text-gray-600 font-medium">总额:</span>
                                <div className="text-right">
                                    <span className="relative text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                        0
                                        <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform"></span>
                                    </span>
                                    <span className="text-2xl font-bold text-gray-600 ml-1">CNY</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="py-3.5 rounded-2xl border-2 border-gray-300 bg-white text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-400 transition-all hover:shadow-md active:scale-95"
                                >
                                    返回
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirm}
                                    disabled={!selectedSeat || submitting}
                                    className={`py-3.5 rounded-2xl font-bold transition-all transform
                                        ${!selectedSeat || submitting
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/40 hover:shadow-xl hover:shadow-blue-500/50 hover:scale-105 active:scale-95'
                                        }
                                    `}
                                >
                                    {submitting ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            确认中
                                        </div>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            确认
                                            <Check className="w-5 h-5" />
                                        </span>
                                    )}
                                </button>
                            </div>

                            <div className="mt-4 text-xs text-center text-gray-500 bg-gray-50 rounded-lg py-2 px-3">
                                <div className="flex items-center justify-center gap-2">
                                    <RefreshCw className="w-3 h-3" />
                                    <span>自动刷新 {POLL_INTERVAL_MS / 1000}s · 上次: {lastRefreshText}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default SeatSelectionPage;
