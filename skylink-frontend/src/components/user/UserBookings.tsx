import React from 'react';
import { ConfirmedBooking } from '../../types';
import { ArrowLeft, Plane, Calendar, CheckCircle, XCircle, Route, Ticket, CircleDollarSign } from 'lucide-react';

interface UserBookingsProps {
  bookings: ConfirmedBooking[];
  onBack: () => void;
}

const UserBookings: React.FC<UserBookingsProps> = ({ bookings, onBack }) => {
  const totalCount = bookings.length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const totalAmount = bookings.reduce((acc, b) => acc + (b.totalPrice || 0), 0);

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('zh-CN');
  };

  return (
    <div className="animate-fade-in-up mt-8 max-w-7xl mx-auto mb-20 px-4 sm:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-50 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-indigo-50 blur-3xl" />

        <div className="relative p-6 sm:p-8">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-sm text-gray-600 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">我的订单</h2>
                <p className="text-gray-500 text-sm mt-1">管理已预订的航班与行程</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-blue-50 to-white p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 font-medium">订单数量</div>
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Ticket className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900">{totalCount}</div>
              <div className="mt-1 text-xs text-gray-500">已确认 {confirmedCount} 单</div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-emerald-50 to-white p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 font-medium">累计支出</div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <CircleDollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900">¥{totalAmount.toLocaleString()}</div>
              <div className="mt-1 text-xs text-gray-500">含税总价</div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-indigo-50 to-white p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 font-medium">行程概览</div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Route className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900">{Math.max(0, totalCount)}</div>
              <div className="mt-1 text-xs text-gray-500">随时查看详情与凭证</div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-gray-100 bg-white overflow-hidden">
            {bookings.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Plane className="w-7 h-7 opacity-40" />
                </div>
                <div className="text-gray-700 font-bold">暂无订单</div>
                <div className="text-sm text-gray-500 mt-1">从首页开始搜索并预订航班</div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {bookings.map((b) => {
                  const flights = b.flights && b.flights.length > 0 ? b.flights : b.flight ? [b.flight] : [];
                  const first = flights[0];
                  const last = flights[flights.length - 1];
                  const isConfirmed = b.status === 'confirmed';

                  return (
                    <li key={b.id} className="p-6 sm:p-7">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
                              {b.id}
                            </span>
                            <span className="text-xs text-gray-500">乘客：{b.passengerName}</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> {formatDateTime(b.bookingDate)}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center gap-3 min-w-0">
                            <div className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                              {first?.origin || '-'} → {last?.destination || '-'}
                            </div>
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${
                                isConfirmed
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : 'bg-red-50 text-red-700 border-red-100'
                              }`}
                            >
                              {isConfirmed ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                              {isConfirmed ? '已确认' : '已取消'}
                            </span>
                          </div>

                          {flights.length > 0 && (
                            <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-100 p-4">
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">航段</div>
                              <div className="mt-3 space-y-2">
                                {flights.map((f, idx) => (
                                  <div
                                    key={`${b.id}-${idx}-${f.id}`}
                                    className="flex items-center justify-between gap-4 rounded-xl bg-white border border-slate-100 px-3 py-2"
                                  >
                                    <div className="min-w-0">
                                      <div className="text-sm font-bold text-slate-900 truncate">
                                        {f.origin} → {f.destination}
                                      </div>
                                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                                        {f.flightNumber || f.id}
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <div className="text-xs text-slate-500">{formatTime(f.departureTime)} - {formatTime(f.arrivalTime)}</div>
                                      <div className="text-xs text-slate-400">{f.duration}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 lg:text-right flex lg:flex-col items-start lg:items-end gap-3">
                          <div>
                            <div className="text-2xl font-bold text-gray-900">¥{(b.totalPrice || 0).toLocaleString()}</div>
                            <div className="text-xs text-gray-500">含税总价</div>
                          </div>
                          <button className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors">
                            查看详情
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserBookings;

