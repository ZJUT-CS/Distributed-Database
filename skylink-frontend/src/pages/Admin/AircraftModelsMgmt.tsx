import React, { useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Save, Plane as PlaneIcon, Search, X, RefreshCw } from 'lucide-react';
import { Pagination, TableActionMenu, AdminBadge, AdminPageHeader, FilterBar, useAdminList, AdminTableState } from '@/features/admin';
import { formatApiError } from '@/utils/apiError';
import { listAircraftModels, createAircraftModel, updateAircraftModel, deleteAircraftModel, type AircraftModelItem } from '@/features/admin/api/aircraftModels';
import EntityCell from '@/components/common/EntityCell';

interface ModelFilters {
  keyword: string;
  [key: string]: unknown;
}

const AircraftModelsMgmt: React.FC = () => {
  const PAGE_SIZE = 10;

  // 使用 useAdminList 统一管理列表状态
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AircraftModelItem | null>(null);
  const [activeActionId, setActiveActionId] = useState<number | null>(null);

  const handleSearch = () => {
    // setFilters 已经自动重置到第一页，无需额外操作
  };

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
    const fd = new FormData(e.target as HTMLFormElement);

    const modelName = String(fd.get('modelName') ?? '').trim();
    const manufacturer = String(fd.get('manufacturer') ?? '').trim() || undefined;
    const totalPhysicalSeats = Number(fd.get('totalPhysicalSeats'));

    try {
      if (editingItem?.modelId) {
        const ok = await updateAircraftModel(editingItem.modelId, { modelName, manufacturer, totalPhysicalSeats });
        if (!ok) throw new Error('保存失败');
      } else {
        await createAircraftModel({ modelName, manufacturer, totalPhysicalSeats });
      }
      setIsModalOpen(false);
      refresh();
    } catch (err: any) {
      alert(formatApiError(err));
    }
  };

  const handleDelete = async (modelId: number) => {
    if (!confirm('确定删除该机型吗？')) return;
    try {
      await deleteAircraftModel(modelId);
      refresh();
    } catch (err: any) {
      alert(formatApiError(err));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <AdminPageHeader
        icon={PlaneIcon}
        iconClassName="text-indigo-500"
        title="机型管理"
        description="管理飞机机型基础数据（机型名称、制造商、物理座位上限）"
        actions={
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新增机型
          </button>
        }
      />

      {/* Search Bar */}
      <FilterBar
        left={
          <div className="relative flex-1 md:max-w-md w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索机型名称或制造商..."
              value={filters.keyword}
              onChange={(e) => setFilters({ keyword: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm"
            />
          </div>
        }
        right={
          <button
            onClick={() => refresh()}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
            title="刷新"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-visible min-h-[400px] flex flex-col">
        <AdminTableState
          loading={loading}
          error={error}
          isEmpty={models.length === 0}
          onRetry={retry}
          emptyIcon={PlaneIcon}
          emptyTitle={filters.keyword ? '未找到匹配结果' : '暂无机型数据'}
          emptyDescription={filters.keyword ? '请尝试调整搜索关键词' : '点击上方按钮创建第一个机型'}
          emptyActionText={filters.keyword ? undefined : '新增机型'}
          onEmptyAction={filters.keyword ? undefined : handleOpenCreate}
          skeletonRows={5}
          skeletonColumns={4}
        >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">机型信息</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">制造商</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">物理座位上限</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {models.map((m) => (
                    <tr key={m.modelId} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <EntityCell
                          leading={
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                              <PlaneIcon className="w-5 h-5" />
                            </div>
                          }
                          title={m.modelName}
                          subtitle={`#${m.modelId}`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <AdminBadge size="sm" variant="info">{m.manufacturer || '-'}</AdminBadge>
                      </td>
                      <td className="px-6 py-4">
                        <AdminBadge size="sm" variant="success">{m.totalPhysicalSeats} 座</AdminBadge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <TableActionMenu
                          isOpen={activeActionId === m.modelId}
                          onToggle={(e) => { e.stopPropagation(); setActiveActionId(activeActionId === m.modelId ? null : m.modelId); }}
                          onClose={() => setActiveActionId(null)}
                        >
                          <button onClick={() => handleOpenEdit(m)} className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <Edit2 className="w-3.5 h-3.5 text-indigo-500" /> 编辑
                          </button>
                          <button onClick={() => handleDelete(m.modelId)} className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2">
                            <Trash2 className="w-3.5 h-3.5" /> 删除
                          </button>
                        </TableActionMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={page} totalPages={totalPages} setPage={setPage} totalItems={total} itemsPerPage={PAGE_SIZE} />
        </AdminTableState>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{editingItem ? '编辑机型' : '新增机型'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">机型名称</label>
                <input name="modelName" defaultValue={editingItem?.modelName} required placeholder="如: Boeing 737-800" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">制造商 (可选)</label>
                <input name="manufacturer" defaultValue={editingItem?.manufacturer ?? ''} placeholder="如: Boeing / Airbus" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">物理座位上限</label>
                <input type="number" name="totalPhysicalSeats" defaultValue={editingItem?.totalPhysicalSeats ?? ''} required min={1} placeholder="如: 189" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">取消</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-500/30 transition-colors flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> 保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AircraftModelsMgmt;
