import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, Plane as PlaneIcon, Search, RefreshCw, Factory, Users, Layers, Download } from 'lucide-react';
import { Pagination, TableActionMenu, AdminBadge, AdminPageHeader, AdminModal, FilterBar, useAdminList, AdminTableState, useConfirm, useToast } from '@/features/admin';
import { formatApiError } from '@/utils/apiError';
import { listAircraftModels, createAircraftModel, updateAircraftModel, deleteAircraftModel, type AircraftModelItem } from '@/features/admin/api/aircraftModels';
import { listCabinConfigs } from '@/features/admin/api/cabinConfigs';
import EntityCell from '@/components/common/EntityCell';
import { exportToCSV } from '@/utils/export';

interface ModelFilters {
  keyword: string;
  [key: string]: unknown;
}

const AircraftModelsMgmt: React.FC = () => {
  const PAGE_SIZE = 10;
  const { confirm } = useConfirm();
  const toast = useToast();

  // 统计每个机型关联的舱位配置数
  const [cabinCounts, setCabinCounts] = useState<Record<number, number>>({});
  const [cabinCountsLoading, setCabinCountsLoading] = useState(false);
  const [cabinCountsLoaded, setCabinCountsLoaded] = useState(false);

  const fetchModels = useCallback(
    async (params: { page: number; size: number } & ModelFilters) => {
      const res = await listAircraftModels({
        page: params.page,
        size: params.size,
        keyword: params.keyword || undefined,
      });
      return { data: res.data ?? [], total: res.total ?? 0 };
    },
    []
  );

  const {
    items: models,
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
  } = useAdminList<AircraftModelItem, ModelFilters>({
    fetchFn: fetchModels,
    pageSize: PAGE_SIZE,
    initialFilters: { keyword: '' },
  });

  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    setKeywordInput(filters.keyword);
  }, [filters.keyword]);

  useEffect(() => {
    if (keywordInput === filters.keyword) return;
    const t = window.setTimeout(() => {
      setFilters({ keyword: keywordInput });
    }, 300);
    return () => window.clearTimeout(t);
  }, [keywordInput, filters.keyword, setFilters]);

  const loadCabinCounts = useCallback(async () => {
    const COUNT_PAGE_SIZE = 200;
    const MAX_PAGES = 200;

    setCabinCountsLoading(true);
    try {
      const counts: Record<number, number> = {};

      let currentPage = 1;
      let total = 0;
      let fetched = 0;

      while (currentPage <= MAX_PAGES) {
        const res = await listCabinConfigs({ page: currentPage, size: COUNT_PAGE_SIZE });
        const rows = res.data ?? [];

        if (currentPage === 1) {
          total = res.total ?? rows.length;
        }

        for (const c of rows) {
          counts[c.modelId] = (counts[c.modelId] || 0) + 1;
        }

        fetched += rows.length;

        if (rows.length === 0) break;
        if (total > 0 && fetched >= total) break;

        currentPage += 1;
      }

      setCabinCounts(counts);
      setCabinCountsLoaded(true);
    } catch (err) {
      console.error(err);
      setCabinCountsLoaded(false);
    } finally {
      setCabinCountsLoading(false);
    }
  }, []);

  // 加载舱位配置统计
  useEffect(() => {
    loadCabinCounts();
  }, [loadCabinCounts]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AircraftModelItem | null>(null);
  const [activeActionId, setActiveActionId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AircraftModelItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
    setActiveActionId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.target as HTMLFormElement);

    const totalPhysicalSeats = Number(fd.get('totalPhysicalSeats'));
    if (!Number.isFinite(totalPhysicalSeats) || totalPhysicalSeats < 1) {
      toast.error('座位容量必须是大于 0 的数字');
      setSaving(false);
      return;
    }

    const payload = {
      modelName: String(fd.get('modelName') ?? '').trim(),
      manufacturer: String(fd.get('manufacturer') ?? '').trim() || undefined,
      totalPhysicalSeats,
    };

    try {
      if (editingItem?.modelId) {
        await updateAircraftModel(editingItem.modelId, payload);
        toast.success('机型更新成功');
      } else {
        await createAircraftModel(payload);
        toast.success('机型创建成功');
      }
      setIsModalOpen(false);
      setEditingItem(null);
      refresh();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: AircraftModelItem) => {
    const cabinCount = cabinCounts[item.modelId] || 0;
    const ok = await confirm({
      title: '删除机型',
      message: cabinCount > 0
        ? `该机型关联了 ${cabinCount} 个舱位配置，删除后相关配置也将失效。确定删除「${item.modelName}」吗？`
        : `确定删除机型「${item.modelName}」吗？此操作不可恢复。`,
      confirmText: '删除',
      cancelText: '取消',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await deleteAircraftModel(item.modelId);
      toast.success('机型已删除');
      refresh();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  // 导出数据
  const handleExport = async () => {
    try {
      toast.info('正在导出数据...');
      const res = await listAircraftModels({ page: 1, size: 1000, keyword: filters.keyword || undefined });
      const data = res.data ?? [];
      if (!data.length) { toast.warning('暂无数据可导出'); return; }
      exportToCSV(data, '机型列表', [
        { key: 'modelId', label: '机型ID' },
        { key: 'modelName', label: '机型名称' },
        { key: 'manufacturer', label: '制造商', formatter: (i) => i.manufacturer || '' },
        { key: 'totalPhysicalSeats', label: '座位容量' },
      ]);
      toast.success('导出成功');
    } catch (e: any) {
      toast.error(e?.message || '导出失败');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <AdminPageHeader
        icon={PlaneIcon}
        iconClassName="text-sky-500"
        title="机型管理"
        description="管理飞机机型数据，包括机型名称、制造商、座位容量等信息"
        actions={
          <div className="flex items-center gap-3">
            <button onClick={handleExport} className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center gap-2">
              <Download className="w-4 h-4" /> 导出数据
            </button>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/30 transition-all duration-300 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> 新增机型
            </button>
          </div>
        }
      />

      <FilterBar
        left={
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索机型名称或制造商..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all outline-none text-sm"
            />
          </div>
        }
        right={
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">共 {total} 种机型</span>
            <button
              onClick={() => {
                refresh();
                loadCabinCounts();
              }}
              disabled={loading}
              className="p-2.5 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors disabled:opacity-50"
              title="刷新数据"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-visible">
        <AdminTableState
          loading={loading}
          error={error}
          isEmpty={models.length === 0}
          onRetry={retry}
          emptyIcon={PlaneIcon}
          emptyTitle={filters.keyword ? '未找到匹配机型' : '暂无机型数据'}
          emptyDescription={filters.keyword ? '尝试调整搜索关键词' : '点击「新增机型」添加第一个机型'}
          emptyActionText={!filters.keyword ? '新增机型' : undefined}
          onEmptyAction={!filters.keyword ? handleOpenCreate : undefined}
          skeletonRows={5}
          skeletonColumns={5}
        >
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">机型信息</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">制造商</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">座位容量</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">舱位配置</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {models.map((m) => (
                <tr key={m.modelId} className="hover:bg-sky-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <EntityCell
                      leading={
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center text-sky-600 shadow-sm">
                          <PlaneIcon className="w-5 h-5" />
                        </div>
                      }
                      title={m.modelName}
                      subtitle={`ID: ${m.modelId}`}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Factory className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{m.manufacturer || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-sky-500" />
                      <span className="text-lg font-bold text-gray-900">{m.totalPhysicalSeats}</span>
                      <span className="text-sm text-gray-500">座</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {!cabinCountsLoaded && cabinCountsLoading ? (
                      <span className="text-sm text-gray-400">统计中...</span>
                    ) : cabinCounts[m.modelId] ? (
                      <AdminBadge variant="info" size="sm" className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {cabinCounts[m.modelId]} 个配置
                      </AdminBadge>
                    ) : (
                      <span className="text-sm text-gray-400">未配置</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <TableActionMenu
                      isOpen={activeActionId === m.modelId}
                      onToggle={(e) => { e.stopPropagation(); setActiveActionId(activeActionId === m.modelId ? null : m.modelId); }}
                      onClose={() => setActiveActionId(null)}
                    >
                      <button onClick={() => handleOpenEdit(m)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                        <Edit2 className="w-4 h-4 text-sky-500" /> 编辑机型
                      </button>
                      <button onClick={() => handleDelete(m)} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors">
                        <Trash2 className="w-4 h-4" /> 删除机型
                      </button>
                    </TableActionMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-gray-100">
            <Pagination currentPage={page} totalPages={totalPages} setPage={setPage} totalItems={total} itemsPerPage={PAGE_SIZE} />
          </div>
        </AdminTableState>
      </div>

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        title={editingItem ? '编辑机型' : '新增机型'}
        theme="sky-blue"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600">机型名称 *</label>
            <input
              name="modelName"
              defaultValue={editingItem?.modelName}
              required
              placeholder="如: Boeing 737-800"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600">制造商</label>
            <input
              name="manufacturer"
              defaultValue={editingItem?.manufacturer ?? ''}
              placeholder="如: Boeing / Airbus"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600">座位容量 *</label>
            <input
              type="number"
              name="totalPhysicalSeats"
              defaultValue={editingItem?.totalPhysicalSeats ?? ''}
              required
              min={1}
              placeholder="如: 189"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
            />
            <p className="text-xs text-gray-500">该机型的物理座位总数上限</p>
          </div>

          <div className="pt-4 flex gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingItem(null);
              }}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-gradient-to-r from-sky-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/25 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};

export default AircraftModelsMgmt;
