import React, { useState, useEffect, useCallback } from 'react';
import { Download, Eye, FileText, CreditCard, Wallet, Search, RefreshCw } from 'lucide-react';
import { Pagination, TableActionMenu, AdminBadge, AdminPageHeader, FilterBar, AdminTableState, PAYMENT_STATUS_OPTIONS, PAYMENT_STATUS_MAP, PAYMENT_METHOD_MAP } from '@/features/admin';
import { listPayments, type PaymentItem, type PaymentSearchParams } from '@/features/admin/api/payments';
import EntityCell from '@/components/common/EntityCell';
import { formatApiError } from '@/utils/apiError';

const PaymentsMgmt: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | ''>('');
  const [page, setPage] = useState(1);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 10;

  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: PaymentSearchParams = {};
      if (searchTerm) {
        // 尝试解析为订单号
        const orderNo = parseInt(searchTerm, 10);
        if (!isNaN(orderNo)) {
          params.orderNo = orderNo;
        }
      }
      if (statusFilter !== '') {
        params.paymentStatus = statusFilter;
      }
      const data = await listPayments(params);
      setPayments(data);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // 前端分页
  const filteredPayments = payments;
  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);
  const paginatedPayments = filteredPayments.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSearch = () => {
    setPage(1);
    fetchPayments();
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <AdminPageHeader
        icon={CreditCard}
        iconClassName="text-indigo-500"
        title="支付管理"
        description="查看支付/退款流水与对账状态"
        actions={
          <button className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center gap-2">
            <Download className="w-4 h-4" /> 导出数据
          </button>
        }
      />

      {/* Search & Filter Bar */}
      <FilterBar
        left={
          <div className="relative flex-1 md:max-w-md w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单号..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        }
        right={
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchPayments()}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
              title="刷新"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {PAYMENT_STATUS_OPTIONS.map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => { setStatusFilter(opt.value as number | ''); setPage(1); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${statusFilter === opt.value ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible min-h-[400px] flex flex-col">
        <AdminTableState
          loading={loading}
          error={error}
          isEmpty={paginatedPayments.length === 0}
          onRetry={fetchPayments}
          emptyIcon={Wallet}
          emptyTitle={searchTerm || statusFilter !== '' ? '未找到匹配结果' : '暂无支付记录'}
          emptyDescription={searchTerm || statusFilter !== '' ? '请尝试调整搜索条件' : '新的支付记录将显示在这里'}
          skeletonRows={5}
          skeletonColumns={6}
        >
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">支付信息</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">支付方式</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">金额</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">支付时间</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedPayments.map(p => (
                <tr key={p.paymentId} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <EntityCell
                      leading={
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <Wallet className="w-5 h-5" />
                        </div>
                      }
                      title={`#${p.paymentId}`}
                      meta={[
                        { text: `订单: ${p.orderNo}` },
                        p.tradeNo ? { text: `流水: ${p.tradeNo}` } : null,
                      ].filter(Boolean) as { text: string }[]}
                      titleClassName="font-mono text-gray-800"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <AdminBadge variant={PAYMENT_METHOD_MAP[p.paymentMethod]?.variant || 'info'}>
                      {PAYMENT_METHOD_MAP[p.paymentMethod]?.label || p.paymentMethod}
                    </AdminBadge>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${p.paymentStatus === 4 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {p.paymentStatus === 4 ? '-' : ''}¥{Number(p.paymentAmount).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <AdminBadge dot variant={PAYMENT_STATUS_MAP[p.paymentStatus]?.variant || 'info'}>
                      {PAYMENT_STATUS_MAP[p.paymentStatus]?.label || `状态${p.paymentStatus}`}
                    </AdminBadge>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {p.paymentTime ? new Date(p.paymentTime).toLocaleString('zh-CN') : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <TableActionMenu
                      isOpen={activeActionId === p.paymentId}
                      onToggle={(e) => { e.stopPropagation(); setActiveActionId(activeActionId === p.paymentId ? null : p.paymentId); }}
                      onClose={() => setActiveActionId(null)}
                    >
                      <button className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Eye className="w-3.5 h-3.5 text-indigo-500" /> 查看详情
                      </button>
                      <button className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-gray-500" /> 电子回单
                      </button>
                    </TableActionMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            setPage={setPage}
            totalItems={filteredPayments.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </AdminTableState>
      </div>
    </div>
  );
};

export default PaymentsMgmt;
