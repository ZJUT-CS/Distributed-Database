import React, { useEffect, useMemo, useState } from 'react';
import { Search, CheckCircle2, XCircle, RefreshCw, User, Plane, ClipboardCheck, Download, CheckSquare, Square, X } from 'lucide-react';
import {
  AdminBadge,
  AdminPageHeader,
  Pagination,
  FilterBar,
  ErrorBanner,
  AdminTableState,
  approveRefundChangeRequest,
  listRefundChangeRequests,
  rejectRefundChangeRequest,
  CHANGE_REQUEST_STATUS_MAP,
  ORDER_STATUS,
  useToast,
  useConfirm,
} from '@/features/admin';
import type { RefundChangeRecord } from '@/features/user';
import EntityCell from '@/components/common/EntityCell';
import { auditAdminOrder, listAdminOrders, type AdminOrderItem } from '@/features/admin/api/orders';
import { exportToCSV } from '@/utils/export';

type AuditStatus = 'all' | 'pending' | 'approved' | 'rejected';
type AuditTab = 'orders' | 'refund-change';

const ITEMS_PER_PAGE = 8;

const formatDateTime = (v?: string | null) => {
  const s = String(v ?? '').trim();
  if (!s) return '-';
  return s.replace('T', ' ').slice(0, 16);
};

const OrderAudit: React.FC = () => {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [tab, setTab] = useState<AuditTab>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AuditStatus>('pending');

  const normalizedSearch = useMemo(() => searchTerm.trim(), [searchTerm]);

  // 订单审核（只展示待审核：orderStatus=PENDING_AUDIT）
  const [orderPage, setOrderPage] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSubmittingId, setOrderSubmittingId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<AdminOrderItem[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  const [audits, setAudits] = useState<RefundChangeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedAuditIds, setSelectedAuditIds] = useState<Set<string>>(new Set());

  const orderTotalPages = Math.max(1, Math.ceil(orderTotal / ITEMS_PER_PAGE));

  const refreshOrders = async (nextPage: number) => {
    setOrderLoading(true);
    setOrderError(null);
    try {
      const orderNo = normalizedSearch && /^\d+$/.test(normalizedSearch) ? normalizedSearch : undefined;
      const res = await listAdminOrders({
        page: nextPage,
        size: ITEMS_PER_PAGE,
        orderNo,
        orderStatus: ORDER_STATUS.PENDING_AUDIT,
      });
      setOrderItems(res.data || []);
      setOrderTotal(res.total || 0);
    } catch (e: any) {
      setOrderError(e?.message || '加载失败');
      setOrderItems([]);
      setOrderTotal(0);
    } finally {
      setOrderLoading(false);
    }
  };

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await listRefundChangeRequests({});
      setAudits(records);
    } catch (e: any) {
      setError(e?.message || '加载失败');
      setAudits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'refund-change') {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (tab === 'orders') {
      refreshOrders(orderPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, orderPage, normalizedSearch]);

  const filteredAudits = useMemo(() => {
    const kw = normalizedSearch.toLowerCase();
    return audits.filter((a) => {
      const matchStatus = statusFilter === 'all' || a.status === statusFilter;
      const matchKeyword =
        !kw ||
        String(a.id ?? '').toLowerCase().includes(kw) ||
        String(a.orderId ?? '').toLowerCase().includes(kw) ||
        String(a.passenger ?? '').toLowerCase().includes(kw);
      return matchStatus && matchKeyword;
    });
  }, [audits, searchTerm, statusFilter]);

  const onApprove = async (recordId: string) => {
    setSubmittingId(recordId);
    setError(null);
    try {
      await approveRefundChangeRequest(recordId);
      await refresh();
    } catch (e: any) {
      setError(e?.message || '操作失败');
    } finally {
      setSubmittingId(null);
    }
  };

  const onReject = async (recordId: string) => {
    setSubmittingId(recordId);
    setError(null);
    try {
      await rejectRefundChangeRequest(recordId);
      await refresh();
    } catch (e: any) {
      setError(e?.message || '操作失败');
    } finally {
      setSubmittingId(null);
    }
  };

  const onOrderApprove = async (orderId: string | number) => {
    const id = String(orderId);
    setOrderSubmittingId(id);
    setOrderError(null);
    try {
      await auditAdminOrder(orderId, true);
      await refreshOrders(orderPage);
    } catch (e: any) {
      setOrderError(e?.message || '操作失败');
    } finally {
      setOrderSubmittingId(null);
    }
  };

  const onOrderReject = async (orderId: string | number) => {
    const id = String(orderId);
    setOrderSubmittingId(id);
    setOrderError(null);
    try {
      await auditAdminOrder(orderId, false);
      await refreshOrders(orderPage);
    } catch (e: any) {
      setOrderError(e?.message || '操作失败');
    } finally {
      setOrderSubmittingId(null);
    }
  };

  const handleBatchOrderApprove = async () => {
    const ids = Array.from(selectedOrderIds);
    if (ids.length === 0) {
      toast.warning('请先选择要通过的订单');
      return;
    }
    const confirmed = await confirm({
      title: '批量通过订单',
      message: `确定要通过选中的 ${ids.length} 个订单吗？`,
      variant: 'warning',
      confirmText: '确认通过',
    });
    if (!confirmed) return;
    try {
      await Promise.all(ids.map(id => auditAdminOrder(id, true)));
      toast.success('订单已通过');
      setSelectedOrderIds(new Set());
      await refreshOrders(orderPage);
    } catch (e: any) {
      setOrderError(e?.message || '操作失败');
    }
  };

  const handleBatchOrderReject = async () => {
    const ids = Array.from(selectedOrderIds);
    if (ids.length === 0) {
      toast.warning('请先选择要拒绝的订单');
      return;
    }
    const confirmed = await confirm({
      title: '批量拒绝订单',
      message: `确定要拒绝选中的 ${ids.length} 个订单吗？`,
      variant: 'danger',
      confirmText: '确认拒绝',
    });
    if (!confirmed) return;
    try {
      await Promise.all(ids.map(id => auditAdminOrder(id, false)));
      toast.success('订单已拒绝');
      setSelectedOrderIds(new Set());
      await refreshOrders(orderPage);
    } catch (e: any) {
      setOrderError(e?.message || '操作失败');
    }
  };

  const handleBatchAuditApprove = async () => {
    const ids = Array.from(selectedAuditIds);
    if (ids.length === 0) {
      toast.warning('请先选择要通过的申请');
      return;
    }
    const confirmed = await confirm({
      title: '批量通过申请',
      message: `确定要通过选中的 ${ids.length} 个申请吗？`,
      variant: 'warning',
      confirmText: '确认通过',
    });
    if (!confirmed) return;
    try {
      await Promise.all(ids.map(id => approveRefundChangeRequest(id)));
      toast.success('申请已通过');
      setSelectedAuditIds(new Set());
      await refresh();
    } catch (e: any) {
      setError(e?.message || '操作失败');
    }
  };

  const handleBatchAuditReject = async () => {
    const ids = Array.from(selectedAuditIds);
    if (ids.length === 0) {
      toast.warning('请先选择要拒绝的申请');
      return;
    }
    const confirmed = await confirm({
      title: '批量拒绝申请',
      message: `确定要拒绝选中的 ${ids.length} 个申请吗？`,
      variant: 'danger',
      confirmText: '确认拒绝',
    });
    if (!confirmed) return;
    try {
      await Promise.all(ids.map(id => rejectRefundChangeRequest(id)));
      toast.success('申请已拒绝');
      setSelectedAuditIds(new Set());
      await refresh();
    } catch (e: any) {
      setError(e?.message || '操作失败');
    }
  };

  const handleSelectAllOrders = () => {
    if (selectedOrderIds.size === orderItems.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(orderItems.map(o => String(o.orderNo))));
    }
  };

  const handleSelectOneOrder = (id: string) => {
    const newSet = new Set(selectedOrderIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedOrderIds(newSet);
  };

  const handleSelectAllAudits = () => {
    if (selectedAuditIds.size === filteredAudits.length) {
      setSelectedAuditIds(new Set());
    } else {
      setSelectedAuditIds(new Set(filteredAudits.map(a => a.id)));
    }
  };

  const handleSelectOneAudit = (id: string) => {
    const newSet = new Set(selectedAuditIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedAuditIds(newSet);
  };

  const allOrdersSelected = orderItems.length > 0 && selectedOrderIds.size === orderItems.length;
  const someOrdersSelected = selectedOrderIds.size > 0;
  const allAuditsSelected = filteredAudits.length > 0 && selectedAuditIds.size === filteredAudits.length;
  const someAuditsSelected = selectedAuditIds.size > 0;

  const renderStatusBadge = (status: AuditStatus) => {
    if (status === 'pending') {
      return (
        <AdminBadge icon={RefreshCw} variant="warning">
          待审核
        </AdminBadge>
      );
    }
    if (status === 'approved') {
      return (
        <AdminBadge icon={CheckCircle2} variant="success">
          审核通过
        </AdminBadge>
      );
    }
    if (status === 'rejected') {
      return (
        <AdminBadge icon={XCircle} variant="danger">
          审核拒绝
        </AdminBadge>
      );
    }
    return null;
  };

  // 导出数据
  const handleExport = async () => {
    try {
      toast.info('正在导出数据...');
      if (tab === 'orders') {
        const res = await listAdminOrders({ page: 1, size: 1000, orderStatus: ORDER_STATUS.PENDING_AUDIT });
        const data = res.data ?? [];
        if (!data.length) { toast.warning('暂无数据可导出'); return; }
        exportToCSV(data, '待审核订单', [
          { key: 'orderNo', label: '订单号' },
          { key: 'passengerName', label: '乘客', formatter: (i) => i.passengerName || '' },
          { key: 'flightNo', label: '航班号', formatter: (i) => i.flightNo || '' },
          { key: 'totalAmount', label: '金额' },
          { key: 'orderTime', label: '下单时间', formatter: (i) => formatDateTime(i.orderTime) },
        ]);
      } else {
        const data = filteredAudits;
        if (!data.length) { toast.warning('暂无数据可导出'); return; }
        exportToCSV(data, '退改签审核', [
          { key: 'id', label: '申请单号' },
          { key: 'orderId', label: '订单号' },
          { key: 'passenger', label: '乘客' },
          { key: 'type', label: '类型' },
          { key: 'oldFlight', label: '原航班' },
          { key: 'newFlight', label: '新航班' },
          { key: 'applyTime', label: '申请时间' },
          { key: 'status', label: '状态' },
        ]);
      }
      toast.success('导出成功');
    } catch (e: any) {
      toast.error(e?.message || '导出失败');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <AdminPageHeader
        icon={ClipboardCheck}
        iconClassName="text-indigo-500"
        title="审核中心"
        description="集中处理：订单审核 / 退改签审核"
        actions={
          <button onClick={handleExport} className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center gap-2">
            <Download className="w-4 h-4" /> 导出数据
          </button>
        }
      />

      <FilterBar
        left={
          <div className="relative flex-1 md:max-w-md w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={tab === 'orders' ? '搜索订单号（数字）...' : '搜索申请单号、订单号或乘客姓名...'}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setOrderPage(1);
              }}
            />
          </div>
        }
        right={
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {[
                { id: 'orders', label: '订单审核' },
                { id: 'refund-change', label: '退改签审核' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTab(opt.id as AuditTab)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${tab === opt.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {tab === 'refund-change' ? (
              <div className="flex bg-gray-100 p-1 rounded-lg">
                {[
                  { id: 'pending', label: '待审核' },
                  { id: 'approved', label: '已通过' },
                  { id: 'rejected', label: '已拒绝' },
                  { id: 'all', label: '全部' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setStatusFilter(opt.id as AuditStatus)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${statusFilter === opt.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        }
      />

      {tab === 'orders' && orderError && (
        <ErrorBanner message={orderError} onRetry={() => refreshOrders(orderPage)} />
      )}
      {tab === 'refund-change' && error && (
        <ErrorBanner message={error} onRetry={refresh} />
      )}

      {tab === 'orders' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible min-h-[400px] flex flex-col">
          {someOrdersSelected && (
            <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
              <span className="text-sm font-medium text-indigo-700">已选择 {selectedOrderIds.size} 项</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBatchOrderApprove}
                  className="px-3 py-1.5 text-xs font-medium text-green-600 bg-white border border-green-200 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> 批量通过
                </button>
                <button
                  onClick={handleBatchOrderReject}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" /> 批量拒绝
                </button>
                <button
                  onClick={() => setSelectedOrderIds(new Set())}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          <AdminTableState
            loading={orderLoading}
            error={orderError}
            isEmpty={orderItems.length === 0}
            onRetry={() => refreshOrders(orderPage)}
            emptyIcon={ClipboardCheck}
            emptyTitle={normalizedSearch ? '未找到匹配订单' : '暂无待审核订单'}
            emptyDescription={normalizedSearch ? '请尝试调整搜索条件' : '当前没有需要审核的订单'}
            skeletonRows={5}
            skeletonColumns={6}
          >
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <button
                      onClick={handleSelectAllOrders}
                      className="text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      {allOrdersSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">订单号</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">乘客</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">航班</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">金额</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">下单时间</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orderItems.map((o) => {
                  const orderId = o.orderNo;
                  const passengerName = o.passengerName || (o.userId != null ? `用户#${o.userId}` : '-');
                  const route = o.origin && o.destination ? `${o.origin} → ${o.destination}` : '-';
                  const amount = Number(o.totalAmount || 0);

                  return (
                    <tr key={String(orderId)} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleSelectOneOrder(String(orderId))}
                          className="text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                          {selectedOrderIds.has(String(orderId)) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <EntityCell
                          leading={
                            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                              <ClipboardCheck className="w-5 h-5" />
                            </div>
                          }
                          title={String(o.orderNo)}
                          titleClassName="font-mono text-gray-800 flex items-center gap-2 min-w-0"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <EntityCell
                          leading={
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                              <User className="w-4 h-4" />
                            </div>
                          }
                          title={passengerName}
                          titleClassName="text-sm font-medium text-gray-900 flex items-center gap-2 min-w-0"
                          meta={[{ text: o.email || o.phoneNumber || '-' }]}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <AdminBadge size="sm" variant="info">
                            {o.flightNo || '-'}
                          </AdminBadge>
                          <span className="text-xs text-gray-400">{route}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">¥{amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">{formatDateTime(o.orderTime)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            disabled={orderSubmittingId === String(orderId)}
                            onClick={() => onOrderApprove(orderId)}
                            className="px-3 py-1.5 text-xs rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {orderSubmittingId === String(orderId) ? '处理中...' : '通过'}
                          </button>
                          <button
                            disabled={orderSubmittingId === String(orderId)}
                            onClick={() => onOrderReject(orderId)}
                            className="px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {orderSubmittingId === String(orderId) ? '处理中...' : '拒绝'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination
              currentPage={orderPage}
              totalPages={orderTotalPages}
              setPage={setOrderPage}
              totalItems={orderTotal}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </AdminTableState>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible min-h-[400px] flex flex-col">
          {someAuditsSelected && (
            <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
              <span className="text-sm font-medium text-indigo-700">已选择 {selectedAuditIds.size} 项</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBatchAuditApprove}
                  className="px-3 py-1.5 text-xs font-medium text-green-600 bg-white border border-green-200 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> 批量通过
                </button>
                <button
                  onClick={handleBatchAuditReject}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" /> 批量拒绝
                </button>
                <button
                  onClick={() => setSelectedAuditIds(new Set())}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          <AdminTableState
            loading={loading}
            error={error}
            isEmpty={filteredAudits.length === 0}
            onRetry={refresh}
            emptyIcon={ClipboardCheck}
            emptyTitle={normalizedSearch ? '未找到匹配申请' : '暂无退改签申请'}
            emptyDescription={normalizedSearch ? '请尝试调整搜索条件' : '当前没有符合条件的退改签申请'}
            skeletonRows={5}
            skeletonColumns={8}
          >
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <button
                      onClick={handleSelectAllAudits}
                      className="text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      {allAuditsSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">申请单号</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">订单号</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">乘客</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">操作类型</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">航班信息</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">提交时间</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">审核状态</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAudits.map((a) => (
                  <tr key={a.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleSelectOneAudit(a.id)}
                        className="text-gray-400 hover:text-indigo-600 transition-colors"
                      >
                        {selectedAuditIds.has(a.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-700">{a.id}</td>
                    <td className="px-6 py-4 font-mono text-gray-600">{a.orderId}</td>
                    <td className="px-6 py-4">
                      <EntityCell
                        leading={
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <User className="w-4 h-4" />
                          </div>
                        }
                        title={a.passenger}
                        titleClassName="text-sm font-medium text-gray-900 flex items-center gap-2 min-w-0"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <AdminBadge icon={Plane} variant={a.type === '退票' ? 'danger' : 'info'}>
                        {a.type}
                      </AdminBadge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-600">
                        <div>原航班：{a.oldFlight}</div>
                        {a.newFlight !== '-' && a.newFlight !== '' && (
                          <div className="mt-1 text-indigo-600">新航班：{a.newFlight}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">{a.applyTime}</td>
                    <td className="px-6 py-4">{renderStatusBadge(a.status)}</td>
                    <td className="px-6 py-4 text-right">
                      {a.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            disabled={submittingId === a.id}
                            onClick={() => onApprove(a.id)}
                            className="px-3 py-1.5 text-xs rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {submittingId === a.id ? '处理中...' : '通过'}
                          </button>
                          <button
                            disabled={submittingId === a.id}
                            onClick={() => onReject(a.id)}
                            className="px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {submittingId === a.id ? '处理中...' : '拒绝'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableState>
        </div>
      )}
    </div>
  );
};

export default OrderAudit;

