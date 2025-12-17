import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmedBooking } from '../../types';
import { applyRefundChange } from '../../services/refundChange';
import { payOrder } from '../../services/payments';
import { cancelOrder } from '../../services/orders';
import { ArrowLeft, Plane, Calendar, CheckCircle, XCircle, Route, Ticket, CircleDollarSign, AlertCircle, Clock, RefreshCw } from 'lucide-react';

interface UserBookingsProps {
  bookings: ConfirmedBooking[];
  onBack: () => void;
  onUpdateBooking: (booking: ConfirmedBooking) => void;
}

type ModalType = 'refund' | 'change' | null;

const UserBookings: React.FC<UserBookingsProps> = ({ bookings, onBack, onUpdateBooking }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'cancelled' | 'pending_payment' | 'refunding'>('all');

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedBooking, setSelectedBooking] = useState<ConfirmedBooking | null>(null);
  const [reason, setReason] = useState('');
  const [newFlight, setNewFlight] = useState('');

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

  const getPaymentDeadlineMs = (bookingDate: string) => {
    return new Date(bookingDate).getTime() + 30 * 60 * 1000;
  };

  const Countdown = ({ date, onExpire }: { date: string; onExpire?: () => void }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const expiredCalledRef = useRef(false);

    useEffect(() => {
      const targetTime = getPaymentDeadlineMs(date);
      
      const timer = setInterval(() => {
        const now = Date.now();
        const diff = targetTime - now;

        if (diff <= 0) {
          setTimeLeft('00:00');
          if (!expiredCalledRef.current) {
            expiredCalledRef.current = true;
            onExpire?.();
          }
          clearInterval(timer);
          return;
        }

        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);

      return () => clearInterval(timer);
    }, [date, onExpire]);

    return <span>{timeLeft}</span>;
  };

  const handlePay = (booking: ConfirmedBooking) => {
    if (!window.confirm(`确认支付订单 ${booking.id} 吗？\n金额：¥${booking.totalPrice}`)) return;

    setActionError(null);
    setActionLoading(true);
    payOrder({
      orderNo: booking.id,
      amount: Number(booking.totalPrice || 0),
      method: 'CARD',
    })
      .then(() => {
        onUpdateBooking(booking);
        alert('支付成功！');
      })
      .catch((e: any) => {
        setActionError(e?.message || '支付失败');
      })
      .finally(() => setActionLoading(false));
  };

  const handleCancelOrder = (booking: ConfirmedBooking) => {
    if (!window.confirm('确定要取消这个订单吗？取消后无法恢复。')) return;

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

  const openApplicationModal = (booking: ConfirmedBooking, type: 'refund' | 'change') => {
    setSelectedBooking(booking);
    setModalType(type);
    setReason('');
    setNewFlight('');
  };

  const submitApplication = () => {
    if (!selectedBooking || !modalType) return;
    if (!reason.trim()) {
      alert('请填写申请原因');
      return;
    }
    if (modalType === 'change' && !newFlight.trim()) {
      alert('请填写期望变更的航班');
      return;
    }

    setActionError(null);
    setActionLoading(true);
    applyRefundChange({
      orderNo: selectedBooking.id,
      operType: modalType === 'refund' ? 1 : 2,
      remark: reason,
      newFlightNo: modalType === 'change' ? newFlight.trim() : undefined,
      newCabinType: modalType === 'change' ? (selectedBooking.flight?.cabinType || 'economy') : undefined,
    })
      .then(() => {
        onUpdateBooking(selectedBooking);
        setModalType(null);
        setSelectedBooking(null);
        alert('申请已提交，请前往【退改/售后】页面查看进度。');
      })
      .catch((e: any) => {
        setActionError(e?.message || '提交失败');
      })
      .finally(() => setActionLoading(false));
  };

  const renderStatusBadge = (booking: ConfirmedBooking) => {
    switch (booking.status) {
      case 'confirmed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle className="w-3.5 h-3.5" /> 出票成功</span>;
      case 'pending_payment':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100">
            <Clock className="w-3.5 h-3.5" /> 待支付 (
            <Countdown
              date={booking.bookingDate}
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
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-600 border border-gray-100"><XCircle className="w-3.5 h-3.5" /> 已取消</span>;
      case 'refunding':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100"><RefreshCw className="w-3.5 h-3.5" /> 退改审核中</span>;
      case 'refunded':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-500 border border-gray-100"><CheckCircle className="w-3.5 h-3.5" /> 已退款</span>;
      case 'changed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100"><CheckCircle className="w-3.5 h-3.5" /> 改签完成</span>;
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
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-all"
            >
              取消订单
            </button>
            <button
              onClick={() => handlePay(booking)}
              disabled={isExpired || actionLoading}
              className={`px-6 py-2 rounded-xl text-white text-sm font-bold transition-all shadow-lg shadow-orange-500/20 ${
                isExpired
                  ? 'bg-gray-300 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
              }`}
            >
              去支付
            </button>
          </div>
        );
      }
      case 'confirmed':
        return (
          <div className="flex gap-3 mt-4 lg:mt-0 lg:ml-auto">
            <button
              onClick={() => openApplicationModal(booking, 'change')}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 hover:text-blue-600 transition-all"
            >
              申请改签
                <button
                  onClick={submitApplication}
                  disabled={actionLoading}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-sm font-bold shadow-lg shadow-sky-500/20 hover:from-sky-600 hover:to-indigo-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {actionLoading ? '提交中...' : '提交申请'}
                </button>
            </button>
            <button
              onClick={() => navigate(`/my-bookings/${booking.id}`, { state: { booking } })}
              className="px-4 py-2 rounded-xl bg-sky-50 text-sky-700 text-sm font-bold hover:bg-sky-100 transition-all"
            >
              详情
            </button>
          </div>
        );
      case 'refunding':
        return (
          <div className="mt-4 lg:mt-0 lg:ml-auto text-right">
             <div className="text-sm text-purple-600 mb-2 font-medium">申请已提交</div>
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
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-all"
            >
              再次预订
            </button>
            <button
              onClick={() => navigate(`/my-bookings/${booking.id}`, { state: { booking } })}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition-all"
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
        <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
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

      <div className="rounded-3xl border border-sky-100 bg-white/90 backdrop-blur shadow-sm">
        <div className="p-6 sm:p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 font-medium">订单数量</div>
                <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/20">
                  <Ticket className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900">{totalCount}</div>
              <div className="mt-1 text-xs text-gray-500">已确认 {confirmedCount} 单</div>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-cyan-50 to-white p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 font-medium">累计支出</div>
                <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <CircleDollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900">¥{totalAmount.toLocaleString()}</div>
              <div className="mt-1 text-xs text-gray-500">含税总价</div>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-blue-50 to-white p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 font-medium">行程概览</div>
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Route className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900">{Math.max(0, totalCount)}</div>
              <div className="mt-1 text-xs text-gray-500">随时查看详情与凭证</div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="mt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex bg-gray-100 p-1 rounded-2xl w-fit overflow-x-auto">
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    statusFilter === opt.id
                      ? 'bg-white text-sky-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="w-full lg:w-auto">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索订单号 / 乘客 / 航线"
                className="w-full lg:w-72 px-4 py-2.5 rounded-2xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            显示 {filteredBookings.length} / {totalCount} 条
          </div>

          {/* Booking List */}
          <div className="mt-4 rounded-3xl border border-gray-100 bg-white overflow-hidden">
            {bookings.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Plane className="w-7 h-7 opacity-40" />
                </div>
                <div className="text-gray-700 font-bold">暂无订单</div>
                <div className="text-sm text-gray-500 mt-1">从首页开始搜索并预订航班</div>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Ticket className="w-7 h-7 opacity-40" />
                </div>
                <div className="text-gray-700 font-bold">暂无匹配订单</div>
                <div className="text-sm text-gray-500 mt-1">尝试切换状态或修改关键词</div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {filteredBookings.map((b) => {
                  const flights = b.flights && b.flights.length > 0 ? b.flights : b.flight ? [b.flight] : [];
                  const first = flights[0];
                  const last = flights[flights.length - 1];

                  return (
                    <li key={b.id} className="p-6 sm:p-7 hover:bg-gray-50/50 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3 flex-wrap mb-3">
                            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full font-mono">
                              {b.id}
                            </span>
                            {renderStatusBadge(b)}
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> {formatDateTime(b.bookingDate)}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 min-w-0">
                            <div className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                              {first?.origin || '-'} → {last?.destination || '-'}
                            </div>
                            <div className="text-lg font-bold text-gray-900 ml-4">
                              ¥{(b.totalPrice || 0).toLocaleString()}
                            </div>
                          </div>
                          
                           <div className="mt-1 text-sm text-gray-500">
                            乘客: {b.passengerName}
                          </div>
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

      {/* Refund/Change Modal */}
      {modalType && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-8 animate-scale-up">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {modalType === 'refund' ? '申请退票' : '申请改签'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              订单号: <span className="font-mono text-gray-700">{selectedBooking.id}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {modalType === 'refund' ? '退票原因' : '改签原因'}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="请详细描述您的原因..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[100px]"
                />
              </div>

              {modalType === 'change' && (
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">
                    期望变更的航班
                  </label>
                  <input
                    value={newFlight}
                    onChange={(e) => setNewFlight(e.target.value)}
                    placeholder="例如：2025-01-01 CA1234"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              )}

              <div className="bg-blue-50 text-blue-800 text-xs p-4 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  提交申请后，您的订单将被锁定。请前往“退改/售后”页面查看审核进度。审核通过后，款项将原路退回或完成改签。
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <button
                onClick={() => setModalType(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all"
              >
                取消
              </button>
              <button
                onClick={submitApplication}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
              >
                提交申请
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserBookings;
