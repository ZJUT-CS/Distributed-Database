import React, { useState } from 'react';
import { Search, Download, Eye, MoreHorizontal, Filter, AlertCircle, FileText } from 'lucide-react';
import { INITIAL_TRANSACTIONS, INITIAL_GATEWAYS } from '../../services/mockData';
import Pagination from './components/Pagination';
import TableActionMenu from './components/TableActionMenu';

const PaymentsMgmt: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 8;

  const filteredTransactions = INITIAL_TRANSACTIONS.filter(t => 
    (typeFilter === 'all' || t.type === typeFilter) &&
    (t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.user.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">支付管理</h2>
           <p className="text-gray-500 mt-1">管理支付网关与查看交易流水</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">
            <Download className="w-4 h-4" /> 导出报表
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 md:max-w-md w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
                type="text" 
                placeholder="搜索流水号、用户..." 
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
           <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm whitespace-nowrap">
             <Filter className="w-4 h-4" />
             <span className="hidden sm:inline">筛选</span>
           </button>
           <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
           <div className="flex bg-gray-100 p-1 rounded-lg">
              {[
                { id: 'all', label: '全部' },
                { id: 'payment', label: '支付' },
                { id: 'refund', label: '退款' }
              ].map(type => (
                <button 
                 key={type.id}
                 onClick={() => { setTypeFilter(type.id); setPage(1); }}
                 className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all whitespace-nowrap ${typeFilter === type.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {type.label}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* Gateways */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {INITIAL_GATEWAYS.map(g => (
            <div key={g.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shadow-lg ${g.color}`}>
                        {g.name[0]}
                    </div>
                    <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${g.status ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                            {g.status ? '运行中' : '已停用'}
                        </span>
                        <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <h3 className="font-bold text-gray-800 text-lg">{g.name}</h3>
                <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-4 text-xs">
                    <div>
                        <span className="text-gray-400 block mb-1">费率</span>
                        <span className="font-semibold text-gray-700 text-sm">{g.fee}</span>
                    </div>
                    <div>
                        <span className="text-gray-400 block mb-1">结算周期</span>
                        <span className="font-semibold text-gray-700 text-sm">{g.cycle}</span>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-lg text-gray-800">交易流水</h3>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-gray-500 font-medium">
                <tr>
                <th className="px-6 py-4">流水号</th>
                <th className="px-6 py-4">用户</th>
                <th className="px-6 py-4">类型</th>
                <th className="px-6 py-4">金额</th>
                <th className="px-6 py-4">状态</th>
                <th className="px-6 py-4">时间</th>
                <th className="px-6 py-4 text-right">操作</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {paginatedTransactions.map(t => (
                <tr key={t.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4 font-mono text-gray-600">{t.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{t.user}</td>
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            t.type === 'payment' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                        }`}>
                            {t.type === 'payment' ? '支付' : '退款'}
                        </span>
                    </td>
                    <td className={`px-6 py-4 font-bold ${t.type === 'refund' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {t.type === 'refund' ? '-' : '+'}¥{t.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            t.status === 'success' ? 'bg-green-50 text-green-700' :
                            t.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                                t.status === 'success' ? 'bg-green-500' :
                                t.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></span>
                            {t.status === 'success' ? '成功' : t.status === 'pending' ? '处理中' : '失败'}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">{t.time}</td>
                    <td className="px-6 py-4 text-right">
                        <TableActionMenu
                          isOpen={activeActionId === t.id}
                          onToggle={(e) => { e.stopPropagation(); setActiveActionId(activeActionId === t.id ? null : t.id); }}
                          onClose={() => setActiveActionId(null)}
                        >
                            <button className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <Eye className="w-3.5 h-3.5 text-blue-500" /> 查看详情
                            </button>
                            <button className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-gray-500" /> 电子回单
                            </button>
                            <div className="h-px bg-gray-100 my-0"></div>
                            <button className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2">
                                <AlertCircle className="w-3.5 h-3.5" /> 申诉交易
                            </button>
                        </TableActionMenu>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        
        {/* Pagination */}
        <Pagination 
          currentPage={page}
          totalPages={totalPages}
          setPage={setPage}
          totalItems={filteredTransactions.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>
    </div>
  );
};

export default PaymentsMgmt;