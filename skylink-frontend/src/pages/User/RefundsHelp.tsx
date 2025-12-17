import React, { useMemo, useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { RefundChangeRecord, AuditStatus } from '../../types';
import { listRefundChanges, revokeRefundChange, updateRefundChange } from '../../services/refundChange';
import { ArrowLeft, CheckCircle2, Filter, RefreshCw, Search, Ticket, XCircle, AlertCircle, Trash2, Edit } from 'lucide-react';

const RefundsHelpPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AuditStatus | 'all'>('all');
  const [audits, setAudits] = useState<RefundChangeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RefundChangeRecord | null>(null);
  const [editReason, setEditReason] = useState('');
  const [editNewFlight, setEditNewFlight] = useState('');

  const refreshData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const records = await listRefundChanges({ userId: user.id });
      setAudits(records);
    } catch (e: any) {
      setError(e?.message || '加载退改/售后记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshData();
  }, [user]);

  const filteredAudits = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return audits
      .filter((a) => statusFilter === 'all' || a.status === statusFilter)
      .filter((a) => {
        if (!term) return true;
        return (
          a.id.toLowerCase().includes(term) ||
          a.orderId.toLowerCase().includes(term) ||
          a.type.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => new Date(b.applyTime).getTime() - new Date(a.applyTime).getTime());
  }, [audits, searchTerm, statusFilter]);

  const pendingCount = audits.filter((a) => a.status === 'pending').length;

  const handleRevoke = async (record: RefundChangeRecord) => {
    if (!window.confirm('确定要撤销这个申请吗？撤销后订单将恢复为正常状态。')) return;

    try {
      setActionLoading(record.id);
      setError(null);
      await revokeRefundChange(record.id);
      alert('申请已撤销');
      await refreshData();
    } catch (e: any) {
      setError(e?.message || '撤销失败');
      alert(e?.message || '撤销失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReApply = (record: RefundChangeRecord) => {
    setEditingRecord(record);
    setEditReason(record.remark || '');
    setEditNewFlight(record.newFlight === '-' ? '' : record.newFlight);
    setIsModalOpen(true);
  };

  const submitReApply = async () => {
    if (!editingRecord) return;
    if (!editReason.trim()) {
      alert('请填写申请原因');
      return;
    }

    try {
      setActionLoading('reapply');
      setError(null);
      await updateRefundChange(editingRecord.id, {
        remark: editReason,
        newFlightNo: editingRecord.type === '改签' ? editNewFlight.trim() : undefined,
      });

      setIsModalOpen(false);
      setEditingRecord(null);
      alert('重新申请已提交');
      await refreshData();
    } catch (e: any) {
      setError(e?.message || '重新申请失败');
      alert(e?.message || '重新申请失败');
    } finally {
      setActionLoading(null);
    }
  };

  const renderStatusBadge = (status: AuditStatus) => {
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-100">
          <RefreshCw className="w-3 h-3" />
          待审核
        </span>
      );
    }
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
          <CheckCircle2 className="w-3 h-3" />
          审核通过
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
        <XCircle className="w-3 h-3" />
        审核拒绝
      </span>
    );
  };

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="relative animate-fade-in-up mt-8 w-full max-w-screen-2xl mx-auto mb-20 px-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-44 -right-44 h-[520px] w-[520px] rounded-full bg-sky-200/25 blur-3xl" />
        <div className="absolute -bottom-56 -left-40 h-[560px] w-[560px] rounded-full bg-indigo-200/20 blur-3xl" />
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-sky-200 bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 text-white shadow-xl shadow-sky-500/15 mb-6">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-200/25 blur-3xl" />
        <div className="relative p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">退改/售后</h2>
                <p className="text-sm text-white/85 mt-1">异常流程的审核进度追踪</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/my-bookings')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm font-bold transition-all w-full sm:w-auto"
            >
              <Ticket className="w-4 h-4" />
              去我的订单申请
              {pendingCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-white/20 text-xs font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur p-4 rounded-2xl border border-sky-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 md:max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索申请单号、订单号或类型..."
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none w-full transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm whitespace-nowrap">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">筛选</span>
          </button>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'pending', label: '待审核' },
              { id: 'approved', label: '已通过' },
              { id: 'rejected', label: '已拒绝' },
              { id: 'all', label: '全部' },
            ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setStatusFilter(opt.id as AuditStatus | 'all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                    statusFilter === opt.id ? 'bg-white text-sky-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading && (
          <div className="px-6 py-4 text-sm text-gray-500 border-b border-gray-100">加载中...</div>
        )}
        {error && (
          <div className="px-6 py-4 text-sm text-red-600 border-b border-red-100 bg-red-50/50">{error}</div>
        )}
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">申请单号</th>
              <th className="px-6 py-4">订单号</th>
              <th className="px-6 py-4">类型</th>
              <th className="px-6 py-4">详情信息</th>
              <th className="px-6 py-4">提交时间</th>
              <th className="px-6 py-4">审核状态</th>
              <th className="px-6 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredAudits.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-6 py-4 font-mono text-gray-700">{a.id}</td>
                <td className="px-6 py-4 font-mono text-gray-600">{a.orderId}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      a.type === '退票' ? 'bg-red-50 text-red-700' : 'bg-indigo-50 text-indigo-700'
                    }`}
                  >
                    <RefreshCw className="w-3 h-3" />
                    {a.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs text-gray-600">
                    <div>原航班：{a.oldFlight}</div>
                    {a.newFlight !== '-' && <div className="mt-1 text-blue-600">新航班：{a.newFlight}</div>}
                    {a.remark && <div className="mt-1 text-gray-400 italic">备注：{a.remark}</div>}
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">{a.applyTime}</td>
                <td className="px-6 py-4">{renderStatusBadge(a.status)}</td>
                <td className="px-6 py-4 text-right">
                  {a.status === 'pending' && (
                    <button
                      onClick={() => handleRevoke(a)}
                      disabled={actionLoading === a.id}
                      className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3 h-3" />
                      {actionLoading === a.id ? '撤销中...' : '撤销'}
                    </button>
                  )}
                  {a.status === 'rejected' && (
                    <button
                      onClick={() => handleReApply(a)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50"
                    >
                      <Edit className="w-3 h-3" />
                      重新申请
                    </button>
                  )}
                  {a.status === 'approved' && (
                    <button
                      onClick={() => alert('钱款已原路退回至您的支付账户（模拟）')}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors px-2 py-1 rounded-lg hover:bg-emerald-50"
                    >
                      查看去向
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredAudits.length === 0 && (
              <tr>
                <td className="px-6 py-10 text-center text-sm text-gray-400" colSpan={7}>
                  暂无符合条件的退改/售后记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

       {/* Re-apply Modal */}
       {isModalOpen && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-8 animate-scale-up">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              重新提交申请
            </h3>
            <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-red-700">
               <span className="font-bold">上次拒绝原因：</span> 证件信息不符（模拟数据）
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {editingRecord.type === '退票' ? '退票原因' : '改签原因'}
                </label>
                <textarea
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="请详细描述您的原因..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[100px]"
                />
              </div>

              {editingRecord.type === '改签' && (
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">
                    期望变更的航班
                  </label>
                  <input
                    value={editNewFlight}
                    onChange={(e) => setEditNewFlight(e.target.value)}
                    placeholder="例如：2025-01-01 CA1234"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-8">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all"
              >
                取消
              </button>
              <button
                onClick={submitReApply}
                disabled={actionLoading === 'reapply'}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
              >
                {actionLoading === 'reapply' ? '提交中...' : '提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundsHelpPage;
