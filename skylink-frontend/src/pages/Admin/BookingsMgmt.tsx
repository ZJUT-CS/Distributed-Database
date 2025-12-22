import React, { useEffect, useMemo, useState } from 'react';
import { Search, Eye, Download, XCircle, ShoppingCart } from 'lucide-react';
import { cancelAdminOrder, listAdminOrders, type AdminOrderItem } from '../../features/admin/api/orders';
import { Pagination, TableActionMenu, AdminBadge, AdminPageHeader } from '@/features/admin';

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
      setItems(res.data || []);
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

  const handleCancel = async (orderNo: string | number) => {
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
      <AdminPageHeader
        icon={ShoppingCart}
        iconClassName="text-indigo-500"
        title="订单管理"
        description="查看与管理所有航班预订订单"
        actions={
          <button className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center gap-2">
            <Download className="w-4 h-4" /> 导出数据
          </button>
        }
      />

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 md:max-w-md w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
                type="text" 
                placeholder="搜索订单号（数字）..." 
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
            />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
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
                 className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all whitespace-nowrap ${statusFilter === status.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
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
            <thead className="bg-gray-50/80">
                <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">订单号</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">客户</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">航班</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">金额</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {items.map((b) => {
                  const st = mapStatusLabel(b.orderStatus);
                  const route = b.origin && b.destination ? `${b.origin} → ${b.destination}` : '-';
                  const customerName = b.passengerName || (b.userId != null ? `用户#${b.userId}` : '-');
                  return (
                <tr key={String(b.orderNo)} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4 font-mono text-gray-600">{b.orderNo}</td>
                    <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{customerName}</div>
                        <div className="text-xs text-gray-400">{b.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <AdminBadge size="sm" variant="info">
                              {b.flightNo || '-'}
                            </AdminBadge>
                            <span className="text-xs text-gray-400">{route}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">¥{Number(b.totalAmount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <AdminBadge
                        dot
                        variant={st.id === 'paid' ? 'success' : st.id === 'pending' ? 'warning' : 'neutral'}
                      >
                        {st.label}
                      </AdminBadge>
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
                                <Eye className="w-3.5 h-3.5 text-indigo-500" /> 查看详情
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
                    <td className="px-6 py-12 text-center text-sm text-gray-400" colSpan={6}>
                      暂无订单数据
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
