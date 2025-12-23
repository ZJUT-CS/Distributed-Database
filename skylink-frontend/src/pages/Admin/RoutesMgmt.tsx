import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, MapPin, Plane as PlaneIcon, Download, Search, RefreshCw, Clock, Route } from 'lucide-react';
import { Pagination, TableActionMenu, AdminBadge, AdminPageHeader, AdminModal, FilterBar, useAdminList, AdminTableState, useConfirm, useToast } from '@/features/admin';
import { formatApiError } from '@/utils/apiError';
import { listRoutes, createRoute, updateRoute, deleteRoute, type RouteItem } from '@/features/admin/api/routes';
import EntityCell from '@/components/common/EntityCell';

interface RouteFilters {
  keyword: string;
  [key: string]: unknown;
}

const RoutesMgmt: React.FC = () => {
  const PAGE_SIZE = 10;
  const { confirm } = useConfirm();
  const toast = useToast();

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RouteItem | null>(null);
  const [activeActionId, setActiveActionId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
    const fd = new FormData(e.target as HTMLFormElement);

    const payload = {
      departureCity: String(fd.get('departureCity') ?? '').trim(),
      departureAirport: String(fd.get('departureAirport') ?? '').trim().toUpperCase(),
      arrivalCity: String(fd.get('arrivalCity') ?? '').trim(),
      arrivalAirport: String(fd.get('arrivalAirport') ?? '').trim().toUpperCase(),
      basePrice: Number(fd.get('basePrice')),
      estimatedDuration: fd.get('estimatedDuration') ? Number(fd.get('estimatedDuration')) : undefined,
      distanceKm: fd.get('distanceKm') ? Number(fd.get('distanceKm')) : undefined,
    };

    try {
      if (editingItem?.routeId) {
        await updateRoute(editingItem.routeId, payload);
        toast.success('航线更新成功');
      } else {
        await createRoute(payload);
        toast.success('航线创建成功');
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

  const handleDelete = async (item: RouteItem) => {
    const ok = await confirm({
      title: '删除航线',
      message: `确定删除航线「${item.departureCity} → ${item.arrivalCity}」吗？此操作不可恢复。`,
      confirmText: '删除',
      cancelText: '取消',
      variant: 'danger',
    });
    if (!ok) return;
    
    try {
      await deleteRoute(item.routeId);
      toast.success('航线已删除');
      refresh();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const formatDuration = (minutes?: number | null) => {
    if (!minutes) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <AdminPageHeader
        icon={MapPin}
        iconClassName="text-emerald-500"
        title="航线管理"
        description="管理航线基础数据，包括出发/到达城市、机场代码、基准票价等信息"
        actions={
          <div className="flex items-center gap-3">
            <button className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm">
              <Download className="w-4 h-4" /> 导出
            </button>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> 新增航线
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
              placeholder="搜索城市名称或机场代码..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none text-sm"
            />
          </div>
        }
        right={
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">共 {total} 条航线</span>
            <button
              onClick={() => refresh()}
              disabled={loading}
              className="p-2.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors disabled:opacity-50"
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
          isEmpty={routes.length === 0}
          onRetry={retry}
          emptyIcon={MapPin}
          emptyTitle={filters.keyword ? '未找到匹配航线' : '暂无航线数据'}
          emptyDescription={filters.keyword ? '尝试调整搜索关键词' : '点击「新增航线」创建第一条航线'}
          emptyActionText={!filters.keyword ? '新增航线' : undefined}
          onEmptyAction={!filters.keyword ? handleOpenCreate : undefined}
          skeletonRows={5}
          skeletonColumns={5}
        >
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">航线信息</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">距离 / 时长</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">基准票价</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {routes.map((r) => (
                <tr key={r.routeId} className="hover:bg-emerald-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <EntityCell
                      leading={
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center text-emerald-600 shadow-sm">
                          <Route className="w-5 h-5" />
                        </div>
                      }
                      title={
                        <span className="flex items-center gap-2">
                          <span className="font-semibold">{r.departureCity || '-'}</span>
                          <PlaneIcon className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold">{r.arrivalCity || '-'}</span>
                        </span>
                      }
                      subtitle={
                        <span className="font-mono text-xs">
                          {r.departureAirport || '---'} → {r.arrivalAirport || '---'}
                        </span>
                      }
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-gray-900">
                        {r.distanceKm ? `${r.distanceKm.toLocaleString()} km` : '-'}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(r.estimatedDuration)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-lg font-bold text-emerald-600">
                      ¥{Number(r.basePrice).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <AdminBadge variant="success" size="sm">运营中</AdminBadge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <TableActionMenu
                      isOpen={activeActionId === r.routeId}
                      onToggle={(e) => { e.stopPropagation(); setActiveActionId(activeActionId === r.routeId ? null : r.routeId); }}
                      onClose={() => setActiveActionId(null)}
                    >
                      <button onClick={() => handleOpenEdit(r)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                        <Edit2 className="w-4 h-4 text-emerald-500" /> 编辑航线
                      </button>
                      <button onClick={() => handleDelete(r)} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors">
                        <Trash2 className="w-4 h-4" /> 删除航线
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
        title={editingItem ? '编辑航线' : '新增航线'}
        theme="emerald-teal"
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600">出发城市 *</label>
              <input name="departureCity" defaultValue={editingItem?.departureCity} required placeholder="如: 上海" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600">机场代码 *</label>
              <input name="departureAirport" defaultValue={editingItem?.departureAirport} required placeholder="SHA" maxLength={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600">到达城市 *</label>
              <input name="arrivalCity" defaultValue={editingItem?.arrivalCity} required placeholder="如: 北京" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600">机场代码 *</label>
              <input name="arrivalAirport" defaultValue={editingItem?.arrivalAirport} required placeholder="PEK" maxLength={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600">基准票价 (¥) *</label>
              <input type="number" name="basePrice" defaultValue={editingItem ? Number(editingItem.basePrice) : ''} required min={1} placeholder="800" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600">飞行时长 (分钟)</label>
              <input type="number" name="estimatedDuration" defaultValue={editingItem?.estimatedDuration ?? ''} min={1} placeholder="120" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600">航程距离 (km)</label>
              <input type="number" name="distanceKm" defaultValue={editingItem?.distanceKm ?? ''} min={1} placeholder="1200" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
            </div>
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
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};

export default RoutesMgmt;
