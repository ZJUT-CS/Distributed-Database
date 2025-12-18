import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import UserBookings from '../../components/user/UserBookings';
import { useAuth } from '../../hooks/useAuth';
import { ConfirmedBooking } from '../../types';
import { ArrowLeft, Calendar, CheckCircle, Plane, Route, Ticket, XCircle, RefreshCw, Clock } from 'lucide-react';
import { listBookings } from '../../services/bookings';
import { confirmPayment, createPaymentConfirmToken, type PaymentConfirmToken } from '../../services/payments';
import { cancelOrder } from '../../services/orders';

const pad2 = (n: number) => String(n).padStart(2, '0');

const formatLocalYmd = (d: Date) => {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const getPaymentDeadlineMs = (bookingDate: string) => {
  return new Date(bookingDate).getTime() + 30 * 60 * 1000;
};

const BookingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<ConfirmedBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
     if (!user?.id) return;
     setLoading(true);
     setError(null);
     listBookings(user.id)
       .then(setBookings)
       .catch((e: any) => setError(e?.message || '加载订单失败'))
       .finally(() => setLoading(false));
  }, [user]);

  const handleUpdateBooking = (updated: ConfirmedBooking) => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    listBookings(user.id)
      .then(setBookings)
      .catch((e: any) => setError(e?.message || '刷新订单失败'))
      .finally(() => setLoading(false));
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <UserBookings bookings={bookings} onBack={() => navigate('/')} onUpdateBooking={handleUpdateBooking} />
      {loading && (
        <div className="mt-4 text-sm text-gray-500">加载中...</div>
      )}
    </div>
  );
};

export default BookingsPage;

export const BookingDetailsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    listBookings(user.id)
      .then((all) => {
        const found = all.find((b) => b.id === id);
        if (found) setBooking(found);
        else setBooking(null);
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
          cancelOrder(booking.id)
            .then(() => {
              if (user?.id) {
                return listBookings(user.id).then((all) => {
                  const found = all.find((b) => b.id === booking.id);
                  if (found) setBooking(found);
                });
              }
            })
            .catch(() => {
              setBooking({ ...booking, status: 'cancelled' });
            });
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
        <div className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="p-6 flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/my-bookings')}
              className="p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-sm text-gray-600 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="text-xl font-bold text-gray-900">订单不存在或已过期</div>
              <div className="text-sm text-gray-500 mt-1">返回我的订单查看最新数据</div>
              {detailError && <div className="text-sm text-red-600 mt-2">{detailError}</div>}
              {detailLoading && <div className="text-sm text-gray-500 mt-2">加载中...</div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const flights = booking.flights && booking.flights.length > 0 ? booking.flights : booking.flight ? [booking.flight] : [];
  const first = flights[0];
  const last = flights[flights.length - 1];
  const isConfirmed = booking.status === 'confirmed';

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('zh-CN');
  };

  const handleRefundChange = () => {
    if (window.confirm('是否申请退改签服务？\n\n提交申请后，请在“退改/售后”页面查看进度。')) {
      navigate('/refunds-help');
    }
  };

  const renderStatusBadge = () => {
    if (!booking) return null;
    switch (booking.status) {
      case 'confirmed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle className="w-3.5 h-3.5" /> 出票成功</span>;
      case 'pending_payment':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100">
            <Clock className="w-3.5 h-3.5" /> 待支付 ({payTimeLeft || '00:00'})
          </span>
        );
      case 'cancelled':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-50 text-gray-600 border border-gray-100"><XCircle className="w-3.5 h-3.5" /> 已取消</span>;
      case 'refunding':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100"><RefreshCw className="w-3.5 h-3.5" /> 退改审核中</span>;
      case 'refunded':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-50 text-gray-500 border border-gray-100"><CheckCircle className="w-3.5 h-3.5" /> 已退款</span>;
      case 'changed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100"><CheckCircle className="w-3.5 h-3.5" /> 改签完成</span>;
      default:
        return null;
    }
  };

  const handlePay = () => {
    const expired = Date.now() >= getPaymentDeadlineMs(booking.bookingDate);
    if (expired) {
      cancelOrder(booking.id)
        .then(() => {
          if (user?.id) {
            return listBookings(user.id).then((all) => {
              const found = all.find((b) => b.id === booking.id);
              if (found) setBooking(found);
            });
          }
        })
        .catch(() => setBooking({ ...booking, status: 'cancelled' }));
      alert('订单已超时，已自动取消');
      return;
    }
    setPayPreparing(true);
    setPayError(null);
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
        if (user?.id) {
          return listBookings(user.id).then((all) => {
            const found = all.find((b) => b.id === booking.id);
            if (found) setBooking(found);
          });
        }
      })
      .then(() => {
        closePayModal();
        alert('支付成功！');
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
            className="p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-sm text-gray-600 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">订单详情</h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-gray-500 text-sm">{booking.id}</p>
              {renderStatusBadge()}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {booking.status === 'confirmed' && (
            <button
              onClick={handleRefundChange}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 hover:text-red-600 transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              申请退改
            </button>
          )}
          {booking.status === 'pending_payment' && (
             <button
              onClick={handlePay}
              disabled={Date.now() >= getPaymentDeadlineMs(booking.bookingDate) || payPreparing}
              className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-all shadow-lg shadow-orange-500/20 ${
                Date.now() >= getPaymentDeadlineMs(booking.bookingDate) || payPreparing
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

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-blue-50 to-white p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 font-medium">航线</div>
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Route className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-lg font-bold text-gray-900 truncate">
                {first?.origin || '-'} → {last?.destination || '-'}
              </div>
              <div className="mt-1 text-xs text-gray-500">共 {flights.length || 0} 段</div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-emerald-50 to-white p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 font-medium">乘客</div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Ticket className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-lg font-bold text-gray-900 truncate">{booking.passengerName}</div>
              <div className="mt-1 text-xs text-gray-500">{booking.contactEmail || '-'}</div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-indigo-50 to-white p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 font-medium">价格</div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Plane className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900">¥{(booking.totalPrice || 0).toLocaleString()}</div>
              <div className="mt-1 text-xs text-gray-500">含税总价</div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-gray-100 bg-white overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-gray-900">航段信息</div>
                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {formatDateTime(booking.bookingDate)}
                </div>
              </div>
            </div>

            <div className="p-6">
              {flights.length === 0 ? (
                <div className="text-sm text-gray-500">暂无航段信息</div>
              ) : (
                <div className="space-y-3">
                  {flights.map((f, idx) => (
                    <div
                      key={`${booking.id}-${idx}-${f.id}`}
                      className="rounded-2xl border border-slate-100 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {f.origin} → {f.destination}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-1">{f.flightNumber || f.id}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatTime(f.departureTime)} - {formatTime(f.arrivalTime)}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{f.duration}</div>
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
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
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
              {payError && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{payError}</div>}

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-xs text-gray-500">订单号</div>
                <div className="font-mono text-sm text-gray-800 mt-1 break-all">{booking.id}</div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500">支付金额</div>
                    <div className="text-lg font-extrabold text-gray-900 mt-0.5">¥{Number(booking.totalPrice || 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">支付方式</div>
                    <div className="text-sm font-bold text-gray-900 mt-1">银行卡/信用卡</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="text-sm font-bold text-gray-900">行程摘要</div>
                <div className="text-sm text-gray-600 mt-2">
                  {first?.origin || '-'} → {last?.destination || '-'}（{flights.length || 0} 段）
                </div>
                <div className="text-xs text-gray-500 mt-1">乘客：{booking.passengerName}</div>
              </div>

              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 text-xs text-orange-800">
                支付确认令牌有效期 30 分钟，且仅可使用一次。
              </div>
            </div>

            <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
              <button
                type="button"
                onClick={closePayModal}
                disabled={payConfirming}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
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
