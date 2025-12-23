import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Download, Plus, Search, Users, Edit2, Ban, Trash2, Save, Plane as PlaneIcon, RefreshCw, CheckSquare, Square, X } from 'lucide-react';
import { type FlightStatus } from '@/features/flight';
import { Pagination, TableActionMenu, AdminBadge, AdminPageHeader, AdminModal, EmptyState, useConfirm, useToast, createAdminFlight, deleteAdminFlight, listAdminFlights, updateAdminFlight, type AdminFlightItem, FLIGHT_STATUS_STR_META, useAdminList, AdminTableState, useAdminOptions } from '@/features/admin';
import { formatApiError } from '@/utils/apiError';
import EntityCell from '@/components/common/EntityCell';
import { listRouteOptions, type RouteOption } from '@/features/admin/api/routes';
import { listAircraftModelOptions, type AircraftModelOption } from '@/features/admin/api/aircraftModels';
import { exportToCSV } from '@/utils/export';

type UiFlight = {
  rowId: string; // 唯一标识（用于 key / 选中态 / 菜单展开态）
  displayId: string; // 展示用（通常为航班号 flightNo）
  flightId: string;
  flightNo: string;
  airline: string;
  route: string;
  dep: string;
  arr: string;
  aircraft: string;
  price: number;
  seats: number;
  sold: number;
  status: FlightStatus;

  // upsert 必要字段
  modelId: number;
  routeId: number;
  departureTime: string;
  arrivalTime?: string;
  airlineCompany: string;
  totalSeats?: number;
};

const toFlightStatus = (status: number | null | undefined): FlightStatus => {
  switch (Number(status)) {
    case 1:
      return 'active';
    case 2:
      return 'cancelled';
    case 3:
      return 'delayed';
    default:
      return 'active';
  }
};

const toUiDateTime = (v: string | null | undefined) => {
  const s = String(v ?? '').trim();
  if (!s) return '';
  // 支持 "yyyy-MM-dd HH:mm:ss" 或 "yyyy-MM-ddTHH:mm:ss"，统一展示到分钟
  const dt = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::\d{2})?/);
  if (dt) return `${dt[1]} ${dt[2]}`;

  // 兜底：仅提取 HH:mm（避免 ISO 场景误命中 mm:ss）
  const tm = s.match(/(?:^|[ T])(\d{2}):(\d{2})(?::\d{2})?/);
  if (tm) return `${tm[1]}:${tm[2]}`;

  return s;
};

const toDatetimeLocal = (v: string | null | undefined) => {
  const s = String(v ?? '').trim();
  if (!s) return '';
  // 后端格式 yyyy-MM-dd HH:mm:ss -> datetime-local yyyy-MM-ddTHH:mm
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::\d{2})?$/);
  if (m) return `${m[1]}T${m[2]}`;
  // ISO -> 截断到分钟
  if (s.includes('T')) return s.slice(0, 16);
  return s;
};

const normalizePrice = (v: unknown) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const mapAdminFlight = (f: AdminFlightItem): UiFlight => {
  const flightNo = String(f.flightNo ?? '').trim();
  const departureCity = String(f.departureCity ?? '').trim();
  const arrivalCity = String(f.arrivalCity ?? '').trim();
  const airlineCompany = String(f.airlineCompany ?? '').trim();
  const totalSeats = f.totalSeats != null ? Number(f.totalSeats) : 0;
  const flightId = String(f.flightId);

  return {
    rowId: flightId,
    displayId: flightNo || flightId,
    flightId,
    flightNo,
    airline: airlineCompany,
    route: `${departureCity || '-'} → ${arrivalCity || '-'}`,
    dep: toUiDateTime(f.departureTime),
    arr: toUiDateTime(f.arrivalTime ?? ''),
    aircraft: String(f.modelId ?? ''),
    price: normalizePrice(f.lowestPrice),
    seats: Number.isFinite(totalSeats) ? totalSeats : 0,
    sold: 0,
    status: toFlightStatus(f.status),

    modelId: Number(f.modelId),
    routeId: Number(f.routeId),
    departureTime: toDatetimeLocal(f.departureTime),
    arrivalTime: toDatetimeLocal(f.arrivalTime ?? undefined) || undefined,
    airlineCompany,
    totalSeats: Number.isFinite(totalSeats) ? totalSeats : undefined,
  };
};

const FlightMgmt: React.FC = () => {
  const { confirm } = useConfirm();
  const toast = useToast();

  const FLIGHTS_PER_PAGE = 8;

  // 使用 useAdminList 统一管理列表状态
  const fetchFlights = useCallback(
    async (params: { page: number; size: number; keyword: string;[key: string]: unknown }) => {
      const res = await listAdminFlights({
        page: params.page,
        size: params.size,
        keyword: params.keyword || undefined,
      });
      return {
        data: (res.data ?? []).map(mapAdminFlight),
        total: res.total ?? 0,
      };
    },
    []
  );

  const {
    items: flights,
    total: totalFlights,
    page: flightPage,
    totalPages: totalFlightPages,
    loading: loadingFlights,
    error: flightsError,
    filters,
    setPage: setFlightPage,
    setFilters,
    refresh: refreshFlights,
    retry,
  } = useAdminList<UiFlight, { keyword: string; status: string;[key: string]: unknown }>({
    fetchFn: fetchFlights,
    pageSize: FLIGHTS_PER_PAGE,
    initialFilters: { keyword: '', status: 'all' },
  });

  // 筛选状态统一从 filters 读取
  const searchKeyword = filters.keyword;
  const flightStatusFilter = filters.status;

  const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
  const [editingFlight, setEditingFlight] = useState<UiFlight | null>(null);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 下拉选项数据（使用 useAdminOptions 缓存）
  const { options: routeOptionsRaw } = useAdminOptions<RouteOption, number>('routes', {
    fetchFn: listRouteOptions,
    transform: (r) => ({ value: r.routeId, label: `${r.departureCity}(${r.departureAirport}) → ${r.arrivalCity}(${r.arrivalAirport})` }),
  });
  const { options: modelOptionsRaw } = useAdminOptions<AircraftModelOption, number>('aircraftModels', {
    fetchFn: listAircraftModelOptions,
    transform: (m) => ({ value: m.modelId, label: `${m.modelName}${m.manufacturer ? ` (${m.manufacturer})` : ''}` }),
  });

  // 保持原有数据格式兼容
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [modelOptions, setModelOptions] = useState<AircraftModelOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | ''>('');
  const [selectedModelId, setSelectedModelId] = useState<number | ''>('');

  // 加载原始数据用于 map 查找
  useEffect(() => {
    listRouteOptions().then(setRouteOptions).catch(console.error);
    listAircraftModelOptions().then(setModelOptions).catch(console.error);
  }, []);

  const routeMap = useMemo(() => {
    const m = new Map<number, RouteOption>();
    for (const r of routeOptions) m.set(r.routeId, r);
    return m;
  }, [routeOptions]);

  const modelMap = useMemo(() => {
    const m = new Map<number, AircraftModelOption>();
    for (const a of modelOptions) m.set(a.modelId, a);
    return m;
  }, [modelOptions]);

  const formatCityAirport = (city?: string | null, airport?: string | null) => {
    const c = String(city ?? '').trim();
    const a = String(airport ?? '').trim().toUpperCase();
    if (c && a) return `${c}(${a})`;
    return c || a || '-';
  };

  const handleOpenCreateFlight = () => {
    setEditingFlight(null);
    setSelectedRouteId('');
    setSelectedModelId('');
    setIsFlightModalOpen(true);
  };

  const handleOpenEditFlight = (flight: any) => {
    setEditingFlight(flight);
    setSelectedRouteId(flight.routeId || '');
    setSelectedModelId(flight.modelId || '');
    setIsFlightModalOpen(true);
    setActiveActionId(null);
  };

  const handleSaveFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const flightNo = String(formData.get('flightNo') ?? '').trim();
    const airlineCompany = String(formData.get('airlineCompany') ?? '').trim();
    const modelId = Number(formData.get('modelId'));
    const routeId = Number(formData.get('routeId'));
    const departureTime = String(formData.get('departureTime') ?? '').trim();
    const arrivalTime = String(formData.get('arrivalTime') ?? '').trim();
    const totalSeats = String(formData.get('totalSeats') ?? '').trim();
    const statusRaw = String(formData.get('status') ?? '').trim();

    const status = statusRaw === 'cancelled' ? 2 : statusRaw === 'delayed' ? 3 : 1;

    try {
      if (editingFlight?.flightId) {
        const ok = await updateAdminFlight(editingFlight.flightId, {
          flightNo,
          modelId,
          routeId,
          departureTime,
          arrivalTime: arrivalTime || undefined,
          airlineCompany,
          totalSeats: totalSeats ? Number(totalSeats) : undefined,
          status,
        });
        if (!ok) throw new Error('保存失败');
      } else {
        const ok = await createAdminFlight({
          flightNo,
          modelId,
          routeId,
          departureTime,
          arrivalTime: arrivalTime || undefined,
          airlineCompany,
          totalSeats: totalSeats ? Number(totalSeats) : undefined,
          status,
        });
        if (!ok) throw new Error('创建失败');
      }

      await refreshFlights();
      setIsFlightModalOpen(false);
      toast.success(editingFlight ? '航班信息已更新' : '航班创建成功');
    } catch (err: any) {
      toast.error(formatApiError(err));
    }
  };

  const handleDeleteFlight = async (flightId: string) => {
    const confirmed = await confirm({
      title: '删除航班记录',
      message: '确定要永久删除该航班记录吗？此操作不可撤销。',
      variant: 'danger',
      confirmText: '确认删除',
    });
    if (!confirmed) return;
    try {
      const ok = await deleteAdminFlight(flightId);
      if (!ok) throw new Error('删除失败');
      await refreshFlights();
      toast.success('航班已删除');
    } catch (err: any) {
      toast.error(formatApiError(err));
    } finally {
      setActiveActionId(null);
    }
  };

  const handleCancelFlight = async (flight: UiFlight) => {
    const confirmed = await confirm({
      title: '取消航班',
      message: `确定要取消航班 ${flight.flightNo} 吗？这将通知所有已预订乘客。`,
      variant: 'warning',
      confirmText: '确认取消',
    });
    if (!confirmed) return;
    try {
      const ok = await updateAdminFlight(flight.flightId, {
        flightNo: flight.flightNo,
        modelId: flight.modelId,
        routeId: flight.routeId,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        airlineCompany: flight.airlineCompany,
        totalSeats: flight.totalSeats,
        status: 2,
      });
      if (!ok) throw new Error('取消失败');
      await refreshFlights();
      toast.success('航班已取消');
    } catch (err: any) {
      toast.error(formatApiError(err));
    } finally {
      setActiveActionId(null);
    }
  };

  const handleBatchCancel = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.warning('请先选择要取消的航班');
      return;
    }
    const confirmed = await confirm({
      title: '批量取消航班',
      message: `确定要取消选中的 ${ids.length} 个航班吗？这将通知所有已预订乘客。`,
      variant: 'warning',
      confirmText: '确认取消',
    });
    if (!confirmed) return;
    try {
      await Promise.all(ids.map(id => {
        const flight = flights.find(f => f.flightId === id);
        if (!flight) return Promise.resolve();
        return updateAdminFlight(id, {
          flightNo: flight.flightNo,
          modelId: flight.modelId,
          routeId: flight.routeId,
          departureTime: flight.departureTime,
          arrivalTime: flight.arrivalTime,
          airlineCompany: flight.airlineCompany,
          totalSeats: flight.totalSeats,
          status: 2,
        });
      }));
      toast.success('航班已取消');
      setSelectedIds(new Set());
      await refreshFlights();
    } catch (err: any) {
      toast.error(formatApiError(err));
    }
  };

  const handleBatchDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.warning('请先选择要删除的航班');
      return;
    }
    const confirmed = await confirm({
      title: '批量删除航班',
      message: `确定要删除选中的 ${ids.length} 个航班吗？此操作不可恢复。`,
      variant: 'danger',
      confirmText: '确认删除',
    });
    if (!confirmed) return;
    try {
      await Promise.all(ids.map(id => deleteAdminFlight(id)));
      toast.success('航班已删除');
      setSelectedIds(new Set());
      await refreshFlights();
    } catch (err: any) {
      toast.error(formatApiError(err));
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === paginatedFlights.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedFlights.map(f => f.flightId)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // 前端过滤（后端 API 不支持 status 筛选时用）
  const filteredFlights = useMemo(() => {
    if (flightStatusFilter === 'all') return flights;
    return flights.filter((f) => f.status === flightStatusFilter);
  }, [flights, flightStatusFilter]);

  const paginatedFlights = filteredFlights;

  const allSelected = paginatedFlights.length > 0 && selectedIds.size === paginatedFlights.length;
  const someSelected = selectedIds.size > 0;

  // 使用 FLIGHT_STATUS_STR_META 统一生成状态徽章
  const getStatusBadge = (status: string) => {
    const meta = FLIGHT_STATUS_STR_META[status];
    if (!meta) return null;
    return (
      <AdminBadge size="sm" icon={meta.icon} variant={meta.variant}>
        {meta.label}
      </AdminBadge>
    );
  };

  // 导出数据
  const handleExport = async () => {
    try {
      toast.info('正在导出数据...');
      const res = await listAdminFlights({ page: 1, size: 1000, keyword: searchKeyword || undefined });
      const data = (res.data ?? []).map(mapAdminFlight);
      if (!data.length) {
        toast.warning('暂无数据可导出');
        return;
      }
      exportToCSV(data, '航班列表', [
        { key: 'flightNo', label: '航班号' },
        { key: 'airline', label: '航空公司' },
        { key: 'route', label: '航线' },
        { key: 'dep', label: '起飞时间' },
        { key: 'arr', label: '到达时间' },
        { key: 'price', label: '基础票价' },
        { key: 'seats', label: '座位数' },
        { key: 'status', label: '状态', formatter: (item) => FLIGHT_STATUS_STR_META[item.status]?.label || item.status },
      ]);
      toast.success('导出成功');
    } catch (err: any) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <AdminPageHeader
        icon={PlaneIcon}
        iconClassName="text-indigo-500"
        title="航班资源管理"
        description="管理全平台航班排期、座位及状态监控"
        actions={
          <div className="flex gap-3">
            <button onClick={handleExport} className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" /> 导出数据
            </button>
            <button onClick={handleOpenCreateFlight} className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 flex items-center gap-2">
              <Plus className="w-4 h-4" /> 新建航班
            </button>
          </div>
        }
      />

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 md:max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索航班号、航线、航空公司..."
            value={searchKeyword}
            onChange={(e) => setFilters({ keyword: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() => refreshFlights()}
            disabled={loadingFlights}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
            title="刷新"
          >
            <RefreshCw className={`w-4 h-4 ${loadingFlights ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {['all', 'active', 'delayed', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setFilters({ status })}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all whitespace-nowrap ${flightStatusFilter === status ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {status === 'all' ? '全部状态' : status === 'active' ? '计划中' : status === 'delayed' ? '延误' : '已取消'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible min-h-[400px] flex flex-col">
        {someSelected && (
          <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
            <span className="text-sm font-medium text-indigo-700">已选择 {selectedIds.size} 项</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBatchCancel}
                className="px-3 py-1.5 text-xs font-medium text-orange-600 bg-white border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-1"
              >
                <Ban className="w-3.5 h-3.5" /> 批量取消
              </button>
              <button
                onClick={handleBatchDelete}
                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> 批量删除
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        <AdminTableState
          loading={loadingFlights}
          error={flightsError}
          isEmpty={paginatedFlights.length === 0}
          onRetry={retry}
          skeletonRows={5}
          skeletonColumns={6}
          emptyIcon={PlaneIcon}
          emptyTitle={searchKeyword ? '未找到匹配结果' : '暂无航班数据'}
          emptyDescription={searchKeyword ? '请尝试调整搜索关键词或筛选条件' : '点击上方按钮创建第一个航班计划'}
          emptyActionText={searchKeyword ? undefined : '新建航班'}
          onEmptyAction={searchKeyword ? undefined : handleOpenCreateFlight}
        >
          <>
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <button
                      onClick={handleSelectAll}
                      className="text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">航班信息</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">航线 & 时间</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">执飞机型</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">基础票价</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-48">客座率</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">当前状态</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 relative">
                {paginatedFlights.map((flight) => {
                  const loadFactor = flight.seats > 0 ? Math.round((flight.sold / flight.seats) * 100) : 0;
                  let barColor = 'bg-indigo-500';
                  if (loadFactor > 90) barColor = 'bg-red-500';
                  else if (loadFactor > 70) barColor = 'bg-green-500';

                  return (
                    <tr key={flight.rowId} className="hover:bg-indigo-50/30 transition-colors group relative">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleSelectOne(flight.flightId)}
                          className="text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                          {selectedIds.has(flight.flightId) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <EntityCell
                          leading={
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                              {(flight.flightNo || flight.flightId).substring(0, 2)}
                            </div>
                          }
                          title={flight.displayId}
                          meta={[{ text: flight.airline }]}
                        />
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const ro = routeMap.get(flight.routeId);
                          const from = ro ? formatCityAirport(ro.departureCity, ro.departureAirport) : String(flight.route ?? '-');
                          const to = ro ? formatCityAirport(ro.arrivalCity, ro.arrivalAirport) : '';

                          return (
                            <>
                              <div className="flex items-center gap-2 flex-wrap">
                                <AdminBadge size="sm" variant="info">
                                  {from}
                                </AdminBadge>
                                <span className="text-xs text-gray-400">→</span>
                                <AdminBadge size="sm" variant="primary">
                                  {to || '-'}
                                </AdminBadge>
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5 font-mono">{flight.dep} - {flight.arr}</div>
                            </>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {(() => {
                          const mo = modelMap.get(flight.modelId);
                          const label = mo?.modelName || (flight.modelId ? `#${flight.modelId}` : String(flight.aircraft || '-'));
                          return (
                            <AdminBadge size="sm" variant="primary" className="font-mono">
                              {label}
                            </AdminBadge>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">¥{flight.price}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-gray-600">{flight.sold}/{flight.seats}</span>
                          <span className="font-bold text-gray-800">{loadFactor}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${loadFactor}%` }}></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(flight.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <TableActionMenu
                          isOpen={activeActionId === flight.rowId}
                          onToggle={(e) => { e.stopPropagation(); setActiveActionId(activeActionId === flight.rowId ? null : flight.rowId); }}
                          onClose={() => setActiveActionId(null)}
                        >
                          <button
                            onClick={() => handleOpenEditFlight(flight)}
                            className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-indigo-500" /> 编辑信息
                          </button>
                          <button
                            onClick={() => handleCancelFlight(flight)}
                            className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Ban className="w-3.5 h-3.5 text-yellow-500" /> 取消航班
                          </button>
                          <div className="h-px bg-gray-100 my-0"></div>
                          <button
                            onClick={() => handleDeleteFlight(flight.flightId)}
                            className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> 删除记录
                          </button>
                        </TableActionMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination currentPage={flightPage} totalPages={totalFlightPages} setPage={setFlightPage} totalItems={totalFlights} itemsPerPage={FLIGHTS_PER_PAGE} />
          </>
        </AdminTableState>
      </div>

      <AdminModal
        isOpen={isFlightModalOpen}
        onClose={() => setIsFlightModalOpen(false)}
        title={editingFlight ? '编辑航班信息' : '新建航班计划'}
        theme="indigo-purple"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveFlight} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">航班号</label>
              <input name="flightNo" defaultValue={editingFlight?.flightNo ?? editingFlight?.displayId} required placeholder="例如: CA1234" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">航空公司</label>
              <input name="airlineCompany" defaultValue={editingFlight?.airlineCompany ?? editingFlight?.airline} required placeholder="例如: 中国国航" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">选择航线</label>
              <select
                name="routeId"
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value ? Number(e.target.value) : '')}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="">请选择航线</option>
                {routeOptions.map((r) => (
                  <option key={r.routeId} value={r.routeId}>{r.label}</option>
                ))}
              </select>
              {selectedRouteId !== '' && (() => {
                const route = routeOptions.find((r) => r.routeId === selectedRouteId);
                return route ? (
                  <p className="text-xs text-gray-400 mt-1">基准价: ¥{route.basePrice}{route.estimatedDuration ? ` | 约${route.estimatedDuration}分钟` : ''}</p>
                ) : null;
              })()}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">选择机型</label>
              <select
                name="modelId"
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value ? Number(e.target.value) : '')}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="">请选择机型</option>
                {modelOptions.map((m) => (
                  <option key={m.modelId} value={m.modelId}>{m.label}</option>
                ))}
              </select>
              {selectedModelId !== '' && (() => {
                const model = modelOptions.find((m) => m.modelId === selectedModelId);
                return model ? (
                  <p className="text-xs text-gray-400 mt-1">{model.manufacturer || '未知制造商'} | {model.totalPhysicalSeats}座</p>
                ) : null;
              })()}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">起飞时间</label>
              <input type="datetime-local" name="departureTime" defaultValue={editingFlight?.departureTime ? String(editingFlight.departureTime).slice(0, 16) : ''} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">到达时间(可选)</label>
              <input type="datetime-local" name="arrivalTime" defaultValue={editingFlight?.arrivalTime ? String(editingFlight.arrivalTime).slice(0, 16) : ''} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">总座位数(可选)</label>
              <input type="number" name="totalSeats" defaultValue={editingFlight?.totalSeats ?? editingFlight?.seats} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">当前状态</label>
            <select name="status" defaultValue={editingFlight?.status || 'active'} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
              <option value="active">计划中 (Active)</option>
              <option value="delayed">延误 (Delayed)</option>
              <option value="cancelled">已取消 (Cancelled)</option>
              <option value="full">满员 (Full)</option>
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsFlightModalOpen(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">取消</button>
            <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-500/30 transition-colors flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> 保存航班
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};

export default FlightMgmt;
