import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { type ConfirmedBooking, type PassengerInfo } from '@/features/booking';
import { ArrowLeft, Calendar, CheckCircle, Plane, Route, Ticket, XCircle, RefreshCw, Clock, Armchair, AlertTriangle } from 'lucide-react';
import { searchOrders, type OrderSearchResult, cancelOrder } from '@/features/booking/api/order';
import { confirmPayment, createPaymentConfirmToken, type PaymentConfirmToken } from '@/features/booking/api/payment';
import { applyRefundChange } from '@/features/user/api/refund';
import { loadOrderPassengers } from '@/shared/utils/storage';
import { ORDER_STATUS } from '@/features/admin/constants';
import { API_CONFIG } from '@/config/constants';
import { InterlineJourneyTimeline } from '@/features/booking/components/booking-ui';
import { useToast } from '@/features/admin/components/Toast';
import { logger } from '@/shared/logger';

const pad2 = (n: number) => String(n).padStart(2, '0');

const parsePassengersJson = (raw?: string | null): PassengerInfo[] | undefined => {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as any;
    if (!Array.isArray(parsed)) return undefined;
    const next = parsed
      .map((p) => ({
        name: String(p?.name ?? '').trim(),
        idCard: String(p?.idCard ?? p?.passportNumber ?? p?.id ?? '').trim(),
        type: (String(p?.type ?? '').toLowerCase() === 'child' || p?.type === 1 ? 'child' : 'adult') as 'child' | 'adult',
      }))
      .filter((p) => !!p.name || !!p.idCard);
    return next.length > 0 ? next : undefined;
  } catch {
    return undefined;
  }
};

const maskIdCard = (id?: string) => {
  const v = String(id ?? '').trim();
  if (!v) return '';
  if (v.length < 8) return v;
  return `${v.slice(0, 6)}********${v.slice(-4)}`;
};

const mapOrderToBooking = (o: OrderSearchResult): ConfirmedBooking => {
  const id = String(o.orderNo);
  const passengers = parsePassengersJson(o.passengersJson) ?? loadOrderPassengers(id) ?? [];

  const dbFlightId = o.flightId || '';

  return {
    id,
    flight: {
      id: dbFlightId,
      airline: '',
      airlineCode: (o.flightNo || '').replace(/[^A-Z]/g, '').slice(0, 2),
      flightNumber: o.flightNo || '',
      cabinType: 'economy',
      origin: o.origin || '',
      destination: o.destination || '',
      departureTime: o.departureTime || '',
      arrivalTime: o.arrivalTime || '',
      price: Number(o.totalAmount || 0),
      remainingSeats: 0,
      duration: '',
      stops: 0,
      baggageWeight: 23,
      amenities: { hasPower: false, hasMeal: true, hasWifi: false, hasEntertainment: false },
    },
    flights: [{
      id: dbFlightId,
      airline: '',
      airlineCode: (o.flightNo || '').replace(/[^A-Z]/g, '').slice(0, 2),
      flightNumber: o.flightNo || '',
      cabinType: 'economy',
      origin: o.origin || '',
      destination: o.destination || '',
      departureTime: o.departureTime || '',
      arrivalTime: o.arrivalTime || '',
      price: Number(o.totalAmount || 0),
      remainingSeats: 0,
      duration: '',
      stops: 0,
      baggageWeight: 23,
      amenities: { hasPower: false, hasMeal: true, hasWifi: false, hasEntertainment: false },
    }],
    status:
      o.orderStatus === ORDER_STATUS.PENDING_PAYMENT
        ? 'pending_payment'
        : o.orderStatus === ORDER_STATUS.CONFIRMED
          ? 'confirmed'
          : o.orderStatus === ORDER_STATUS.PROCESSING
            ? 'refunding'
            : o.orderStatus === ORDER_STATUS.REFUNDED
              ? 'refunded'
              : o.orderStatus === ORDER_STATUS.CANCELLED
                ? 'cancelled'
                : 'pending_payment',
    bookingDate: o.orderTime || new Date().toISOString(),
    totalPrice: Number(o.totalAmount || 0),
    passengerName: o.passengerName || passengers[0]?.name || '',
    passportNumber: '',
    passengers,
    contactEmail: o.contactEmail || '',
    phone: o.contactPhone || '',
  };
};

const mapOrdersToBooking = (orders: OrderSearchResult[]): ConfirmedBooking | null => {
  if (!orders || orders.length === 0) return null;

  const sortedOrders = [...orders].sort((a, b) =>
    (a.departureTime || '').localeCompare(b.departureTime || '')
  );

  const firstOrder = sortedOrders[0];
  const compositeId = sortedOrders.map(o => o.orderNo).join('+');

  const totalPrice = sortedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  const flights = sortedOrders.map(o => {
    const dbFlightId = o.flightId || '';
    return {
      id: dbFlightId,
      airline: '',
      airlineCode: (o.flightNo || '').replace(/[^A-Z]/g, '').slice(0, 2),
      flightNumber: o.flightNo || '',
      cabinType: 'economy',
      origin: o.origin || '',
      destination: o.destination || '',
      departureTime: o.departureTime || '',
      arrivalTime: o.arrivalTime || '',
      price: Number(o.totalAmount || 0),
      remainingSeats: 0,
      duration: '',
      stops: 0,
      baggageWeight: 23,
      amenities: { hasPower: false, hasMeal: true, hasWifi: false, hasEntertainment: false },
    };
  });

  const passengers = parsePassengersJson(firstOrder.passengersJson) ?? loadOrderPassengers(compositeId) ?? loadOrderPassengers(String(firstOrder.orderNo)) ?? [];

  let status: ConfirmedBooking['status'] = 'pending_payment';
  if (firstOrder.orderStatus === ORDER_STATUS.CONFIRMED) status = 'confirmed';
  else if (firstOrder.orderStatus === ORDER_STATUS.PROCESSING) status = 'refunding';
  else if (firstOrder.orderStatus === ORDER_STATUS.REFUNDED) status = 'refunded';
  else if (firstOrder.orderStatus === ORDER_STATUS.CANCELLED) status = 'cancelled';

  return {
    id: compositeId,
    flight: flights[0],
    flights: flights,
    status,
    bookingDate: firstOrder.orderTime || new Date().toISOString(),
    totalPrice: totalPrice,
    passengerName: firstOrder.passengerName || passengers[0]?.name || '',
    passportNumber: '',
    passengers,
    contactEmail: firstOrder.contactEmail || '',
    phone: firstOrder.contactPhone || '',
  };
};

const fetchBookingDetails = async (userId: string | number, bookingId: string): Promise<ConfirmedBooking | null> => {
  if (bookingId.includes('+')) {
    const ids = bookingId.split('+');
    const results = await Promise.all(ids.map(id => searchOrders({ userId, orderNo: id })));
    const flatOrders = results.flat();
    if (flatOrders.length === 0) return null;
    return mapOrdersToBooking(flatOrders);
  } else {
    const res = await searchOrders({ userId, orderNo: bookingId });
    if (res.length === 0) return null;
    return mapOrderToBooking(res[0]);
  }
};

const formatLocalYmd = (d: Date) => {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const getPaymentDeadlineMs = (bookingDate: string) => {
  return new Date(bookingDate).getTime() + API_CONFIG.PAYMENT_TIMEOUT_MS;
};

export const BookingDetailsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const params = useParams();
  const location = useLocation();
  const stateBooking = (location.state as { booking?: ConfirmedBooking } | null)?.booking;
  const [booking, setBooking] = useState<ConfirmedBooking | null>(stateBooking || null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [payTimeLeft, setPayTimeLeft] = useState('');
  const expireTriggeredRef = useRef(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payPreparing, setPayPreparing] = useState(false);
  const [payConfirming, setPayConfirming] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [payToken, setPayToken] = useState<PaymentConfirmToken | null>(null);

  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundApplying, setRefundApplying] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (stateBooking) {
      setBooking(stateBooking);
      return;
    }

    const id = params.bookingId;
    if (!id) return;
    if (!user.id) return;
    setDetailLoading(true);
    setDetailError(null);
    fetchBookingDetails(user.id, id)
      .then((res) => {
        setBooking(res);
      })
      .catch((e: any) => {
        setDetailError(e?.message || '加载订单详情失败');
        setBooking(null);
      })
      .finally(() => setDetailLoading(false));
  }, [navigate, params.bookingId, stateBooking, user]);

  useEffect(() => {
    if (!booking || booking.status !== 'pending_payment') return;
    expireTriggeredRef.current = false;

    const tick = () => {
      const targetTime = getPaymentDeadlineMs(booking.bookingDate);
      const diff = targetTime - Date.now();
      if (diff <= 0) {
        setPayTimeLeft('00:00');
        if (!expireTriggeredRef.current) {
          expireTriggeredRef.current = true;
          const ids = booking.id.split('+');
          Promise.all(ids.map(id => cancelOrder(id)))
            .then(() => {
              if (user?.id) {
                return fetchBookingDetails(user.id, booking.id).then((res) => {
                  if (res) setBooking(res);
                });
              }
            })
            .catch(() => setBooking({ ...booking, status: 'cancelled' }));
        }
        return;
      }
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setPayTimeLeft(`${pad2(minutes)}:${pad2(seconds)}`);
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [booking]);

  if (!user) return null;

  if (!booking) {
    return (
      <div className="animate-fade-in-up mt-8 w-full max-w-screen-2xl mx-auto mb-20 px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="p-6 flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/my-bookings')}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 hover:shadow-sm text-gray-600 dark:text-slate-300 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="text-xl font-bold text-gray-900 dark:text-slate-100">订单不存在或已过期</div>
              <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">返回我的订单查看最新数据</div>
              {detailError && <div className="text-sm text-red-600 dark:text-red-400 mt-2">{detailError}</div>}
              {detailLoading && <div className="text-sm text-gray-500 dark:text-slate-500 mt-2">加载中...</div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const flights = booking.flights && booking.flights.length > 0 ? booking.flights : booking.flight ? [booking.flight] : [];
  const first = flights[0];
  const last = flights[flights.length - 1];
  const passengerList = Array.isArray(booking.passengers) && booking.passengers.length > 0 ? booking.passengers : [];

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('zh-CN');
  };

  const handleRefundChange = () => {
    navigate('/refunds-help');
  };

  const openRefundModal = () => {
    setRefundReason('');
    setRefundModalOpen(true);
  };

  const handleApplyRefund = async () => {
    if (!refundReason.trim()) {
      toast.error('请填写退票原因');
      return;
    }
    try {
      setRefundApplying(true);
      await applyRefundChange({
        orderNo: booking.id,
        operType: 1,
        remark: refundReason.trim(),
      });
      toast.success('退票申请已提交，请前往"退改/售后"页面查看进度');
      setRefundModalOpen(false);
      if (user?.id) {
        const refreshed = await fetchBookingDetails(user.id, booking.id);
        if (refreshed) {
          setBooking(refreshed);
        }
      }
    } catch (e: any) {
      toast.error(e?.message || '退票申请失败');
    } finally {
      setRefundApplying(false);
    }
  };

  const openChangePage = () => {
    navigate(`/booking/change?orderNo=${encodeURIComponent(booking.id)}`, { state: { booking } });
  };

  const renderStatusBadge = () => {
    if (!booking) return null;
    switch (booking.status) {
      case 'confirmed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50"><CheckCircle className="w-3.5 h-3.5" /> 出票成功</span>;
      case 'pending_payment':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-100 dark:border-orange-800/50">
            <Clock className="w-3.5 h-3.5" /> 待支付 ({payTimeLeft || '00:00'})
          </span>
        );
      case 'cancelled':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-slate-400 border border-gray-100 dark:border-slate-800"><XCircle className="w-3.5 h-3.5" /> 已取消</span>;
      case 'refunding':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800/50"><RefreshCw className="w-3.5 h-3.5" /> 退改审核中</span>;
      case 'refunded':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-slate-500 border border-gray-100 dark:border-slate-800"><CheckCircle className="w-3.5 h-3.5" /> 已退款</span>;
      case 'changed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50"><CheckCircle className="w-3.5 h-3.5" /> 改签完成</span>;
      default:
        return null;
    }
  };

  const handlePay = async () => {
    if (!user?.id) {
      toast.error('请先登录');
      return;
    }

    setPayPreparing(true);
    setPayError(null);

    try {
      let currentBooking = booking;
      try {
        const refreshed = await fetchBookingDetails(user.id, booking.id);
        if (refreshed) {
          currentBooking = refreshed;
          setBooking(currentBooking);
        }
      } catch (refreshErr) {
        logger.warn('刷新订单状态失败，继续使用缓存数据', refreshErr);
      }

      if (currentBooking.status !== 'pending_payment') {
        const statusMsg = currentBooking.status === 'confirmed' ? '订单已支付' :
          currentBooking.status === 'cancelled' ? '订单已取消' : '订单状态异常';
        setPayError(statusMsg);
        toast.warning(statusMsg);
        return;
      }

      const expired = Date.now() >= getPaymentDeadlineMs(currentBooking.bookingDate);
      if (expired) {
        const ids = currentBooking.id.split('+');
        Promise.all(ids.map(id => cancelOrder(id)))
          .then(() => fetchBookingDetails(user!.id!, currentBooking.id).then((res) => {
            if (res) setBooking(res);
          }))
          .catch(() => setBooking({ ...currentBooking, status: 'cancelled' }));
        toast.warning('订单已超时，已自动取消');
        return;
      }

      const token = await createPaymentConfirmToken({ orderNo: currentBooking.id, amount: Number(currentBooking.totalPrice || 0) });
      
      console.group('💳 Payment Preparation');
      console.log('Order No:', currentBooking.id);
      console.log('Payment Amount:', Number(currentBooking.totalPrice || 0));
      console.log('Payment Token:', token);
      console.groupEnd();

      setPayToken(token);
      setPayModalOpen(true);
    } catch (e: any) {
      const msg = e?.message || '支付准备失败';
      setPayError(msg);
      toast.error(msg);
    } finally {
      setPayPreparing(false);
    }
  };

  const closePayModal = () => {
    if (payConfirming) return;
    setPayModalOpen(false);
    setPayToken(null);
    setPayError(null);
  };

  const handleConfirmPay = () => {
    if (!payToken) return;
    setPayConfirming(true);
    setPayError(null);
    confirmPayment({
      orderNo: payToken.orderNo,
      amount: Number(payToken.amount),
      timestamp: payToken.timestamp,
      token: payToken.token,
      method: 'CARD',
    })
      .then(() => {
        console.log('✅ Payment Confirmed for amount:', payToken.amount);
        toast.success('支付成功！');
        setPayModalOpen(false);
        setPayToken(null);
        if (user?.id) {
          return fetchBookingDetails(user.id, booking.id).then((res) => {
            if (res) setBooking(res);
          });
        }
      })
      .catch((e: any) => setPayError(e?.message || '支付失败'))
      .finally(() => setPayConfirming(false));
  };

  return (
    <div className="animate-fade-in-up mt-8 w-full max-w-screen-2xl mx-auto mb-20 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/my-bookings')}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 hover:shadow-sm text-gray-600 dark:text-slate-300 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">订单详情</h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-gray-500 dark:text-slate-400 text-sm">{booking.id}</p>
              {renderStatusBadge()}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {booking.status === 'confirmed' && (
            <>
              <button
                onClick={() => {
                  const flightId = booking.flight?.id || booking.flights?.[0]?.id || '';
                  const cabinType = booking.flight?.cabinType || booking.flights?.[0]?.cabinType || '';
                  navigate(`/booking/seat-selection?orderId=${encodeURIComponent(booking.id)}&flightId=${encodeURIComponent(flightId)}&cabinType=${encodeURIComponent(cabinType)}`);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800 text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all shadow-sm"
              >
                <Armchair className="w-4 h-4" />
                在线选座
              </button>
              <button
                onClick={openChangePage}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-800 text-sm font-bold hover:bg-sky-100 dark:hover:bg-sky-800/50 transition-all shadow-sm"
              >
                <Plane className="w-4 h-4" />
                申请改签
              </button>
              <button
                onClick={openRefundModal}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30 text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-all shadow-sm"
              >
                <XCircle className="w-4 h-4" />
                申请退票
              </button>
              <button
                onClick={handleRefundChange}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-red-600 dark:hover:text-red-400 transition-all shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                退改/售后
              </button>
            </>
          )}
          {booking.status === 'pending_payment' && (
            <button
              onClick={handlePay}
              disabled={Date.now() >= getPaymentDeadlineMs(booking.bookingDate) || payPreparing}
              className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-all shadow-lg shadow-orange-500/20 ${Date.now() >= getPaymentDeadlineMs(booking.bookingDate) || payPreparing
                ? 'bg-gray-300 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                }`}
            >
              {payPreparing ? '准备中...' : '去支付'}
            </button>
          )}
          {booking.status === 'refunding' && (
            <button
              onClick={() => navigate('/refunds-help')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 text-purple-700 text-sm font-bold hover:bg-purple-100 transition-all"
            >
              查看进度
            </button>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-gray-100 dark:border-cosmos-border bg-gradient-to-br from-blue-50 to-white dark:from-cosmos-surface-elevated/80 dark:to-cosmos-bg p-5 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-cosmos-text-muted font-medium">航线</div>
                <div className="w-10 h-10 rounded-2xl bg-blue-600 dark:bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 dark:shadow-cosmos-glow/20">
                  <Route className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-lg font-bold text-gray-900 dark:text-white truncate">
                {first?.origin || '-'} → {last?.destination || '-'}
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">共 {flights.length || 0} 段</div>
            </div>

            <div className="rounded-2xl border border-gray-100 dark:border-cosmos-border bg-gradient-to-br from-emerald-50 to-white dark:from-cosmos-surface-elevated/80 dark:to-cosmos-bg p-5 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-cosmos-text-muted font-medium">乘客</div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 dark:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 dark:shadow-cosmos-glow/20">
                  <Ticket className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-lg font-bold text-gray-900 dark:text-white truncate">{booking.passengerName || '-'}</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                {(booking.contactEmail || booking.phone) ? `${booking.contactEmail || '-'} ${booking.phone ? `• ${booking.phone}` : ''}` : '-'}
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-slate-400">共 {Math.max(1, passengerList.length || 0)} 人</div>
            </div>

            <div className="rounded-2xl border border-gray-100 dark:border-cosmos-border bg-gradient-to-br from-indigo-50 to-white dark:from-cosmos-surface-elevated/80 dark:to-cosmos-bg p-5 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-cosmos-text-muted font-medium">价格</div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 dark:bg-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 dark:shadow-cosmos-glow/20">
                  <Plane className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">¥{(booking.totalPrice || 0).toLocaleString()}</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">含税总价</div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex items-center justify-between gap-4">
              <div className="text-sm font-bold text-gray-900 dark:text-slate-100">乘客信息</div>
              {detailLoading && <div className="text-xs text-gray-500 dark:text-slate-500">加载中...</div>}
            </div>
            <div className="p-6">
              {passengerList.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-slate-400">暂无乘客信息</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {passengerList.map((p, idx) => (
                    <div key={`${booking.id}-p-${idx}`} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-4 transition-colors">
                      <div className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">{p.name || '-'}</div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-slate-400 font-mono break-all">{maskIdCard(p.idCard) || '-'}</div>
                      <div className="mt-2 text-xs text-gray-500 dark:text-slate-500">{p.type === 'child' ? '儿童' : '成人'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-slate-100">航段信息</div>
                <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {formatDateTime(booking.bookingDate)}
                </div>
              </div>
            </div>

            <div className="p-6">
              {flights.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-slate-400">暂无航段信息</div>
              ) : flights.length > 1 && flights[0].segments && flights[0].segments.length > 0 ? (
                <InterlineJourneyTimeline
                  segments={flights[0].segments}
                  transferCity={flights[0].transferCity}
                  transferDuration={flights[0].transferDuration}
                />
              ) : (
                <div className="space-y-3">
                  {flights.map((f, idx) => (
                    <div
                      key={`${booking.id}-${idx}-${f.id}`}
                      className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {f.origin} → {f.destination}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">{f.flightNumber || f.id}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                          {formatTime(f.departureTime)} - {formatTime(f.arrivalTime)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{f.duration}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {payModalOpen && payToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-5 flex items-start justify-between">
              <div>
                <div className="text-white text-lg font-extrabold">支付确认</div>
                <div className="text-white/90 text-sm mt-1">请核对订单信息后完成支付</div>
              </div>
              <button
                type="button"
                onClick={closePayModal}
                disabled={payConfirming}
                className="text-white/80 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {payError && <div className="rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">{payError}</div>}

              <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/80 p-4">
                <div className="text-xs text-gray-500 dark:text-slate-400">订单号</div>
                <div className="font-mono text-sm text-gray-800 dark:text-slate-200 mt-1 break-all">{booking.id}</div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">支付金额</div>
                    <div className="text-lg font-extrabold text-gray-900 dark:text-white mt-0.5">¥{Number(booking.totalPrice || 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">支付方式</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white mt-1">银行卡/信用卡</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-950 p-4">
                <div className="text-sm font-bold text-gray-900 dark:text-white">行程摘要</div>
                <div className="text-sm text-gray-600 dark:text-slate-300 mt-2">
                  {first?.origin || '-'} → {last?.destination || '-'}（{flights.length || 0} 段）
                </div>
                <div className="text-xs text-gray-500 dark:text-slate-500 mt-1">乘客：{booking.passengerName}</div>
              </div>

              <div className="rounded-2xl border border-orange-100 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/10 p-4 text-xs text-orange-800 dark:text-orange-400">
                支付确认令牌有效期 30 分钟，且仅可使用一次。
              </div>
            </div>

            <div className="px-6 py-5 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex items-center gap-3">
              <button
                type="button"
                onClick={closePayModal}
                disabled={payConfirming}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-400 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmPay}
                disabled={payConfirming}
                className="flex-1 px-4 py-2.5 rounded-xl bg-orange-600 dark:bg-orange-700 text-white font-bold hover:bg-orange-700 dark:hover:bg-orange-800 transition-all shadow-lg shadow-orange-500/20 dark:shadow-orange-950/50 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {payConfirming ? '支付中...' : '确认支付'}
              </button>
            </div>
          </div>
        </div>
      )}

      {refundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl animate-scale-up border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">申请退票</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">订单号 {booking.id}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-2xl border border-orange-100 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/10 p-4 text-xs text-orange-800 dark:text-orange-400">
                <strong>温馨提示：</strong>退票申请提交后将进入人工审核流程，退款金额将根据退票规则扣除相应手续费后原路返还。
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">退票原因 <span className="text-red-500">*</span></label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="请详细描述您的退票原因，以便我们更快处理您的申请..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white outline-none text-sm min-h-[120px] resize-none transition-all"
                />
              </div>
              <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/80 p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-slate-400">订单金额</span>
                  <span className="text-lg font-extrabold text-gray-900 dark:text-white">¥{Number(booking.totalPrice || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRefundModalOpen(false)}
                disabled={refundApplying}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-400 font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleApplyRefund}
                disabled={refundApplying || !refundReason.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 dark:bg-red-700 text-white font-bold hover:bg-red-700 dark:hover:bg-red-800 transition-all shadow-lg shadow-red-500/20 dark:shadow-red-950/50 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {refundApplying ? '提交中...' : '确认申请'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
