import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Save, Sliders, Plane as PlaneIcon, Download, Search, X } from 'lucide-react';
import { Pagination, TableActionMenu, AdminBadge, AdminPageHeader, AdminModal, FilterBar, TableSkeleton, EmptyState } from '@/features/admin';
import {
  listCabinConfigs,
  createCabinConfig,
  updateCabinConfig,
  deleteCabinConfig,
  CABIN_TYPE_OPTIONS,
  CABIN_TYPE_MAP,
  type CabinConfigItem,
} from '@/features/admin/api/cabinConfigs';
import { listAircraftModelOptions, type AircraftModelOption } from '@/features/admin/api/aircraftModels';
import EntityCell from '@/components/common/EntityCell';

const CabinConfigsMgmt: React.FC = () => {
  const [configs, setConfigs] = useState<CabinConfigItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterModelId, setFilterModelId] = useState<number | ''>('');
  const [filterCabinType, setFilterCabinType] = useState('');

  const PAGE_SIZE = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CabinConfigItem | null>(null);
  const [activeActionId, setActiveActionId] = useState<number | null>(null);

  // 机型下拉选项
  const [modelOptions, setModelOptions] = useState<AircraftModelOption[]>([]);

  useEffect(() => {
    listAircraftModelOptions().then(setModelOptions).catch(console.error);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await listCabinConfigs({
        page,
        size: PAGE_SIZE,
        modelId: filterModelId !== '' ? filterModelId : undefined,
        cabinType: filterCabinType || undefined,
      });
      setConfigs(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err: any) {
      console.error('加载舱位配置失败', err);
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

  const handleOpenEdit = (item: CabinConfigItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
    setActiveActionId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);

    const modelId = Number(fd.get('modelId'));
    const cabinType = String(fd.get('cabinType') ?? '').trim().toUpperCase();
    const cabinCoefficient = Number(fd.get('cabinCoefficient'));
    const cabinLayoutNo = Number(fd.get('cabinLayoutNo'));
    const capacity = Number(fd.get('capacity'));
    const startRowNum = Number(fd.get('startRowNum'));
    const seatColLayout = String(fd.get('seatColLayout') ?? '').trim().toUpperCase();
    const defaultCarryOn = String(fd.get('defaultCarryOn') ?? '').trim() || undefined;
    const defaultChecked = String(fd.get('defaultChecked') ?? '').trim() || undefined;

    try {
      if (editingItem?.configId) {
        const ok = await updateCabinConfig(editingItem.configId, {
          modelId,
          cabinType,
          cabinCoefficient,
          cabinLayoutNo,
          capacity,
          startRowNum,
          seatColLayout,
          defaultCarryOn,
          defaultChecked,
        });
        if (!ok) throw new Error('保存失败');
      } else {
        await createCabinConfig({
          modelId,
          cabinType,
          cabinCoefficient,
          cabinLayoutNo,
          capacity,
          startRowNum,
          seatColLayout,
          defaultCarryOn,
          defaultChecked,
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err?.message || '操作失败');
    }
  };

  const handleDelete = async (configId: number) => {
    if (!confirm('确定删除该舱位配置吗？')) return;
    try {
      await deleteCabinConfig(configId);
      loadData();
    } catch (err: any) {
      alert(err?.message || '删除失败');
    }
  };

  const getModelName = (modelId: number) => {
    const opt = modelOptions.find((m) => m.modelId === modelId);
    return opt?.modelName || String(modelId);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <AdminPageHeader
        icon={Sliders}
        iconClassName="text-indigo-500"
        title="舱位配置管理"
        description="管理机型舱位配置（舱位类型、系数、座位布局规则）"
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
              新增配置
            </button>
          </div>
        }
      />

      {/* Filter Bar */}
      <FilterBar
        left={
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterModelId}
              onChange={(e) => setFilterModelId(e.target.value ? Number(e.target.value) : '')}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            >
              <option value="">全部机型</option>
              {modelOptions.map((m) => (
                <option key={m.modelId} value={m.modelId}>{m.modelName}</option>
              ))}
            </select>
            <select
              value={filterCabinType}
              onChange={(e) => setFilterCabinType(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            >
              <option value="">全部舱位</option>
              {CABIN_TYPE_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        }
        right={
          <button onClick={handleSearch} className="px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">
            筛选
          </button>
        }
      />

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : configs.length === 0 ? (
          <EmptyState
            icon={Sliders}
            title="暂无舱位配置数据"
            description="点击上方按钮创建第一个舱位配置"
            actionText="新增配置"
            onAction={handleOpenCreate}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">配置信息</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">舱位 & 系数</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">布局 & 座位</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">行李</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">座位规则</th>
                    <th className="px-4 py-4 text-right text-xs font-semibold text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {configs.map((c) => (
                    <tr key={c.configId} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <EntityCell
                          leading={
                            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                              <Sliders className="w-5 h-5" />
                            </div>
                          }
                          title={c.modelName || getModelName(c.modelId)}
                          subtitle={`#${c.configId}`}
                        />
                      </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <AdminBadge
                          size="sm"
                          variant={c.cabinType === 'FIRST' ? 'warning' : c.cabinType === 'BUSINESS' ? 'info' : 'primary'}
                        >
                          {CABIN_TYPE_MAP[c.cabinType] || c.cabinType}
                        </AdminBadge>
                        <AdminBadge size="sm" variant="success">×{Number(c.cabinCoefficient).toFixed(1)}</AdminBadge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <AdminBadge size="sm" variant="info">布局 {c.cabinLayoutNo}</AdminBadge>
                        <AdminBadge size="sm" variant="primary">{c.capacity} 座</AdminBadge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const carryOn = String(c.defaultCarryOn ?? '').trim() || '-';
                        const checked = String(c.defaultChecked ?? '').trim() || '-';
                        return (
                          <div className="flex flex-col gap-1">
                            <AdminBadge size="sm" variant="info">随身 {carryOn}</AdminBadge>
                            <AdminBadge size="sm" variant="warning">托运 {checked}</AdminBadge>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <AdminBadge size="sm" variant="info">从第 {c.startRowNum} 排</AdminBadge>
                        <AdminBadge size="sm" variant="primary" className="font-mono">
                          {c.seatColLayout}
                        </AdminBadge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <TableActionMenu
                        isOpen={activeActionId === c.configId}
                        onToggle={(e) => { e.stopPropagation(); setActiveActionId(activeActionId === c.configId ? null : c.configId); }}
                        onClose={() => setActiveActionId(null)}
                      >
                        <button onClick={() => handleOpenEdit(c)} className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <Edit2 className="w-3.5 h-3.5 text-indigo-500" /> 编辑
                        </button>
                        <button onClick={() => handleDelete(c.configId)} className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2">
                          <Trash2 className="w-3.5 h-3.5" /> 删除
                        </button>
                      </TableActionMenu>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={page} totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))} setPage={setPage} totalItems={total} itemsPerPage={PAGE_SIZE} />
          </>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between sticky top-0">
              <h3 className="text-lg font-bold text-white">{editingItem ? '编辑舱位配置' : '新增舱位配置'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">机型</label>
                  <select name="modelId" defaultValue={editingItem?.modelId ?? ''} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white">
                    <option value="">请选择机型</option>
                    {modelOptions.map((m) => (
                      <option key={m.modelId} value={m.modelId}>{m.modelName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">舱位类型</label>
                  <select name="cabinType" defaultValue={editingItem?.cabinType ?? ''} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white">
                    <option value="">请选择舱位</option>
                    {CABIN_TYPE_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">舱位系数</label>
                  <input type="number" step="0.1" name="cabinCoefficient" defaultValue={editingItem ? Number(editingItem.cabinCoefficient) : ''} required min={0.1} placeholder="如: 1.0" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">布局方案号</label>
                  <input type="number" name="cabinLayoutNo" defaultValue={editingItem?.cabinLayoutNo ?? 1} required min={1} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">座位数</label>
                  <input type="number" name="capacity" defaultValue={editingItem?.capacity ?? ''} required min={1} placeholder="如: 150" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">起始行号</label>
                  <input type="number" name="startRowNum" defaultValue={editingItem?.startRowNum ?? 1} required min={1} placeholder="如: 31" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">列布局规则</label>
                  <input name="seatColLayout" defaultValue={editingItem?.seatColLayout ?? 'ABCDEF'} required placeholder="如: ABCDEF / ACHK" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">默认手提行李</label>
                  <input name="defaultCarryOn" defaultValue={editingItem?.defaultCarryOn ?? '7KG'} placeholder="如: 7KG" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">默认托运行李</label>
                  <input name="defaultChecked" defaultValue={editingItem?.defaultChecked ?? '20KG'} placeholder="如: 20KG" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">取消</button>
                <button type="submit" className="flex-1 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-md shadow-purple-500/30 transition-colors flex items-center justify-center gap-2">
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

export default CabinConfigsMgmt;
