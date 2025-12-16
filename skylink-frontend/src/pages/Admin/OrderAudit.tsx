import React, { useState } from 'react';
import { Search, Filter, CheckCircle2, XCircle, RefreshCw, User, Plane } from 'lucide-react';

type AuditStatus = 'all' | 'pending' | 'approved' | 'rejected';

const MOCK_AUDITS = [
  {
    id: 'RC-2025001',
    orderId: 'ORD-992812',
    passenger: 'Alice Wu',
    type: '退票',
    oldFlight: 'CA1831 北京 → 上海',
    newFlight: '-',
    applyTime: '2025-12-15 10:20',
    status: 'pending' as AuditStatus,
  },
  {
    id: 'RC-2025002',
    orderId: 'ORD-992815',
    passenger: 'David Lee',
    type: '改签',
    oldFlight: 'HU7608 北京 → 深圳',
    newFlight: 'HU7610 北京 → 深圳',
    applyTime: '2025-12-15 11:05',
    status: 'approved' as AuditStatus,
  },
  {
    id: 'RC-2025003',
    orderId: 'ORD-992814',
    passenger: 'Charlie',
    type: '退票',
    oldFlight: 'CZ3001 北京 → 广州',
    newFlight: '-',
    applyTime: '2025-12-14 16:40',
    status: 'rejected' as AuditStatus,
  },
];

const OrderAudit: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AuditStatus>('pending');

  const filteredAudits = MOCK_AUDITS.filter((a) => {
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchKeyword =
      !searchTerm ||
      a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.passenger.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchKeyword;
  });

  const renderStatusBadge = (status: AuditStatus) => {
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
          <RefreshCw className="w-3 h-3" />
          待审核
        </span>
      );
    }
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
          <CheckCircle2 className="w-3 h-3" />
          审核通过
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
          <XCircle className="w-3 h-3" />
          审核拒绝
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">退改签审核</h2>
          <p className="text-gray-500 mt-1 text-sm">集中处理所有用户发起的退票与改签申请</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            导出审核记录
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 md:max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索申请单号、订单号或乘客姓名..."
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full transition-all"
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
                onClick={() => setStatusFilter(opt.id as AuditStatus)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  statusFilter === opt.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">申请单号</th>
              <th className="px-6 py-4">订单号</th>
              <th className="px-6 py-4">乘客</th>
              <th className="px-6 py-4">操作类型</th>
              <th className="px-6 py-4">航班信息</th>
              <th className="px-6 py-4">提交时间</th>
              <th className="px-6 py-4">审核状态</th>
              <th className="px-6 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredAudits.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50/80 transition-colors group">
                <td className="px-6 py-4 font-mono text-gray-700">{a.id}</td>
                <td className="px-6 py-4 font-mono text-gray-600">{a.orderId}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-gray-900">{a.passenger}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      a.type === '退票' ? 'bg-red-50 text-red-700' : 'bg-indigo-50 text-indigo-700'
                    }`}
                  >
                    <Plane className="w-3 h-3" />
                    {a.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs text-gray-600">
                    <div>原航班：{a.oldFlight}</div>
                    {a.newFlight !== '-' && <div className="mt-1 text-blue-600">新航班：{a.newFlight}</div>}
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">{a.applyTime}</td>
                <td className="px-6 py-4">{renderStatusBadge(a.status)}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="px-3 py-1.5 text-xs rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium">
                      通过
                    </button>
                    <button className="px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium">
                      拒绝
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredAudits.length === 0 && (
              <tr>
                <td className="px-6 py-10 text-center text-sm text-gray-400" colSpan={8}>
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

