import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { listRefundChanges, revokeRefundChange, updateRefundChange } from '@/features/user/api/refund';
import type { RefundChangeRecord } from '@/features/refund/types';

export default function RefundsHelpPage() {
  const { user } = useAuth();
  const [audits, setAudits] = useState<RefundChangeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    refreshData();
  }, [user]);

  const handleRevoke = async (id: string) => {
    try {
      await revokeRefundChange(id);
      await refreshData();
    } catch (e: any) {
      setError(e?.message || '撤销申请失败');
    }
  };

  const handleReApply = async (id: string) => {
    try {
      await updateRefundChange(id, {});
      await refreshData();
    } catch (e: any) {
      setError(e?.message || '重新申请失败');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">退改/售后记录</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading && <div className="text-gray-500">加载中...</div>}

      {!loading && audits.length === 0 && (
        <div className="text-gray-500">暂无退改/售后记录</div>
      )}

      {!loading && audits.length > 0 && (
        <div className="space-y-4">
          {audits.map((audit) => (
            <div key={audit.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">订单号: {audit.orderId}</h3>
                  <p className="text-sm text-gray-500">申请时间: {audit.applyTime}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    audit.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : audit.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {audit.status === 'approved'
                    ? '已通过'
                    : audit.status === 'rejected'
                      ? '已拒绝'
                      : '待审核'}
                </span>
              </div>

              <div className="mb-2">
                <p className="text-sm">
                  <span className="font-medium">退改类型:</span>{' '}
                  {audit.type}
                </p>
                {audit.remark && (
                  <p className="text-sm">
                    <span className="font-medium">备注:</span> {audit.remark}
                  </p>
                )}
              </div>

              {audit.status === 'pending' && (
                <button
                  onClick={() => handleRevoke(audit.id)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  撤销申请
                </button>
              )}

              {audit.status === 'rejected' && (
                <button
                  onClick={() => handleReApply(audit.id)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  重新申请
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
