import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ConfirmedBooking } from '../../booking/types';
import { confirmPayment, createPaymentConfirmToken, type PaymentConfirmToken } from '../../booking/api/payment';
import { cancelOrder } from '../../booking/api/order';
import { ArrowLeft, Plane, Calendar, CheckCircle, XCircle, Route, Ticket, CircleDollarSign, Clock, RefreshCw, Download } from 'lucide-react';
import { exportToCSV, type ExportColumn } from '@/utils/export';
import { Countdown } from '@/components';
import { API_CONFIG } from '@/config/constants';
import { InterlineOrderBadge } from '../../booking/components/booking-ui';
import { useToast } from '@/features/admin/components/Toast';
import { useConfirm } from '@/features/admin';
import { EmptyStateBookings, EmptyStateOrders } from '@/components/common';

// Helper to ensure dark mode texts are readable
const ensureDarkText = (classes: string) => {
  if (classes.includes('text-gray-600') && !classes.includes('dark:text')) return classes + ' dark:text-gray-300';
  if (classes.includes('text-gray-500') && !classes.includes('dark:text')) return classes + ' dark:text-gray-400';
  if (classes.includes('text-gray-900') && !classes.includes('dark:text')) return classes + ' dark:text-gray-100';
  return classes;
};

interface UserBookingsProps {
  bookings: ConfirmedBooking[];
  onBack: () => void;
  onUpdateBooking: (booking: ConfirmedBooking) => void;
}

const UserBookings: React.FC<UserBookingsProps> = ({ bookings, onBack, onUpdateBooking }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'cancelled' | 'pending_payment' | 'refunding'>('all');

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payBooking, setPayBooking] = useState<ConfirmedBooking | null>(null);
  const [payPreparing, setPayPreparing] = useState(false);
  const [payConfirming, setPayConfirming] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [payToken, setPayToken] = useState<PaymentConfirmToken | null>(null);

  const totalCount = bookings.length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const totalAmount = bookings.reduce((acc, b) => acc + (b.totalPrice || 0), 0);

  const filteredBookings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return bookings
      .filter((b) => statusFilter === 'all' || b.status === statusFilter)
      .filter((b) => {
        if (!term) return true;
        const flights = b.flights && b.flights.length > 0 ? b.flights : b.flight ? [b.flight] : [];
        const first = flights[0];
        const last = flights[flights.length - 1];

        return (
          b.id.toLowerCase().includes(term) ||
          b.passengerName.toLowerCase().includes(term) ||
          (first?.origin || '').toLowerCase().includes(term) ||
          (last?.destination || '').toLowerCase().includes(term)
        );
      })
      .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
  }, [bookings, searchTerm, statusFilter]);

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('zh-CN');
  };

  /** 使用统一配置计算支付截止时间 */
  const getPaymentDeadlineMs = (bookingDate: string) => {
    return new Date(bookingDate).getTime() + API_CONFIG.PAYMENT_TIMEOUT_MS;
  };

  const handlePay = (booking: ConfirmedBooking) => {
    const isExpired = Date.now() >= getPaymentDeadlineMs(booking.bookingDate);
    if (isExpired) {
      setActionError('订单已超时，无法支付');
      return;
    }

    setPayPreparing(true);
    setPayConfirming(false);
    setPayError(null);
    setPayBooking(booking);
    createPaymentConfirmToken({ orderNo: booking.id, amount: Number(booking.totalPrice || 0) })
      .then((token) => {
        setPayToken(token);
        setPayModalOpen(true);
      })
      .catch((e: any) => setPayError(e?.message || '支付准备失败'))
      .finally(() => setPayPreparing(false));
  };

  const closePayModal = () => {
    if (payConfirming) return;
    setPayModalOpen(false);
    setPayToken(null);
    setPayBooking(null);
    setPayError(null);
  };

  const handleConfirmPay = () => {
    if (!payToken || !payBooking) return;
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
        onUpdateBooking(payBooking);
        closePayModal();
        toast.success('支付成功！');
      })
      .catch((e: any) => setPayError(e?.message || '支付失败'))
      .finally(() => setPayConfirming(false));
  };

  const handleCancelOrder = async (booking: ConfirmedBooking) => {
    const ok = await confirm({
      title: '确认取消订单',
      message: '确定要取消这个订单吗？取消后无法恢复。',
      variant: 'danger',
      confirmText: '确认取消',
      cancelText: '暂不取消',
    });
    if (!ok) return;

    setActionError(null);
    setActionLoading(true);
    cancelOrder(booking.id)
      .then(() => {
        onUpdateBooking(booking);
      })
      .catch((e: any) => {
        setActionError(e?.message || '取消失败');
      })
      .finally(() => setActionLoading(false));
  };

  const renderStatusBadge = (booking: ConfirmedBooking) => {
    switch (booking.status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle className="w-3.5 h-3.5" /> 出票成功
          </span>
        );
      case 'pending_payment':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100">
            <Clock className="w-3.5 h-3.5" /> 待支付 (
            <Countdown
              targetTime={getPaymentDeadlineMs(booking.bookingDate)}
              variant="inline"
              showIcon={false}
              onExpire={() => {
                cancelOrder(booking.id)
                  .then(() => onUpdateBooking(booking))
                  .catch(() => {
                    // ignore
                  });
              }}
            />
            )
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-600">
            <XCircle className="w-3.5 h-3.5" /> 已取消
          </span>
        );
      case 'refunding':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800">
            <RefreshCw className="w-3.5 h-3.5" /> 退改审核中
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border border-gray-100 dark:border-gray-600">
            <CheckCircle className="w-3.5 h-3.5" /> 已退款
          </span>
        );
      case 'changed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
            <CheckCircle className="w-3.5 h-3.5" /> 改签完成
          </span>
        );
      default:
        return null;
    }
  };

  const renderActionButtons = (booking: ConfirmedBooking) => {
    switch (booking.status) {
      case 'pending_payment': {
        const isExpired = Date.now() >= getPaymentDeadlineMs(booking.bookingDate);
        return (
          <div className="flex gap-3 mt-4 lg:mt-0 lg:ml-auto">
            <button
              onClick={() => handleCancelOrder(booking)}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              取消订单
            </button>
            <button
              onClick={() => handlePay(booking)}
              disabled={isExpired || actionLoading || payPreparing}
              className={`px-6 py-2 rounded-xl text-white text-sm font-bold transition-all shadow-lg shadow-orange-500/20 ${isExpired || payPreparing
                ? 'bg-gray-300 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                }`}
            >
              {payPreparing ? '准备中...' : '去支付'}
            </button>
          </div>
        );
      }
      case 'confirmed':
        return (
          <div className="mt-4 lg:mt-0 lg:ml-auto flex flex-col items-end gap-2">
            <div className="text-xs text-gray-500 dark:text-gray-300">退改签入口在订单详情页</div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/my-bookings/${booking.id}`, { state: { booking } })}
                className="px-4 py-2 rounded-xl bg-sky-50 text-sky-700 text-sm font-bold hover:bg-sky-100 transition-all"
              >
                详情
              </button>
            </div>
          </div>
        );
      case 'refunding':
        return (
          <div className="mt-4 lg:mt-0 lg:ml-auto text-right">
            <div className="text-sm text-purple-600 dark:text-purple-400 mb-2 font-medium">申请已提交</div>
            <button
              onClick={() => navigate('/refunds-help')}
              className="px-4 py-2 rounded-xl bg-purple-50 text-purple-700 text-sm font-bold hover:bg-purple-100 transition-all"
            >
              查看进度
            </button>
          </div>
        );
      default:
        return (
          <div className="flex gap-3 mt-4 lg:mt-0 lg:ml-auto">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              再次预订
            </button>
            <button
              onClick={() => navigate(`/my-bookings/${booking.id}`, { state: { booking } })}
              className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              查看详情
            </button>
          </div>
        );
    }
  };

  return (
    <div className="relative animate-fade-in-up mt-8 w-full max-w-screen-2xl mx-auto mb-20 px-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-44 -right-44 h-[520px] w-[520px] rounded-full bg-sky-200/25 blur-3xl" />
        <div className="absolute -bottom-56 -left-40 h-[560px] w-[560px] rounded-full bg-blue-200/20 blur-3xl" />
      </div>

      {actionError && (
        <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>
      )}

      <div className="relative overflow-hidden rounded-3xl border border-sky-200 bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 text-white shadow-xl shadow-sky-500/15 mb-6">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-200/25 blur-3xl" />
        <div className="relative p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">我的订单</h2>
                <p className="text-sm text-white/85 mt-1">交易全生命周期与售后入口</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/refunds-help')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm font-bold transition-all w-full sm:w-auto"
            >
              <RefreshCw className="w-4 h-4" />
              退改/售后
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-sky-100 dark:border-sky-900/30 bg-white/90 dark:bg-gray-900/90 backdrop-blur shadow-sm">
        <div className="p-6 sm:p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-sky-100 dark:border-sky-900/30 bg-gradient-to-br from-sky-50 to-white dark:from-sky-900/20 dark:to-gray-800 p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">订单数量</div>
                <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/20">
                  <Ticket className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{totalCount}</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">已确认 {confirmedCount} 单</div>
            </div>

            <div className="rounded-2xl border border-sky-100 dark:border-sky-900/30 bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-900/20 dark:to-gray-800 p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">累计支出</div>
                <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <CircleDollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">¥{totalAmount.toLocaleString()}</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">含税总价</div>
            </div>

            <div className="rounded-2xl border border-sky-100 dark:border-sky-900/30 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">行程概览</div>
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Route className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{Math.max(0, totalCount)}</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">随时查看详情与凭证</div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="mt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl w-fit overflow-x-auto">
              {[
                { id: 'all' as const, label: '全部' },
                { id: 'confirmed' as const, label: '已确认' },
                { id: 'pending_payment' as const, label: '待支付' },
                { id: 'refunding' as const, label: '退改中' },
                { id: 'cancelled' as const, label: '已取消' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStatusFilter(opt.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${statusFilter === opt.id ? 'bg-white dark:bg-gray-700 text-sky-700 dark:text-sky-400 shadow-sm' : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索订单号 / 乘客 / 航线"
                className="flex-1 lg:w-72 px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-gray-800 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={() => {
                  const columns: ExportColumn<ConfirmedBooking>[] = [
                    { key: 'id', label: '订单号' },
                    { key: 'passengerName', label: '乘客姓名' },
                    { key: 'status', label: '状态', formatter: (item) => item.status === 'confirmed' ? '已确认' : item.status === 'pending_payment' ? '待支付' : item.status === 'cancelled' ? '已取消' : item.status === 'refunding' ? '退改中' : item.status },
                    { key: 'flight.origin', label: '出发地', formatter: (item) => item.flight?.origin || item.flights?.[0]?.origin || '' },
                    { key: 'flight.destination', label: '目的地', formatter: (item) => item.flight?.destination || item.flights?.[item.flights.length - 1]?.destination || '' },
                    { key: 'totalPrice', label: '金额', formatter: (item) => `¥${Number(item.totalPrice || 0).toLocaleString()}` },
                    { key: 'bookingDate', label: '下单时间', formatter: (item) => new Date(item.bookingDate).toLocaleString('zh-CN') },
                  ];
                  exportToCSV(filteredBookings, `我的订单_${statusFilter}`, columns);
                }}
                className="px-4 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 text-sm font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                导出
              </button>
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-500 dark:text-gray-300">
            显示 {filteredBookings.length} / {totalCount} 条
          </div>

          {/* Booking List */}
          <div className="mt-4 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 overflow-hidden">
            {bookings.length === 0 ? (
              <EmptyStateBookings
                variant="illustrated"
                size="lg"
                className="rounded-none border-none"
                actionLabel="去搜索航班"
                onAction={() => navigate('/')}
              />
            ) : filteredBookings.length === 0 ? (
              <div className="p-8">
                <EmptyStateOrders
                  variant="minimal"
                  size="md"
                  title="暂无匹配订单"
                  description="尝试切换状态或修改关键词"
                  className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50"
                />
              </div>
            ) : (
              <ul className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredBookings.map((b) => {
                  const flights = b.flights && b.flights.length > 0 ? b.flights : b.flight ? [b.flight] : [];
                  const first = flights[0];
                  const last = flights[flights.length - 1];

                  return (
                    <li key={b.id} className="p-6 sm:p-7 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3 flex-wrap mb-3">
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 px-2.5 py-1 rounded-full font-mono">
                              {b.id}
                            </span>
                            {renderStatusBadge(b)}
                            {/* 联程订单标识 */}
                            {(b as any).parentOrderId && (
                              <InterlineOrderBadge />
                            )}
                            {flights.length > 1 && flights[0]?.segments && flights[0].segments.length > 1 && (
                              <InterlineOrderBadge totalSegments={flights[0].segments.length} />
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-300 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> {formatDateTime(b.bookingDate)}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 min-w-0">
                            <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                              {first?.origin || '-'} → {last?.destination || '-'}
                            </div>
                            <div className="text-lg font-bold text-gray-900 dark:text-gray-100 ml-4">¥{(b.totalPrice || 0).toLocaleString()}</div>
                          </div>

                          <div className="mt-1 text-sm text-gray-500 dark:text-gray-300">乘客: {b.passengerName}</div>
                        </div>

                        {/* Dynamic Action Buttons */}
                        {renderActionButtons(b)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {payModalOpen && payToken && payBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
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
              {(payError || null) && (
                <div className="rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">{payError}</div>
              )}

              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-4">
                <div className="text-xs text-gray-500 dark:text-gray-300">订单号</div>
                <div className="font-mono text-sm text-gray-800 dark:text-gray-200 mt-1 break-all">{payBooking.id}</div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-300">支付金额</div>
                    <div className="text-lg font-extrabold text-gray-900 dark:text-gray-100 mt-0.5">¥{Number(payBooking.totalPrice || 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-300">支付方式</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-1">银行卡/信用卡</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-gray-900 p-4">
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">行程摘要</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  {(payBooking.flights?.[0]?.origin || payBooking.flight?.origin || '-') +
                    ' → ' +
                    (payBooking.flights?.[(payBooking.flights?.length ?? 0) - 1]?.destination || payBooking.flight?.destination || '-')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-300 mt-1">乘客：{payBooking.passengerName}</div>
              </div>

              <div className="rounded-2xl border border-orange-100 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/20 p-4 text-xs text-orange-800 dark:text-orange-300">支付确认令牌有效期 30 分钟，且仅可使用一次。</div>
            </div>

            <div className="px-6 py-5 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3">
              <button
                type="button"
                onClick={closePayModal}
                disabled={payConfirming}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmPay}
                disabled={payConfirming}
                className="flex-1 px-4 py-2.5 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {payConfirming ? '支付中...' : '确认支付'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserBookings;
