import React, { useEffect, useMemo, useState } from 'react';
import { Download, Plus, Search, Filter, CheckCircle2, Clock, AlertCircle, Users, Edit2, Ban, Trash2, X, Save } from 'lucide-react';
import { type FlightStatus } from '@/features/flight';
import { Pagination, TableActionMenu, createAdminFlight, deleteAdminFlight, listAdminFlights, updateAdminFlight, type AdminFlightItem } from '@/features/admin';
import { listRouteOptions, type RouteOption } from '@/features/admin/api/routes';
import { listAircraftModelOptions, type AircraftModelOption } from '@/features/admin/api/aircraftModels';

type UiFlight = {
  id: string; // 展示用（航班号）
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

const toUiTime = (v: string | null | undefined) => {
  const s = String(v ?? '').trim();
  if (!s) return '';
  // 支持 "yyyy-MM-dd HH:mm:ss" 或 ISO
  const m = s.match(/\b(\d{2}):(\d{2})(?::\d{2})?\b/);
  if (m) return `${m[1]}:${m[2]}`;
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

  return {
    id: flightNo || String(f.flightId),
    flightId: String(f.flightId),
    flightNo,
    airline: airlineCompany,
    route: `${departureCity || '-'} → ${arrivalCity || '-'}`,
    dep: toUiTime(f.departureTime),
    arr: toUiTime(f.arrivalTime ?? ''),
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
  const [flights, setFlights] = useState<UiFlight[]>([]);
  const [flightStatusFilter, setFlightStatusFilter] = useState('all');
  const [flightPage, setFlightPage] = useState(1);
  const FLIGHTS_PER_PAGE = 8;

  const [totalFlights, setTotalFlights] = useState(0);
  const [loadingFlights, setLoadingFlights] = useState(false);

  const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
  const [editingFlight, setEditingFlight] = useState<any | null>(null);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  // 下拉选项数据
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [modelOptions, setModelOptions] = useState<AircraftModelOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | ''>('');
  const [selectedModelId, setSelectedModelId] = useState<number | ''>('');

  // 加载下拉选项
  useEffect(() => {
    listRouteOptions().then(setRouteOptions).catch(console.error);
    listAircraftModelOptions().then(setModelOptions).catch(console.error);
  }, []);

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
    } catch (err: any) {
      alert(err?.message || '请求失败，请稍后再试');
    }
  };

  const handleDeleteFlight = async (flightId: string) => {
    if (!confirm('确定要永久删除该航班记录吗？')) return;
    try {
      const ok = await deleteAdminFlight(flightId);
      if (!ok) throw new Error('删除失败');
      await refreshFlights();
    } catch (err: any) {
      alert(err?.message || '请求失败，请稍后再试');
    } finally {
      setActiveActionId(null);
    }
  };

  const handleCancelFlight = async (flight: UiFlight) => {
    if (!confirm('确定要取消该航班吗？这将通知所有已预订乘客。')) return;
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
    } catch (err: any) {
      alert(err?.message || '请求失败，请稍后再试');
    } finally {
      setActiveActionId(null);
    }
  };

  const refreshFlights = async () => {
    setLoadingFlights(true);
    try {
      const res = await listAdminFlights({ page: flightPage, size: FLIGHTS_PER_PAGE });
      setTotalFlights(Number(res.total ?? 0));
      setFlights((res.items ?? []).map(mapAdminFlight));
    } catch (err: any) {
      alert(err?.message || '航班列表加载失败');
    } finally {
      setLoadingFlights(false);
    }
  };

  useEffect(() => {
    refreshFlights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flightPage]);

  const filteredFlights = useMemo(
    () => flights.filter((f) => flightStatusFilter === 'all' || f.status === flightStatusFilter),
    [flights, flightStatusFilter],
  );
  const totalFlightPages = Math.max(1, Math.ceil(totalFlights / FLIGHTS_PER_PAGE));
  const paginatedFlights = filteredFlights;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full"><CheckCircle2 className="w-3 h-3" /> 计划中</span>;
      case 'delayed': return <span className="flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full"><Clock className="w-3 h-3" /> 延误</span>;
      case 'cancelled': return <span className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded-full"><AlertCircle className="w-3 h-3" /> 已取消</span>;
      case 'full': return <span className="flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded-full"><Users className="w-3 h-3" /> 满员</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">航班资源管理</h2>
          <p className="text-sm text-gray-500 mt-1">管理全平台航班排期、座位及状态监控。</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => alert('数据已导出至 CSV')} className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <Download className="w-4 h-4" /> 导出数据
          </button>
          <button onClick={handleOpenCreateFlight} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">
            <Plus className="w-4 h-4" /> 新建航班
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 md:max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="搜索航班号、航线..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm whitespace-nowrap">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">筛选</span>
          </button>
          <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {['all', 'active', 'delayed', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => { setFlightStatusFilter(status); setFlightPage(1); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all whitespace-nowrap ${flightStatusFilter === status ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {status === 'all' ? '全部状态' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible min-h-[400px] flex flex-col">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-semibold">航班信息</th>
              <th className="px-6 py-4 font-semibold">航线 & 时间</th>
              <th className="px-6 py-4 font-semibold">执飞机型</th>
              <th className="px-6 py-4 font-semibold">基础票价</th>
              <th className="px-6 py-4 font-semibold w-48">客座率 (Load Factor)</th>
              <th className="px-6 py-4 font-semibold">当前状态</th>
              <th className="px-6 py-4 font-semibold text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 relative">
            {paginatedFlights.map((flight) => {
              const loadFactor = flight.seats > 0 ? Math.round((flight.sold / flight.seats) * 100) : 0;
              let barColor = 'bg-blue-500';
              if (loadFactor > 90) barColor = 'bg-red-500';
              else if (loadFactor > 70) barColor = 'bg-green-500';

              return (
                <tr key={flight.id} className="hover:bg-gray-50 transition-colors group relative">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                        {flight.id.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">{flight.id}</div>
                        <div className="text-xs text-gray-500">{flight.airline}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{flight.route}</div>
                    <div className="text-xs text-gray-500 mt-0.5 font-mono">{flight.dep} - {flight.arr}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{flight.aircraft}</span>
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
                      isOpen={activeActionId === flight.id}
                      onToggle={(e) => { e.stopPropagation(); setActiveActionId(activeActionId === flight.id ? null : flight.id); }}
                      onClose={() => setActiveActionId(null)}
                    >
                      <button
                        onClick={() => handleOpenEditFlight(flight)}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-500" /> 编辑信息
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
      </div>

      {isFlightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">
                {editingFlight ? '编辑航班信息' : '新建航班计划'}
              </h3>
              <button onClick={() => setIsFlightModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveFlight} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">航班号</label>
                  <input name="flightNo" defaultValue={editingFlight?.flightNo ?? editingFlight?.id} required placeholder="例如: CA1234" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">航空公司</label>
                  <input name="airlineCompany" defaultValue={editingFlight?.airlineCompany ?? editingFlight?.airline} required placeholder="例如: 中国国航" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
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
                  <input type="datetime-local" name="departureTime" defaultValue={editingFlight?.departureTime ? String(editingFlight.departureTime).slice(0, 16) : ''} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">到达时间(可选)</label>
                  <input type="datetime-local" name="arrivalTime" defaultValue={editingFlight?.arrivalTime ? String(editingFlight.arrivalTime).slice(0, 16) : ''} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">总座位数(可选)</label>
                  <input type="number" name="totalSeats" defaultValue={editingFlight?.totalSeats ?? editingFlight?.seats} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">当前状态</label>
                <select name="status" defaultValue={editingFlight?.status || 'active'} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option value="active">计划中 (Active)</option>
                  <option value="delayed">延误 (Delayed)</option>
                  <option value="cancelled">已取消 (Cancelled)</option>
                  <option value="full">满员 (Full)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsFlightModalOpen(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">取消</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/30 transition-colors flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> 保存航班
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightMgmt;
