import React from 'react';
import { INITIAL_BOOKINGS } from '../../services/mockData';

const BookingsMgmt: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-800">订单管理</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
           <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs">
             <tr>
               <th className="px-6 py-4">订单号</th>
               <th className="px-6 py-4">客户</th>
               <th className="px-6 py-4">航班</th>
               <th className="px-6 py-4">金额</th>
               <th className="px-6 py-4">状态</th>
             </tr>
           </thead>
           <tbody>
             {INITIAL_BOOKINGS.map(b => (
               <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                 <td className="px-6 py-4 font-medium">{b.id}</td>
                 <td className="px-6 py-4">
                    <div>{b.customer.name}</div>
                    <div className="text-xs text-gray-400">{b.customer.email}</div>
                 </td>
                 <td className="px-6 py-4">{b.flight}</td>
                 <td className="px-6 py-4 font-bold">¥{b.amount}</td>
                 <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        b.status === 'paid' ? 'bg-green-100 text-green-700' : 
                        b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-gray-100 text-gray-600'
                    }`}>
                        {b.status}
                    </span>
                 </td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingsMgmt;
