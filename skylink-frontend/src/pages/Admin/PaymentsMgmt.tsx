import React from 'react';
import { INITIAL_TRANSACTIONS, INITIAL_GATEWAYS } from '../../services/mockData';

const PaymentsMgmt: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">支付网关</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {INITIAL_GATEWAYS.map(g => (
                <div key={g.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${g.color}`}>
                            {g.name[0]}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${g.status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {g.status ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <h3 className="font-bold text-gray-800">{g.name}</h3>
                    <div className="mt-2 text-xs text-gray-500 flex justify-between">
                        <span>费率: {g.fee}</span>
                        <span>周期: {g.cycle}</span>
                    </div>
                </div>
            ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">交易流水</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs">
                <tr>
                <th className="px-6 py-4">流水号</th>
                <th className="px-6 py-4">用户</th>
                <th className="px-6 py-4">类型</th>
                <th className="px-6 py-4">金额</th>
                <th className="px-6 py-4">状态</th>
                <th className="px-6 py-4">时间</th>
                </tr>
            </thead>
            <tbody>
                {INITIAL_TRANSACTIONS.map(t => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono">{t.id}</td>
                    <td className="px-6 py-4">{t.user}</td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs ${t.type === 'payment' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                            {t.type}
                        </span>
                    </td>
                    <td className={`px-6 py-4 font-bold ${t.type === 'refund' ? 'text-red-600' : 'text-gray-900'}`}>
                        {t.type === 'refund' ? '-' : '+'}¥{t.amount}
                    </td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            t.status === 'success' ? 'bg-green-50 text-green-600' :
                            t.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'
                        }`}>
                            {t.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">{t.time}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentsMgmt;
