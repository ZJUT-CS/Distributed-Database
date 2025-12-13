import React from 'react';
import { ConfirmedBooking } from '../../types';
import { ArrowLeft, Plane, Calendar, CheckCircle } from 'lucide-react';

interface UserBookingsProps {
  bookings: ConfirmedBooking[];
  onBack: () => void;
}

const UserBookings: React.FC<UserBookingsProps> = ({ bookings, onBack }) => {
  return (
    <div className="animate-fade-in-up mt-10 max-w-4xl mx-auto mb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-sm text-gray-600 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">我的订单</h2>
            <p className="text-gray-500 text-sm">查看已预订的航班与行程</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {bookings.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Plane className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>暂无订单</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {bookings.map((b) => (
              <li key={b.id} className="p-6 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{b.id}</span>
                    <span className="text-xs text-gray-400">乘客：{b.passengerName}</span>
                  </div>
                  <div className="text-gray-900 font-bold flex items-center gap-2">
                    <Plane className="w-4 h-4 text-blue-600" />
                    <span>
                      {b.flights?.[0]?.origin} → {b.flights?.[b.flights.length - 1]?.destination}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(b.bookingDate).toLocaleString('zh-CN')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-gray-900 font-bold">¥{(b.totalPrice || 0).toLocaleString()}</div>
                  <div className="text-xs text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded inline-flex items-center gap-1 mt-1">
                    <CheckCircle className="w-3 h-3" /> 已确认
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default UserBookings;

