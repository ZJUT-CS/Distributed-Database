import React, { useState } from 'react';
import { Search, Eye, Filter, Download, XCircle } from 'lucide-react';
import { INITIAL_BOOKINGS } from '../../services/mockData';
import Pagination from './components/Pagination';
import TableActionMenu from './components/TableActionMenu';

const BookingsMgmt: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 8;

  const filteredBookings = INITIAL_BOOKINGS.filter(b => 
    (statusFilter === 'all' || b.status === statusFilter) &&
    (b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.customer.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = filteredBookings.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">订单管理</h2>
           <p className="text-gray-500 mt-1 text-sm">查看与管理所有航班预订订单</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">
            <Download className="w-4 h-4" /> 导出列表
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 md:max-w-md w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
                type="text" 
                placeholder="搜索订单号、客户姓名..." 
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
                { id: 'paid', label: '已支付' },
                { id: 'pending', label: '待支付' },
                { id: 'cancelled', label: '已取消' }
              ].map(status => (
                <button 
                 key={status.id}
                 onClick={() => { setStatusFilter(status.id); setPage(1); }}
                 className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all whitespace-nowrap ${statusFilter === status.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {status.label}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                <th className="px-6 py-4">订单号</th>
                <th className="px-6 py-4">客户</th>
                <th className="px-6 py-4">航班</th>
                <th className="px-6 py-4">金额</th>
                <th className="px-6 py-4">状态</th>
                <th className="px-6 py-4 text-right">操作</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {paginatedBookings.map(b => (
                <tr key={b.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4 font-mono text-gray-600">{b.id}</td>
                    <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{b.customer.name}</div>
                        <div className="text-xs text-gray-400">{b.customer.email}</div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs font-bold">{b.flight}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">¥{b.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            b.status === 'paid' ? 'bg-green-50 text-green-700' : 
                            b.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 
                            'bg-gray-100 text-gray-600'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                                b.status === 'paid' ? 'bg-green-500' : 
                                b.status === 'pending' ? 'bg-yellow-500' : 
                                'bg-gray-400'
                            }`}></span>
                            {b.status === 'paid' ? '已支付' : b.status === 'pending' ? '待支付' : '已取消'}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <TableActionMenu
                          isOpen={activeActionId === b.id}
                          onToggle={(e) => { e.stopPropagation(); setActiveActionId(activeActionId === b.id ? null : b.id); }}
                          onClose={() => setActiveActionId(null)}
                        >
                            <button className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <Eye className="w-3.5 h-3.5 text-blue-500" /> 查看详情
                            </button>
                            <button className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <Download className="w-3.5 h-3.5 text-gray-500" /> 下载票据
                            </button>
                            <div className="h-px bg-gray-100 my-0"></div>
                            <button className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2">
                                <XCircle className="w-3.5 h-3.5" /> 取消订单
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
          totalItems={filteredBookings.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>
    </div>
  );
};

export default BookingsMgmt;
