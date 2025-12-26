import React, { useEffect, useMemo, useState } from 'react';
import { Search, FileText, Shield, User, Globe, AlertCircle, CheckCircle, ScrollText, Download, RefreshCw } from 'lucide-react';
import { Pagination, AdminBadge, AdminPageHeader, FilterBar, AdminTableState, useAdminList, useToast } from '@/features/admin';
import { listSystemLogs, type SystemLogItem } from '@/features/admin/api/admins';
import EntityCell from '@/components/common/EntityCell';
import { formatDateTimeZhCN } from '@/shared/utils/formatters';
import { exportToCSV } from '@/shared/utils/export';

// 操作用户类型
const OPER_USER_TYPE = {
  USER: 1,
  ADMIN: 2,
} as const;

// 操作结果
const OPER_RESULT = {
  FAIL: 0,
  SUCCESS: 1,
} as const;

const SystemLogs: React.FC = () => {
  const toast = useToast();
  const ITEMS_PER_PAGE = 10;

  const [keywordInput, setKeywordInput] = useState('');
  const [moduleInput, setModuleInput] = useState('');
  const [resultFilter, setResultFilter] = useState<'all' | 'success' | 'fail'>('all');

  const operResultParam = useMemo(() => {
    if (resultFilter === 'success') return OPER_RESULT.SUCCESS;
    if (resultFilter === 'fail') return OPER_RESULT.FAIL;
    return undefined;
  }, [resultFilter]);

  const {
    items,
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
  } = useAdminList<SystemLogItem, { keyword?: string; module?: string; operResult?: number | undefined }>({
    pageSize: ITEMS_PER_PAGE,
    initialFilters: {
      keyword: undefined,
      module: undefined,
      operResult: undefined,
    },
    fetchFn: async ({ page: p, size, keyword, module, operResult }) => {
      const res = await listSystemLogs({
        page: p,
        size,
        keyword: keyword || undefined,
        module: module || undefined,
        operResult: operResult ?? undefined,
      });
      return { data: res.data ?? [], total: res.total ?? 0 };
    },
  });

  // 防抖输入 -> filters
  useEffect(() => {
    const t = setTimeout(() => {
      const nextKeyword = keywordInput.trim() || undefined;
      const nextModule = moduleInput.trim() || undefined;
      if (filters.keyword === nextKeyword && filters.module === nextModule) return;
      setFilters({ keyword: nextKeyword, module: nextModule });
    }, 300);
    return () => clearTimeout(t);
  }, [keywordInput, moduleInput, filters.keyword, filters.module, setFilters]);

  // 结果筛选 -> filters（立即生效）
  useEffect(() => {
    if (filters.operResult === operResultParam) return;
    setFilters({ operResult: operResultParam });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operResultParam, filters.operResult]);

  const handleSearch = () => {
    setFilters({ keyword: keywordInput.trim() || undefined, module: moduleInput.trim() || undefined, operResult: operResultParam });
  };

  const getUserTypeLabel = (type?: number) => {
    if (type === OPER_USER_TYPE.ADMIN) return '管理员';
    if (type === OPER_USER_TYPE.USER) return '用户';
    return '系统';
  };

  // 导出数据
  const handleExport = async () => {
    try {
      toast.info('正在导出数据...');
      const res = await listSystemLogs({ page: 1, size: 1000, keyword: filters.keyword, module: filters.module, operResult: filters.operResult });
      const data = res.data ?? [];
      if (!data.length) { toast.warning('暂无数据可导出'); return; }
      exportToCSV(data, '操作日志', [
        { key: 'logId', label: '日志ID' },
        { key: 'operTime', label: '时间', formatter: (i) => formatDateTimeZhCN(i.operTime) || '' },
        { key: 'operUserId', label: '操作人', formatter: (i) => String(i.operUserId ?? '系统') },
        { key: 'operUserType', label: '用户类型', formatter: (i) => getUserTypeLabel(i.operUserType) },
        { key: 'operModule', label: '模块', formatter: (i) => i.operModule || '' },
        { key: 'operType', label: '操作类型', formatter: (i) => i.operType || '' },
        { key: 'operContent', label: '操作内容', formatter: (i) => i.operContent || '' },
        { key: 'operIp', label: 'IP', formatter: (i) => i.operIp || '' },
        { key: 'operResult', label: '结果', formatter: (i) => i.operResult === 1 ? '成功' : '失败' },
      ]);
      toast.success('导出成功');
    } catch (e: any) {
      toast.error(e?.message || '导出失败');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <AdminPageHeader
        icon={ScrollText}
        iconClassName="text-indigo-500"
        title="操作日志"
        description="审计管理员关键操作，保障系统安全可追踪"
        actions={
          <button onClick={handleExport} className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center gap-2">
            <Download className="w-4 h-4" /> 导出数据
          </button>
        }
      />

      <FilterBar
        left={
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 md:max-w-xs w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索 IP 或操作内容..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <input
              type="text"
              placeholder="按模块筛选..."
              className="w-36 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm"
              value={moduleInput}
              onChange={(e) => setModuleInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {[
                { id: 'all', label: '全部' },
                { id: 'success', label: '成功' },
                { id: 'fail', label: '失败' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setResultFilter(opt.id as 'all' | 'success' | 'fail');
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${resultFilter === opt.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        }
        right={
          <button
            onClick={() => refresh(true)}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
            title="刷新"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible min-h-[400px] flex flex-col">
        <AdminTableState
          loading={loading}
          error={error}
          isEmpty={items.length === 0}
          onRetry={retry}
          emptyIcon={ScrollText}
          emptyTitle={filters.keyword || filters.module ? '未找到匹配日志' : '暂无操作日志'}
          emptyDescription={filters.keyword || filters.module ? '请尝试调整搜索条件' : '当前无操作日志记录'}
          skeletonRows={5}
          skeletonColumns={6}
        >
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">时间</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">操作人</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">模块</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">操作内容</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">来源 IP</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">结果</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((log) => (
                <tr key={log.logId} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">{formatDateTimeZhCN(log.operTime)}</td>
                  <td className="px-6 py-4">
                    <EntityCell
                      leading={
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-slate-100 flex items-center justify-center">
                          {log.operUserType === OPER_USER_TYPE.ADMIN ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                      }
                      title={
                        <>
                          {log.operUserId || '系统'}
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {getUserTypeLabel(log.operUserType)}
                          </span>
                        </>
                      }
                      titleClassName="text-sm font-semibold text-gray-900 flex items-center gap-2 min-w-0"
                      meta={[{ icon: User, text: `ID: ${log.logId}` }]}
                      metaClassName="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{log.operModule || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{log.operType}{log.operContent ? `: ${log.operContent}` : ''}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {log.operIp || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {log.operResult === OPER_RESULT.SUCCESS ? (
                      <AdminBadge icon={CheckCircle} variant="success">成功</AdminBadge>
                    ) : (
                      <AdminBadge icon={AlertCircle} variant="danger">失败</AdminBadge>
                    )}
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

export default SystemLogs;

