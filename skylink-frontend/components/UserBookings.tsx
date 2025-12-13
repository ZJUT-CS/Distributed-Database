
import React from 'react';
import { ConfirmedBooking } from '../types';
import { Plane, Calendar, User as UserIcon, Ticket, Download, ArrowRight, Clock, MapPin } from 'lucide-react';

interface UserBookingsProps {
  bookings: ConfirmedBooking[];
  onBack: () => void;
}

const UserBookings: React.FC<UserBookingsProps> = ({ bookings, onBack }) => {
  return (
    <div className="mt-8 animate-fade-in-up max-w-5xl mx-auto pb-20">
       <div className="flex items-center justify-between mb-8">
         <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20 text-white">
                <Ticket className="w-6 h-6" />
              </div>
              我的行程
            </h2>
            <p className="text-gray-500 mt-2 text-sm">查看并管理您的过往及未来航班订单</p>
         </div>
         <button onClick={onBack} className="text-gray-600 hover:text-gray-900 font-medium text-sm bg-white px-5 py-2.5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex items-center gap-2">
           <ArrowRight className="w-4 h-4 rotate-180" /> 返回搜索
         </button>
       </div>

       {bookings.length === 0 ? (
         <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-gray-100 dashed-border">
           <div className="bg-blue-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
             <Plane className="w-10 h-10 text-blue-300 rotate-[-45deg]" />
           </div>
           <h3 className="text-xl font-bold text-gray-900">暂无行程记录</h3>
           <p className="text-gray-400 mt-2 max-w-xs mx-auto">世界那么大，快去挑选您的第一个目的地吧！</p>
           <button onClick={onBack} className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all hover:-translate-y-1">
             开始预订
           </button>
         </div>
       ) : (
         <div className="space-y-6">
           {bookings.map((booking) => {
             const depDate = new Date(booking.flight.departureTime);
             const arrDate = new Date(booking.flight.arrivalTime);
             const isConfirmed = booking.status === 'confirmed';

             return (
               <div key={booking.id} className="group bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 relative">
                 {/* Top Status Bar */}
                 <div className={`h-2 w-full ${isConfirmed ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gray-300'}`}></div>
                 
                 <div className="flex flex-col lg:flex-row">
                    {/* Left: Main Flight Info */}
                    <div className="flex-1 p-6 lg:p-8 relative">
                       {/* Header */}
                       <div className="flex justify-between items-start mb-8">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-lg font-bold text-gray-700 border border-gray-100">
                               {booking.flight.airlineCode}
                             </div>
                             <div>
                                <h4 className="font-bold text-gray-900 text-lg">{booking.flight.airline}</h4>
                                <div className="flex items-center gap-2 text-xs text-gray-500 font-mono mt-0.5">
                                   <span className="bg-gray-100 px-1.5 py-0.5 rounded">{booking.flight.flightNumber}</span>
                                   <span>•</span>
                                   <span>{booking.flight.aircraft || 'A320'}</span>
                                </div>
                             </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                             isConfirmed ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-100 text-gray-500 border-gray-200'
                           }`}>
                             {isConfirmed ? '已出票' : '已取消'}
                          </div>
                       </div>

                       {/* Flight Route Visual */}
                       <div className="flex items-center justify-between gap-4">
                          <div className="text-left min-w-[80px]">
                             <div className="text-3xl font-bold text-gray-900">{depDate.toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'})}</div>
                             <div className="text-sm font-medium text-gray-500 mt-1">{booking.flight.origin}</div>
                             <div className="text-xs text-gray-400 mt-0.5">{depDate.toLocaleDateString('zh-CN')}</div>
                          </div>

                          <div className="flex-1 flex flex-col items-center px-4 relative">
                             <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                               <Clock className="w-3 h-3" /> {booking.flight.duration}
                             </div>
                             <div className="w-full h-[2px] bg-gray-200 relative flex items-center">
                                <div className="w-2 h-2 rounded-full bg-gray-300 absolute left-0"></div>
                                <div className="flex-1 bg-gray-200"></div>
                                <Plane className="w-5 h-5 text-blue-500 absolute left-1/2 -translate-x-1/2 rotate-90 bg-white px-1" />
                                <div className="w-2 h-2 rounded-full bg-gray-300 absolute right-0"></div>
                             </div>
                             <div className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-2">
                               {booking.flight.stops === 0 ? '直飞' : '经停'}
                             </div>
                          </div>

                          <div className="text-right min-w-[80px]">
                             <div className="text-3xl font-bold text-gray-900">{arrDate.toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'})}</div>
                             <div className="text-sm font-medium text-gray-500 mt-1">{booking.flight.destination}</div>
                             <div className="text-xs text-gray-400 mt-0.5">{arrDate.toLocaleDateString('zh-CN')}</div>
                          </div>
                       </div>
                    </div>

                    {/* Divider (Perforated Line Effect) */}
                    <div className="relative w-full lg:w-px h-px lg:h-auto bg-gray-200 lg:my-4">
                       <div className="absolute -left-3 lg:left-1/2 lg:-translate-x-1/2 top-1/2 lg:-top-3 -translate-y-1/2 lg:translate-y-0 w-6 h-6 bg-gray-50 rounded-full border border-gray-100 z-10"></div>
                       <div className="absolute -right-3 lg:left-1/2 lg:-translate-x-1/2 top-1/2 lg:-bottom-3 -translate-y-1/2 lg:translate-y-0 w-6 h-6 bg-gray-50 rounded-full border border-gray-100 z-10"></div>
                       {/* Dashes */}
                       <div className="absolute inset-0 flex lg:flex-col items-center justify-center gap-2 overflow-hidden py-4 px-4">
                          {[...Array(12)].map((_,i) => <div key={i} className="w-2 h-1 lg:w-1 lg:h-2 bg-gray-300 rounded-full"></div>)}
                       </div>
                    </div>

                    {/* Right: Passenger & Action */}
                    <div className="w-full lg:w-80 bg-gray-50/50 p-6 lg:p-8 flex flex-col justify-between">
                       <div className="space-y-4">
                          <div>
                             <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">乘客姓名</span>
                             <div className="flex items-center gap-2 mt-1">
                                <div className="bg-gray-200 p-1.5 rounded-full text-gray-500"><UserIcon className="w-3.5 h-3.5" /></div>
                                <span className="font-bold text-gray-800">{booking.passengerName}</span>
                             </div>
                          </div>
                          <div>
                             <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">订单编号</span>
                             <div className="font-mono text-sm text-gray-600 mt-1 bg-white border border-gray-200 px-2 py-1 rounded w-fit">
                                {booking.id}
                             </div>
                          </div>
                          <div>
                             <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">实付金额</span>
                             <div className="text-xl font-bold text-gray-900 mt-1">
                                ¥{(booking.totalPrice || booking.flight.price).toLocaleString()}
                             </div>
                          </div>
                       </div>

                       <button className="mt-6 w-full py-3 border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">
                          <Download className="w-4 h-4" /> 下载电子登机牌
                       </button>
                    </div>
                 </div>
               </div>
             );
           })}
         </div>
       )}
    </div>
  );
};

export default UserBookings;
