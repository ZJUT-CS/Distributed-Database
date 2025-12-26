import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Save, Sliders, Plane as PlaneIcon, Grid3X3, Briefcase, Search, RefreshCw, DollarSign, Download } from 'lucide-react';
import { Pagination, TableActionMenu, AdminBadge, AdminPageHeader, AdminModal, FilterBar, AdminTableState, useAdminList, useConfirm, useToast } from '@/features/admin';
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
import { formatApiError } from '@/shared/api/error';
import { exportToCSV } from '@/shared/utils/export';
import { logger } from '@/shared/logger';

interface ConfigFilters {
  modelId: number | '';
  cabinType: string;
  [key: string]: unknown;
}

const CabinConfigsMgmt: React.FC = () => {
  const PAGE_SIZE = 10;
  const { confirm } = useConfirm();
  const toast = useToast();

  // 机型下拉选项
  const [modelOptions, setModelOptions] = useState<AircraftModelOption[]>([]);

  useEffect(() => {
    listAircraftModelOptions().then(setModelOptions).catch((e) => logger.error('加载机型选项失败', e));
  }, []);

  const fetchConfigs = useCallback(
    async (params: { page: number; size: number } & ConfigFilters) => {
      const res = await listCabinConfigs({
        page: params.page,
        size: params.size,
        modelId: params.modelId !== '' ? params.modelId : undefined,
        cabinType: params.cabinType || undefined,
      });
      return { data: res.data ?? [], total: res.total ?? 0 };
    },
    []
  );

  const {
    items: configs,
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
  } = useAdminList<CabinConfigItem, ConfigFilters>({
    fetchFn: fetchConfigs,
    pageSize: PAGE_SIZE,
    initialFilters: { modelId: '', cabinType: '' },
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CabinConfigItem | null>(null);
  const [activeActionId, setActiveActionId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
    const fd = new FormData(e.target as HTMLFormElement);

    const payload = {
      modelId: Number(fd.get('modelId')),
      cabinType: String(fd.get('cabinType') ?? '').trim().toUpperCase(),
      cabinCoefficient: Number(fd.get('cabinCoefficient')),
      cabinLayoutNo: Number(fd.get('cabinLayoutNo')),
      capacity: Number(fd.get('capacity')),
      startRowNum: Number(fd.get('startRowNum')),
      seatColLayout: String(fd.get('seatColLayout') ?? '').trim().toUpperCase(),
      defaultCarryOn: String(fd.get('defaultCarryOn') ?? '').trim() || undefined,
      defaultChecked: String(fd.get('defaultChecked') ?? '').trim() || undefined,
      defaultServices: String(fd.get('defaultServices') ?? '').trim() || undefined,
    };

    try {
      if (editingItem?.configId) {
        await updateCabinConfig(editingItem.configId, payload);
        toast.success('舱位配置更新成功');
      } else {
        await createCabinConfig(payload);
        toast.success('舱位配置创建成功');
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

  const handleDelete = async (item: CabinConfigItem) => {
    const cabinLabel = CABIN_TYPE_MAP[item.cabinType] || item.cabinType;
    const ok = await confirm({
      title: '删除舱位配置',
      message: `确定删除「${item.modelName || '该机型'}」的「${cabinLabel}」配置吗？此操作不可恢复。`,
      confirmText: '删除',
      cancelText: '取消',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await deleteCabinConfig(item.configId);
      toast.success('舱位配置已删除');
      refresh();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const getModelName = (modelId: number) => {
    const opt = modelOptions.find((m) => m.modelId === modelId);
    return opt?.modelName || String(modelId);
  };

  // 获取舱位类型的 Badge 变体
  const getCabinBadgeVariant = (type: string): 'warning' | 'info' | 'primary' => {
    if (type === 'FIRST') return 'warning';
    if (type === 'BUSINESS') return 'info';
    return 'primary';
  };

  // 导出数据
  const handleExport = async () => {
    try {
      toast.info('正在导出数据...');
      const res = await listCabinConfigs({ page: 1, size: 1000, modelId: filters.modelId !== '' ? filters.modelId : undefined, cabinType: filters.cabinType || undefined });
      const data = res.data ?? [];
      if (!data.length) { toast.warning('暂无数据可导出'); return; }
      exportToCSV(data, '舱位配置', [
        { key: 'configId', label: '配置ID' },
        { key: 'modelId', label: '机型ID' },
        { key: 'modelName', label: '机型名称', formatter: (i) => i.modelName || getModelName(i.modelId) },
        { key: 'cabinType', label: '舱位类型', formatter: (i) => CABIN_TYPE_MAP[i.cabinType] || i.cabinType },
        { key: 'cabinLayoutNo', label: '布局方案号' },
        { key: 'startRowNum', label: '起始行号' },
        { key: 'seatColLayout', label: '列布局' },
        { key: 'capacity', label: '座位数' },
        { key: 'cabinCoefficient', label: '价格系数' },
        { key: 'defaultCarryOn', label: '手提行李', formatter: (i) => i.defaultCarryOn || '' },
        { key: 'defaultChecked', label: '托运行李', formatter: (i) => i.defaultChecked || '' },
      ]);
      toast.success('导出成功');
    } catch (e: any) {
      toast.error(e?.message || '导出失败');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <AdminPageHeader
        icon={Sliders}
        iconClassName="text-purple-500"
        title="舱位配置管理"
        description="管理机型舱位配置，包括舱位类型、座位布局、行李规格和价格系数"
        actions={
          <div className="flex items-center gap-3">
            <button onClick={handleExport} className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center gap-2">
              <Download className="w-4 h-4" /> 导出数据
            </button>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> 新增配置
            </button>
          </div>
        }
      />

      <FilterBar
        left={
          <div className="flex items-center gap-3 flex-1">
            <div className="relative w-48">
              <PlaneIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={filters.modelId}
                onChange={(e) => setFilters({ modelId: e.target.value ? Number(e.target.value) : '' })}
                className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none appearance-none"
              >
                <option value="">全部机型</option>
                {modelOptions.map((m) => (
                  <option key={m.modelId} value={m.modelId}>{m.modelName}</option>
                ))}
              </select>
            </div>
            <select
              value={filters.cabinType}
              onChange={(e) => setFilters({ cabinType: e.target.value })}
              className="w-36 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
            >
              <option value="">全部舱位</option>
              {CABIN_TYPE_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        }
        right={
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">共 {total} 条配置</span>
            <button
              onClick={() => refresh()}
              disabled={loading}
              className="p-2.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors disabled:opacity-50"
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
          isEmpty={configs.length === 0}
          onRetry={retry}
          emptyIcon={Sliders}
          emptyTitle={filters.modelId || filters.cabinType ? '未找到匹配配置' : '暂无舱位配置'}
          emptyDescription={filters.modelId || filters.cabinType ? '尝试调整筛选条件' : '点击「新增配置」添加第一个舱位配置'}
          emptyActionText={!filters.modelId && !filters.cabinType ? '新增配置' : undefined}
          onEmptyAction={!filters.modelId && !filters.cabinType ? handleOpenCreate : undefined}
          skeletonRows={5}
          skeletonColumns={5}
        >
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">配置信息</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">座位布局</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">行李规格</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">价格系数</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {configs.map((c) => (
                <tr key={c.configId} className="hover:bg-purple-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <EntityCell
                      leading={
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center text-purple-600 shadow-sm">
                          <Sliders className="w-5 h-5" />
                        </div>
                      }
                      title={
                        <div className="flex items-center gap-2">
                          <span>{c.modelName || getModelName(c.modelId)}</span>
                          <AdminBadge size="sm" variant={getCabinBadgeVariant(c.cabinType)}>
                            {CABIN_TYPE_MAP[c.cabinType] || c.cabinType}
                          </AdminBadge>
                        </div>
                      }
                      subtitle={`布局方案 #${c.cabinLayoutNo} · ID: ${c.configId}`}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Grid3X3 className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-mono font-medium text-gray-700">{c.seatColLayout}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        从第 {c.startRowNum} 排 · {c.capacity} 座
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">随身 {c.defaultCarryOn || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="w-4 h-4 text-amber-500" />
                        <span className="text-gray-700">托运 {c.defaultChecked || '-'}</span>
                      </div>
                      {c.defaultServices && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {c.defaultServices.split(/[,，、]/).map((s, i) => (
                            <span key={i} className="px-1.5 py-0.5 text-[10px] bg-blue-50 text-blue-600 rounded">
                              {s.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="text-xl font-bold text-gray-900">×{Number(c.cabinCoefficient).toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <TableActionMenu
                      isOpen={activeActionId === c.configId}
                      onToggle={(e) => { e.stopPropagation(); setActiveActionId(activeActionId === c.configId ? null : c.configId); }}
                      onClose={() => setActiveActionId(null)}
                    >
                      <button onClick={() => handleOpenEdit(c)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                        <Edit2 className="w-4 h-4 text-purple-500" /> 编辑配置
                      </button>
                      <button onClick={() => handleDelete(c)} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors">
                        <Trash2 className="w-4 h-4" /> 删除配置
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
        title={editingItem ? '编辑舱位配置' : '新增舱位配置'}
        theme="purple-pink"
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600">机型 *</label>
              <select name="modelId" defaultValue={editingItem?.modelId ?? ''} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none bg-white">
                <option value="">请选择机型</option>
                {modelOptions.map((m) => (
                  <option key={m.modelId} value={m.modelId}>{m.modelName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600">舱位类型 *</label>
              <select name="cabinType" defaultValue={editingItem?.cabinType ?? ''} required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none bg-white">
                <option value="">请选择舱位</option>
                {CABIN_TYPE_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600">价格系数 *</label>
              <input type="number" step="0.1" name="cabinCoefficient" defaultValue={editingItem ? Number(editingItem.cabinCoefficient) : ''} required min={0.1} placeholder="如: 1.0" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600">布局方案号 *</label>
              <input type="number" name="cabinLayoutNo" defaultValue={editingItem?.cabinLayoutNo ?? 1} required min={1} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600">座位数 *</label>
              <input type="number" name="capacity" defaultValue={editingItem?.capacity ?? ''} required min={1} placeholder="如: 150" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600">起始行号 *</label>
              <input type="number" name="startRowNum" defaultValue={editingItem?.startRowNum ?? 1} required min={1} placeholder="如: 31" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600">列布局规则 *</label>
              <input name="seatColLayout" defaultValue={editingItem?.seatColLayout ?? 'ABCDEF'} required placeholder="如: ABCDEF / ACHK" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              <p className="text-xs text-gray-500">每个字母代表一列座位</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600">默认手提行李</label>
              <input name="defaultCarryOn" defaultValue={editingItem?.defaultCarryOn ?? '7KG'} placeholder="如: 7KG" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600">默认托运行李</label>
              <input name="defaultChecked" defaultValue={editingItem?.defaultChecked ?? '20KG'} placeholder="如: 20KG" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
            </div>
          </div>

          {/* 服务配置 */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600">机上服务配置</label>
            <input
              name="defaultServices"
              defaultValue={editingItem?.defaultServices ?? ''}
              placeholder="如: 餐食,WiFi,电源,娱乐系统"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
            />
            <p className="text-xs text-gray-500">用逗号分隔多项服务，如：餐食,WiFi,电源,娱乐系统</p>
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
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};

export default CabinConfigsMgmt;
