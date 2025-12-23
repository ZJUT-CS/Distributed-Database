import React, { useEffect, useMemo, useState } from 'react';
import { Search, CheckCircle2, XCircle, RefreshCw, User, Plane, ClipboardCheck, Download } from 'lucide-react';
import { AdminBadge, AdminPageHeader, approveRefundChangeRequest, listRefundChangeRequests, rejectRefundChangeRequest } from '@/features/admin';
import type { RefundChangeRecord } from '@/features/user';
import EntityCell from '@/components/common/EntityCell';

type AuditStatus = 'all' | 'pending' | 'approved' | 'rejected';

const OrderAudit: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AuditStatus>('pending');

  const [audits, setAudits] = useState<RefundChangeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    refresh();
  }, []);

  const filteredAudits = useMemo(() => {
    const kw = searchTerm.trim().toLowerCase();
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
        title="退改签审核"
        description="集中处理所有用户发起的退票与改签申请"
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
            placeholder="搜索申请单号、订单号或乘客姓名..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
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
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

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
    </div>
  );
};

export default OrderAudit;

