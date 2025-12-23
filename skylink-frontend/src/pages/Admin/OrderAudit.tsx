import React, { useEffect, useMemo, useState } from 'react';
import { Search, CheckCircle2, XCircle, RefreshCw, User, Plane, ClipboardCheck, Download } from 'lucide-react';
import {
  AdminBadge,
  AdminPageHeader,
  Pagination,
  approveRefundChangeRequest,
  listRefundChangeRequests,
  rejectRefundChangeRequest,
} from '@/features/admin';
import type { RefundChangeRecord } from '@/features/user';
import EntityCell from '@/components/common/EntityCell';
import { auditAdminOrder, listAdminOrders, type AdminOrderItem } from '@/features/admin/api/orders';

type AuditStatus = 'all' | 'pending' | 'approved' | 'rejected';
type AuditTab = 'orders' | 'refund-change';

const ITEMS_PER_PAGE = 8;

const formatDateTime = (v?: string | null) => {
  const s = String(v ?? '').trim();
  if (!s) return '-';
  return s.replace('T', ' ').slice(0, 16);
};

const OrderAudit: React.FC = () => {
  const [tab, setTab] = useState<AuditTab>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AuditStatus>('pending');

  const normalizedSearch = useMemo(() => searchTerm.trim(), [searchTerm]);

  // 订单审核（只展示待审核：orderStatus=0）
  const [orderPage, setOrderPage] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSubmittingId, setOrderSubmittingId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<AdminOrderItem[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderError, setOrderError] = useState<string | null>(null);

  const [audits, setAudits] = useState<RefundChangeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        orderStatus: 0,
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

  return (
    <div className="space-y-6 animate-fade-in-up">
      <AdminPageHeader
        icon={ClipboardCheck}
        iconClassName="text-indigo-500"
        title="审核中心"
        description="集中处理：订单审核 / 退改签审核"
        actions={
          <button className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center gap-2">
            <Download className="w-4 h-4" /> 导出数据
          </button>
        }
      />

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
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

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'orders', label: '订单审核' },
              { id: 'refund-change', label: '退改签审核' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTab(opt.id as AuditTab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  tab === opt.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
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
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  statusFilter === opt.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          ) : null}
        </div>
      </div>

      {tab === 'orders' && orderError ? (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">{orderError}</div>
      ) : null}
      {tab === 'refund-change' && error ? (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      ) : null}

      {tab === 'orders' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">订单号</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">乘客</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">航班</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">金额</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">下单时间</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orderLoading && (
                <tr>
                  <td className="px-6 py-12 text-center text-sm text-gray-400" colSpan={6}>
                    正在加载...
                  </td>
                </tr>
              )}

              {!orderLoading &&
                orderItems.map((o) => {
                  const orderId = o.orderNo;
                  const passengerName = o.passengerName || (o.userId != null ? `用户#${o.userId}` : '-');
                  const route = o.origin && o.destination ? `${o.origin} → ${o.destination}` : '-';
                  const amount = Number(o.totalAmount || 0);

                  return (
                    <tr key={String(orderId)} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-6 py-4 font-mono text-gray-700">{o.orderNo}</td>
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

              {!orderLoading && orderItems.length === 0 && (
                <tr>
                  <td className="px-6 py-12 text-center text-sm text-gray-400" colSpan={6}>
                    暂无待审核订单
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <Pagination
            currentPage={orderPage}
            totalPages={orderTotalPages}
            setPage={setOrderPage}
            totalItems={orderTotal}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80">
              <tr>
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
              {loading && (
                <tr>
                  <td className="px-6 py-12 text-center text-sm text-gray-400" colSpan={8}>
                    正在加载...
                  </td>
                </tr>
              )}

              {!loading &&
                filteredAudits.map((a) => (
                  <tr key={a.id} className="hover:bg-indigo-50/30 transition-colors group">
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

              {!loading && filteredAudits.length === 0 && (
                <tr>
                  <td className="px-6 py-12 text-center text-sm text-gray-400" colSpan={8}>
                    暂无符合条件的退改签申请
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrderAudit;

