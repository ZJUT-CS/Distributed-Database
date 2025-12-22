import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Save, MapPin, Plane as PlaneIcon } from 'lucide-react';
import { Pagination, TableActionMenu } from '@/features/admin';
import { listRoutes, createRoute, updateRoute, deleteRoute, type RouteItem } from '@/features/admin/api/routes';

const RoutesMgmt: React.FC = () => {
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  const PAGE_SIZE = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RouteItem | null>(null);
  const [activeActionId, setActiveActionId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await listRoutes({ page, size: PAGE_SIZE, keyword: keyword || undefined });
      setRoutes(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch (err: any) {
      console.error('加载航线失败', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    loadData();
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
      loadData();
    } catch (err: any) {
      alert(err?.message || '操作失败');
    }
  };

  const handleDelete = async (routeId: number) => {
    if (!confirm('确定删除该航线吗？')) return;
    try {
      await deleteRoute(routeId);
      loadData();
    } catch (err: any) {
      alert(err?.message || '删除失败');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-500" />
            航线管理
          </h2>
          <p className="text-gray-500 mt-1 text-sm">管理航线基础数据（出发/到达城市、机场三字码、基准票价）</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增航线
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 md:max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索城市或机场三字码..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm"
          />
        </div>
        <button onClick={handleSearch} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
          搜索
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">航线ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">出发城市</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">出发机场</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">到达城市</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">到达机场</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">基准票价</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">预计时长</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">加载中...</td>
                </tr>
              ) : routes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">暂无航线数据</td>
                </tr>
              ) : (
                routes.map((r) => (
                  <tr key={r.routeId} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">{r.routeId}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.departureCity}</td>
                    <td className="px-6 py-4 text-sm font-mono text-blue-600">{r.departureAirport}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.arrivalCity}</td>
                    <td className="px-6 py-4 text-sm font-mono text-blue-600">{r.arrivalAirport}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">¥{Number(r.basePrice).toFixed(0)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{r.estimatedDuration ? `${r.estimatedDuration}分钟` : '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <TableActionMenu
                        isOpen={activeActionId === r.routeId}
                        onToggle={(e) => { e.stopPropagation(); setActiveActionId(activeActionId === r.routeId ? null : r.routeId); }}
                        onClose={() => setActiveActionId(null)}
                      >
                        <button onClick={() => handleOpenEdit(r)} className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <Edit2 className="w-3.5 h-3.5 text-blue-500" /> 编辑
                        </button>
                        <button onClick={() => handleDelete(r.routeId)} className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2">
                          <Trash2 className="w-3.5 h-3.5" /> 删除
                        </button>
                      </TableActionMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination currentPage={page} totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))} setPage={setPage} totalItems={total} itemsPerPage={PAGE_SIZE} />
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{editingItem ? '编辑航线' : '新增航线'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">出发城市</label>
                  <input name="departureCity" defaultValue={editingItem?.departureCity} required placeholder="如: 上海" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">出发机场 (三字码)</label>
                  <input name="departureAirport" defaultValue={editingItem?.departureAirport} required placeholder="如: SHA" maxLength={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">到达城市</label>
                  <input name="arrivalCity" defaultValue={editingItem?.arrivalCity} required placeholder="如: 北京" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">到达机场 (三字码)</label>
                  <input name="arrivalAirport" defaultValue={editingItem?.arrivalAirport} required placeholder="如: PEK" maxLength={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">基准票价 (¥)</label>
                  <input type="number" name="basePrice" defaultValue={editingItem ? Number(editingItem.basePrice) : ''} required min={1} placeholder="如: 800" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">预计时长 (分钟)</label>
                  <input type="number" name="estimatedDuration" defaultValue={editingItem?.estimatedDuration ?? ''} min={1} placeholder="如: 120" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">距离 (km)</label>
                  <input type="number" name="distanceKm" defaultValue={editingItem?.distanceKm ?? ''} min={1} placeholder="如: 1200" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">取消</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/30 transition-colors flex items-center justify-center gap-2">
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

export default RoutesMgmt;
