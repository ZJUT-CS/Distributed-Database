import React, { useEffect, useMemo, useState } from 'react';
import { Download, Eye, FileText, CreditCard, Wallet, Search, RefreshCw, CheckSquare, Square, X, RotateCcw } from 'lucide-react';
import { Pagination, TableActionMenu, AdminBadge, AdminPageHeader, FilterBar, AdminTableState, AdminDrawer, useToast, useConfirm } from '@/features/admin';
import { PAYMENT_STATUS_OPTIONS, PAYMENT_STATUS_MAP, PAYMENT_METHOD_MAP, type SelectOption } from '@/config/features/admin/constants';
import { useAdminPayments } from '@/features/payment/hooks/usePayments';
import { type PaymentItem } from '@/features/admin/api/payments';
import EntityCell from '@/components/common/EntityCell';
import { formatDateTimeZhCN } from '@/utils/formatters';
import { exportToCSV } from '@/utils/export';

const PaymentsMgmt: React.FC = () => {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [orderNoInput, setOrderNoInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | ''>('');
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const ITEMS_PER_PAGE = 10;

  type PaymentFilters = {
    orderNo?: number;
    paymentStatus?: number;
  };

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<PaymentFilters>({});

  const {
    data: paymentsData,
    isLoading,
    error: paymentsError,
    refetch,
  } = useAdminPayments({
    page,
    size: ITEMS_PER_PAGE,
    orderNo: filters.orderNo,
    paymentStatus: filters.paymentStatus,
  });

  const payments = paymentsData?.data ?? [];
  const total = paymentsData?.total ?? 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

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
      setFilters({ ...filters, orderNo: parsedOrderNo });
      setPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [parsedOrderNo, filters.orderNo]);

  const handleViewDetail = (p: PaymentItem) => {
    setSelectedPayment(p);
    setDrawerOpen(true);
    setActiveActionId(null);
  };

  const handleDownloadReceipt = (p: PaymentItem) => {
    setActiveActionId(null);
    toast.info('电子回单下载功能开发中，敬请期待');
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleBatchRefund = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.warning('请先选择要退款的支付记录');
      return;
    }
    const confirmed = await confirm({
      title: '批量退款',
      message: `确定要对选中的 ${ids.length} 笔支付进行退款吗？此操作不可撤销。`,
      variant: 'danger',
      confirmText: '确认退款',
    });
    if (!confirmed) return;
    try {
      toast.info('批量退款功能开发中，敬请期待');
      setSelectedIds(new Set());
    } catch (e: any) {
      toast.error(e?.message || '退款失败');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === payments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(payments.map((p: PaymentItem) => String(p.paymentId))));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const allSelected = payments.length > 0 && selectedIds.size === payments.length;
  const someSelected = selectedIds.size > 0;

  // 导出数据
  const handleExport = async () => {
    try {
      toast.info('正在导出数据...');
      const res = await refetch();
      const data = res.data?.data ?? [];
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

  const handleBatchExport = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.warning('请先选择要导出的支付记录');
      return;
    }
    try {
      toast.info(`正在导出 ${ids.length} 条数据...`);
      const selectedData = payments.filter((p: PaymentItem) => ids.includes(String(p.paymentId)));
      exportToCSV(selectedData, '支付记录-选中', [
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
                setFilters({ ...filters, orderNo: parsedOrderNo });
                setPage(1);
              }}
            />
          </div>
        }
        right={
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
              title="刷新"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {PAYMENT_STATUS_OPTIONS.map((opt: SelectOption) => (
                <button
                  key={String(opt.value)}
                  onClick={() => {
                    const next = opt.value as number | '';
                    setStatusFilter(next);
                    setFilters({ ...filters, paymentStatus: next === '' ? undefined : next });
                    setPage(1);
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
        {someSelected && (
          <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
            <span className="text-sm font-medium text-indigo-700">已选择 {selectedIds.size} 项</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBatchRefund}
                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> 批量退款
              </button>
              <button
                onClick={handleBatchExport}
                className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> 批量导出
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        <AdminTableState
          loading={isLoading}
          error={paymentsError?.message ?? null}
          isEmpty={payments.length === 0}
          onRetry={() => refetch()}
          emptyIcon={Wallet}
          emptyTitle={orderNoInput || statusFilter !== '' ? '未找到匹配结果' : '暂无支付记录'}
          emptyDescription={orderNoInput || statusFilter !== '' ? '请尝试调整搜索条件' : '新的支付记录将显示在这里'}
          skeletonRows={5}
          skeletonColumns={6}
        >
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-4 w-10">
                  <button
                    onClick={handleSelectAll}
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">支付信息</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">支付方式</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">金额</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">支付时间</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p: PaymentItem) => (
                <tr key={p.paymentId} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleSelectOne(String(p.paymentId))}
                      className="text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      {selectedIds.has(String(p.paymentId)) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                  </td>
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
                      <button
                        onClick={() => handleViewDetail(p)}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-500" /> 查看详情
                      </button>
                      <button
                        onClick={() => handleDownloadReceipt(p)}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
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

      {/* 支付详情 Drawer */}
      <AdminDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={`支付详情 #${selectedPayment?.paymentId || ''}`}
        subtitle={selectedPayment?.orderNo ? `订单号: ${selectedPayment.orderNo}` : undefined}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDrawerOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              关闭
            </button>
          </div>
        }
      >
        {selectedPayment && (
          <div className="space-y-6">
            {/* 状态卡片 */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">支付状态</span>
                <AdminBadge dot variant={PAYMENT_STATUS_MAP[selectedPayment.paymentStatus]?.variant || 'info'}>
                  {PAYMENT_STATUS_MAP[selectedPayment.paymentStatus]?.label || `状态${selectedPayment.paymentStatus}`}
                </AdminBadge>
              </div>
            </div>

            {/* 基本信息 */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">基本信息</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">支付ID</div>
                  <div className="font-mono text-sm text-gray-900">{selectedPayment.paymentId}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">订单号</div>
                  <div className="font-mono text-sm text-gray-900">{selectedPayment.orderNo}</div>
                </div>
                {selectedPayment.tradeNo && (
                  <div className="p-3 bg-gray-50 rounded-lg col-span-2">
                    <div className="text-xs text-gray-500 mb-1">交易流水号</div>
                    <div className="font-mono text-sm text-gray-900">{selectedPayment.tradeNo}</div>
                  </div>
                )}
              </div>
            </div>

            {/* 支付信息 */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">支付信息</h4>
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">支付方式：</span>
                    <span className="text-gray-900">{PAYMENT_METHOD_MAP[selectedPayment.paymentMethod]?.label || selectedPayment.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">支付金额：</span>
                    <span className={`font-bold ${selectedPayment.paymentStatus === 4 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {selectedPayment.paymentStatus === 4 ? '-' : ''}¥{Number(selectedPayment.paymentAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 时间信息 */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">时间记录</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">支付时间</span>
                  <span className="text-gray-900">{formatDateTimeZhCN(selectedPayment.paymentTime)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminDrawer>
    </div>
  );
};

export default PaymentsMgmt;
