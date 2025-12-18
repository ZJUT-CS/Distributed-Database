import React, { useEffect, useMemo, useState } from 'react';
import { Search, Eye, Filter, Download, XCircle } from 'lucide-react';
import { cancelAdminOrder, listAdminOrders, type AdminOrderItem } from '../../services/adminOrders';
import Pagination from './components/Pagination';
import TableActionMenu from './components/TableActionMenu';

const BookingsMgmt: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 8;

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AdminOrderItem[]>([]);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  const normalizedSearch = useMemo(() => searchTerm.trim(), [searchTerm]);

  const load = async (nextPage: number) => {
    setLoading(true);
    try {
      const orderNo = normalizedSearch && /^\d+$/.test(normalizedSearch) ? normalizedSearch : undefined;
      const orderStatus =
        statusFilter === 'paid' ? 1 : statusFilter === 'pending' ? 0 : statusFilter === 'cancelled' ? 2 : undefined;

      const res = await listAdminOrders({
        page: nextPage,
        size: ITEMS_PER_PAGE,
        orderNo,
        orderStatus,
      });
      setItems(res.items || []);
      setTotal(res.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
  }, [page, normalizedSearch, statusFilter]);

  const mapStatusLabel = (s?: number | null) => {
    if (s === 1) return { id: 'paid', label: '已支付' };
    if (s === 0) return { id: 'pending', label: '待支付' };
    if (s === 2) return { id: 'cancelled', label: '已取消' };
    if (s === 3) return { id: 'refunded', label: '已退款' };
    return { id: 'other', label: '其他' };
  };

  const handleCancel = async (orderNo: number) => {
    if (!confirm('确定要取消该订单吗？')) return;
    setLoading(true);
    try {
      await cancelAdminOrder(orderNo);
      await load(page);
    } catch (e: any) {
      alert(e?.message || '取消失败');
    } finally {
      setLoading(false);
    }
  };

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
                placeholder="搜索订单号（数字）..." 
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full transition-all"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
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
                {items.map((b) => {
                  const st = mapStatusLabel(b.orderStatus);
                  const route = b.origin && b.destination ? `${b.origin} → ${b.destination}` : '-';
                  const customerName = b.passengerName || (b.userId != null ? `用户#${b.userId}` : '-');
                  return (
                <tr key={String(b.orderNo)} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4 font-mono text-gray-600">{b.orderNo}</td>
                    <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{customerName}</div>
                        <div className="text-xs text-gray-400">{b.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs font-bold">{b.flightNo || '-'}</span>
                            <span className="text-xs text-gray-400">{route}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">¥{Number(b.totalAmount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            st.id === 'paid' ? 'bg-green-50 text-green-700' : 
                            st.id === 'pending' ? 'bg-yellow-50 text-yellow-700' : 
                            'bg-gray-100 text-gray-600'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                                st.id === 'paid' ? 'bg-green-500' : 
                                st.id === 'pending' ? 'bg-yellow-500' : 
                                'bg-gray-400'
                            }`}></span>
                            {st.label}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <TableActionMenu
                          isOpen={activeActionId === String(b.orderNo)}
                          onToggle={(e) => { e.stopPropagation(); setActiveActionId(activeActionId === String(b.orderNo) ? null : String(b.orderNo)); }}
                          onClose={() => setActiveActionId(null)}
                        >
                            <button
                              onClick={() => alert(`订单号：${b.orderNo}\n航班：${b.flightNo || '-'}\n金额：${b.totalAmount || 0}\n状态：${st.label}`)}
                              className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                                <Eye className="w-3.5 h-3.5 text-blue-500" /> 查看详情
                            </button>
                            <button className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <Download className="w-3.5 h-3.5 text-gray-500" /> 下载票据
                            </button>
                            <div className="h-px bg-gray-100 my-0"></div>
                            <button
                              onClick={() => handleCancel(b.orderNo)}
                              disabled={b.orderStatus !== 0}
                              className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-40"
                            >
                                <XCircle className="w-3.5 h-3.5" /> 取消订单
                            </button>
                        </TableActionMenu>
                    </td>
                </tr>
                )})}
                {!loading && items.length === 0 && (
                  <tr>
                    <td className="px-6 py-10 text-center text-sm text-gray-400" colSpan={6}>
                      暂无数据
                    </td>
                  </tr>
                )}
            </tbody>
            </table>
        </div>
        
        {/* Pagination */}
        <Pagination 
          currentPage={page}
          totalPages={totalPages}
          setPage={setPage}
          totalItems={total}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>
    </div>
  );
};

export default BookingsMgmt;
