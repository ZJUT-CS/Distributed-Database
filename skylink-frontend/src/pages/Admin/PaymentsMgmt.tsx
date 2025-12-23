import React, { useEffect, useMemo, useState } from 'react';
import { Download, Eye, FileText, CreditCard, Wallet, Search, RefreshCw } from 'lucide-react';
import { Pagination, TableActionMenu, AdminBadge, AdminPageHeader, FilterBar, AdminTableState, PAYMENT_STATUS_OPTIONS, PAYMENT_STATUS_MAP, PAYMENT_METHOD_MAP, useAdminList, useToast } from '@/features/admin';
import { listPaymentsPage, type PaymentItem } from '@/features/admin/api/payments';
import EntityCell from '@/components/common/EntityCell';
import { formatDateTimeZhCN } from '@/utils/formatters';
import { exportToCSV } from '@/utils/export';

const PaymentsMgmt: React.FC = () => {
  const toast = useToast();
  const [orderNoInput, setOrderNoInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | ''>('');
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 10;

  type PaymentFilters = {
    orderNo?: number;
    paymentStatus?: number;
  };

  const {
    items: payments,
    total,
    page,
    totalPages,
    loading,
    error,
    filters,
    setPage,
    setFilters,
    refresh,
    retry,
  } = useAdminList<PaymentItem, PaymentFilters>({
    pageSize: ITEMS_PER_PAGE,
    initialFilters: {},
    fetchFn: async ({ page, size, orderNo, paymentStatus }) => {
      const res = await listPaymentsPage({ page, size, orderNo, paymentStatus });
      return { data: res.data ?? [], total: res.total ?? 0 };
    },
  });

  const parsedOrderNo = useMemo(() => {
    const s = String(orderNoInput ?? '').trim();
    if (!s) return undefined;
    const v = parseInt(s, 10);
    return Number.isFinite(v) ? v : undefined;
  }, [orderNoInput]);

  // 订单号输入：300ms debounce
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (filters.orderNo === parsedOrderNo) return;
      setFilters({ orderNo: parsedOrderNo });
    }, 300);
    return () => window.clearTimeout(t);
  }, [parsedOrderNo, filters.orderNo, setFilters]);

  // 导出数据
  const handleExport = async () => {
    try {
      toast.info('正在导出数据...');
      const res = await listPaymentsPage({ page: 1, size: 1000, orderNo: filters.orderNo, paymentStatus: filters.paymentStatus });
      const data = res.data ?? [];
      if (!data.length) {
        toast.warning('暂无数据可导出');
        return;
      }
      exportToCSV(data, '支付记录', [
        { key: 'paymentId', label: '支付ID' },
        { key: 'orderNo', label: '订单号' },
        { key: 'tradeNo', label: '流水号', formatter: (item) => item.tradeNo || '' },
        { key: 'paymentMethod', label: '支付方式', formatter: (item) => PAYMENT_METHOD_MAP[item.paymentMethod]?.label || String(item.paymentMethod) },
        { key: 'paymentAmount', label: '金额' },
        { key: 'paymentStatus', label: '状态', formatter: (item) => PAYMENT_STATUS_MAP[item.paymentStatus]?.label || '' },
        { key: 'paymentTime', label: '支付时间', formatter: (item) => formatDateTimeZhCN(item.paymentTime) || '' },
      ]);
      toast.success('导出成功');
    } catch (e: any) {
      toast.error(e?.message || '导出失败');
    }
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
          <button onClick={handleExport} className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center gap-2">
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
              value={orderNoInput}
              onChange={(e) => setOrderNoInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                setFilters({ orderNo: parsedOrderNo });
              }}
            />
          </div>
        }
        right={
          <div className="flex items-center gap-3">
            <button
              onClick={() => refresh(true)}
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
                  onClick={() => {
                    const next = opt.value as number | '';
                    setStatusFilter(next);
                    setFilters({ paymentStatus: next === '' ? undefined : next });
                  }}
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
          isEmpty={payments.length === 0}
          onRetry={retry}
          emptyIcon={Wallet}
          emptyTitle={orderNoInput || statusFilter !== '' ? '未找到匹配结果' : '暂无支付记录'}
          emptyDescription={orderNoInput || statusFilter !== '' ? '请尝试调整搜索条件' : '新的支付记录将显示在这里'}
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
              {payments.map(p => (
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
                    {formatDateTimeZhCN(p.paymentTime)}
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
            totalItems={total}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </AdminTableState>
      </div>
    </div>
  );
};

export default PaymentsMgmt;
