import React, { useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Save, MapPin, Plane as PlaneIcon, Download, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { Pagination, TableActionMenu, AdminBadge, AdminPageHeader, AdminModal, FilterBar, EmptyState, TableSkeleton, useAdminList } from '@/features/admin';
import { listRoutes, createRoute, updateRoute, deleteRoute, type RouteItem } from '@/features/admin/api/routes';
import EntityCell from '@/components/common/EntityCell';

interface RouteFilters {
  keyword: string;
  [key: string]: unknown;
}

const RoutesMgmt: React.FC = () => {
  const PAGE_SIZE = 10;

  // 使用 useAdminList 统一管理列表状态
  const fetchRoutes = useCallback(
    async (params: { page: number; size: number } & RouteFilters) => {
      const res = await listRoutes({
        page: params.page,
        size: params.size,
        keyword: params.keyword || undefined,
      });
      return { data: res.data ?? [], total: res.total ?? 0 };
    },
    []
  );

  const {
    items: routes,
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
  } = useAdminList<RouteItem, RouteFilters>({
    fetchFn: fetchRoutes,
    pageSize: PAGE_SIZE,
    initialFilters: { keyword: '' },
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RouteItem | null>(null);
  const [activeActionId, setActiveActionId] = useState<number | null>(null);

  const handleSearch = () => {
    // setFilters 会自动重置到第一页
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RouteItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
    setActiveActionId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);

    const departureCity = String(fd.get('departureCity') ?? '').trim();
    const departureAirport = String(fd.get('departureAirport') ?? '').trim().toUpperCase();
    const arrivalCity = String(fd.get('arrivalCity') ?? '').trim();
    const arrivalAirport = String(fd.get('arrivalAirport') ?? '').trim().toUpperCase();
    const basePrice = Number(fd.get('basePrice'));
    const estimatedDuration = fd.get('estimatedDuration') ? Number(fd.get('estimatedDuration')) : undefined;
    const distanceKm = fd.get('distanceKm') ? Number(fd.get('distanceKm')) : undefined;

    try {
      if (editingItem?.routeId) {
        const ok = await updateRoute(editingItem.routeId, {
          departureCity,
          departureAirport,
          arrivalCity,
          arrivalAirport,
          basePrice,
          estimatedDuration,
          distanceKm,
        });
        if (!ok) throw new Error('保存失败');
      } else {
        await createRoute({ departureCity, departureAirport, arrivalCity, arrivalAirport, basePrice, estimatedDuration, distanceKm });
      }
      setIsModalOpen(false);
      refresh();
    } catch (err: any) {
      alert(err?.message || '操作失败');
    }
  };

  const handleDelete = async (routeId: number) => {
    if (!confirm('确定删除该航线吗？')) return;
    try {
      await deleteRoute(routeId);
      refresh();
    } catch (err: any) {
      alert(err?.message || '删除失败');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <AdminPageHeader
        icon={MapPin}
        iconClassName="text-indigo-500"
        title="航线管理"
        description="管理航线基础数据（出发/到达城市、机场三字码、基准票价）"
        actions={
          <div className="flex items-center gap-3">
            <button className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center gap-2">
              <Download className="w-4 h-4" /> 导出数据
            </button>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新增航线
            </button>
          </div>
        }
      />

      {/* Search Bar */}
      <FilterBar
        left={
          <div className="relative flex-1 md:max-w-md w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索城市或机场三字码..."
              value={filters.keyword}
              onChange={(e) => setFilters({ keyword: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm"
            />
          </div>
        }
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => refresh()}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
              title="刷新"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        {loading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : error ? (
          <EmptyState
            icon={AlertCircle}
            title="加载失败"
            description={error}
            actionText="重试"
            onAction={retry}
          />
        ) : routes.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title={filters.keyword ? '未找到匹配结果' : '暂无航线数据'}
            description={filters.keyword ? '请尝试调整搜索关键词' : '点击上方按钮创建第一条航线'}
            actionText={filters.keyword ? undefined : '新增航线'}
            onAction={filters.keyword ? undefined : handleOpenCreate}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">航线</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">出发机场</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">到达机场</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">基准票价</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">预计时长</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {routes.map((r) => (
                    <tr key={r.routeId} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <EntityCell
                          leading={
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                              <PlaneIcon className="w-5 h-5" />
                            </div>
                          }
                          title={`${r.departureCity || '-'} → ${r.arrivalCity || '-'}`}
                          subtitle={`#${r.routeId}`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <AdminBadge size="sm" variant="info" className="font-mono">{r.departureAirport || '-'}</AdminBadge>
                      </td>
                      <td className="px-6 py-4">
                        <AdminBadge size="sm" variant="primary" className="font-mono">{r.arrivalAirport || '-'}</AdminBadge>
                      </td>
                      <td className="px-6 py-4">
                        <AdminBadge size="sm" variant="success">¥{Number(r.basePrice).toFixed(0)}</AdminBadge>
                      </td>
                      <td className="px-6 py-4">
                        <AdminBadge size="sm" variant={r.estimatedDuration ? 'warning' : 'info'}>
                          {r.estimatedDuration ? `${r.estimatedDuration}分钟` : '-'}
                        </AdminBadge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <TableActionMenu
                          isOpen={activeActionId === r.routeId}
                          onToggle={(e) => { e.stopPropagation(); setActiveActionId(activeActionId === r.routeId ? null : r.routeId); }}
                          onClose={() => setActiveActionId(null)}
                        >
                          <button onClick={() => handleOpenEdit(r)} className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <Edit2 className="w-3.5 h-3.5 text-indigo-500" /> 编辑
                          </button>
                          <button onClick={() => handleDelete(r.routeId)} className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2">
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
          </>
        )}
      </div>

      {/* Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? '编辑航线' : '新增航线'}
        theme="indigo-purple"
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">出发城市</label>
              <input name="departureCity" defaultValue={editingItem?.departureCity} required placeholder="如: 上海" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">出发机场 (三字码)</label>
              <input name="departureAirport" defaultValue={editingItem?.departureAirport} required placeholder="如: SHA" maxLength={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">到达城市</label>
              <input name="arrivalCity" defaultValue={editingItem?.arrivalCity} required placeholder="如: 北京" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">到达机场 (三字码)</label>
              <input name="arrivalAirport" defaultValue={editingItem?.arrivalAirport} required placeholder="如: PEK" maxLength={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">基准票价 (¥)</label>
              <input type="number" name="basePrice" defaultValue={editingItem ? Number(editingItem.basePrice) : ''} required min={1} placeholder="如: 800" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">预计时长 (分钟)</label>
              <input type="number" name="estimatedDuration" defaultValue={editingItem?.estimatedDuration ?? ''} min={1} placeholder="如: 120" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">距离 (km)</label>
              <input type="number" name="distanceKm" defaultValue={editingItem?.distanceKm ?? ''} min={1} placeholder="如: 1200" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">取消</button>
            <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> 保存
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};

export default RoutesMgmt;
