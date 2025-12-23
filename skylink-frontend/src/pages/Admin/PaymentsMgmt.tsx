import React, { useState } from 'react';
import { Download, Eye, AlertCircle, FileText, CreditCard, Wallet, Search } from 'lucide-react';
import { INITIAL_TRANSACTIONS } from '../../utils/mockData';
import { Pagination, TableActionMenu, AdminBadge, AdminPageHeader, FilterBar, EmptyState, PAYMENT_TYPE_OPTIONS, PAYMENT_TYPE_MAP, PAYMENT_STATUS_MAP } from '@/features/admin';
import EntityCell from '@/components/common/EntityCell';

const PaymentsMgmt: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 8;

  const filteredTransactions = INITIAL_TRANSACTIONS.filter(t => 
    (typeFilter === 'all' || t.type === typeFilter) &&
    (t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.user.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

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
              placeholder="搜索流水号、用户..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        }
        right={
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {PAYMENT_TYPE_OPTIONS.map(type => (
              <button
                key={type.value}
                onClick={() => { setTypeFilter(type.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all whitespace-nowrap ${typeFilter === type.value ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {type.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px] flex flex-col">
        {paginatedTransactions.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title={searchTerm ? '未找到匹配结果' : '暂无交易记录'}
            description={searchTerm ? '请尝试调整搜索关键词或筛选条件' : '新的支付/退款记录将显示在这里'}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">流水信息</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">类型</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">金额</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">时间</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedTransactions.map(t => (
                    <tr key={t.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <EntityCell
                          leading={
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${t.type === 'payment' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                              <Wallet className="w-5 h-5" />
                            </div>
                          }
                          title={t.id}
                          meta={[{ text: t.user }]}
                          titleClassName="font-mono text-gray-800 flex items-center gap-2 min-w-0"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <AdminBadge variant={PAYMENT_TYPE_MAP[t.type]?.variant || 'primary'}>
                          {PAYMENT_TYPE_MAP[t.type]?.label || t.type}
                        </AdminBadge>
                      </td>
                      <td className={`px-6 py-4 font-bold ${t.type === 'refund' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {t.type === 'refund' ? '-' : '+'}¥{t.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <AdminBadge dot variant={PAYMENT_STATUS_MAP[t.status]?.variant || 'info'}>
                          {PAYMENT_STATUS_MAP[t.status]?.label || t.status}
                        </AdminBadge>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">{t.time}</td>
                      <td className="px-6 py-4 text-right">
                        <TableActionMenu
                          isOpen={activeActionId === t.id}
                          onToggle={(e) => { e.stopPropagation(); setActiveActionId(activeActionId === t.id ? null : t.id); }}
                          onClose={() => setActiveActionId(null)}
                        >
                          <button className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <Eye className="w-3.5 h-3.5 text-indigo-500" /> 查看详情
                          </button>
                          <button className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-gray-500" /> 电子回单
                          </button>
                          <div className="h-px bg-gray-100 my-0"></div>
                          <button className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5" /> 申诉交易
                          </button>
                        </TableActionMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              setPage={setPage}
              totalItems={filteredTransactions.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentsMgmt;
