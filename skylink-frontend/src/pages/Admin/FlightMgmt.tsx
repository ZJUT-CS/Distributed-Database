
import React, { useState } from 'react';
import { Download, Plus, Search, Filter, CheckCircle2, Clock, AlertCircle, Users, Edit2, Ban, Trash2, X, Save } from 'lucide-react';
import { INITIAL_FLIGHTS } from '@/utils/mockData';
import { type FlightStatus } from '@/features/flight';
import { Pagination, TableActionMenu } from '@/features/admin';

const FlightMgmt: React.FC = () => {
  const [flights, setFlights] = useState(INITIAL_FLIGHTS);
  const [flightStatusFilter, setFlightStatusFilter] = useState('all');
  const [flightPage, setFlightPage] = useState(1);
  const FLIGHTS_PER_PAGE = 8;

  const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
  const [editingFlight, setEditingFlight] = useState<any | null>(null);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const handleOpenCreateFlight = () => {
    setEditingFlight(null);
    setIsFlightModalOpen(true);
  };

  const handleOpenEditFlight = (flight: any) => {
    setEditingFlight(flight);
    setIsFlightModalOpen(true);
    setActiveActionId(null);
  };

  const handleSaveFlight = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newFlight = {
      id: formData.get('id') as string,
      airline: formData.get('airline') as string,
      route: formData.get('route') as string,
      dep: formData.get('dep') as string,
      arr: formData.get('arr') as string,
      aircraft: formData.get('aircraft') as string,
      price: Number(formData.get('price')),
      seats: Number(formData.get('seats')),
      sold: editingFlight ? editingFlight.sold : 0,
      status: formData.get('status') as FlightStatus,
    };

    if (editingFlight) {
      setFlights(flights.map(f => f.id === editingFlight.id ? newFlight : f));
    } else {
      setFlights([newFlight, ...flights]);
    }
    setIsFlightModalOpen(false);
  };

  const handleDeleteFlight = (id: string) => {
    if (confirm('确定要永久删除该航班记录吗？')) {
      setFlights(flights.filter(f => f.id !== id));
    }
    setActiveActionId(null);
  };

  const handleCancelFlight = (id: string) => {
    if (confirm('确定要取消该航班吗？这将通知所有已预订乘客。')) {
      setFlights(flights.map(f => f.id === id ? { ...f, status: 'cancelled' } : f));
    }
    setActiveActionId(null);
  };

  const filteredFlights = flights.filter(f => flightStatusFilter === 'all' || f.status === flightStatusFilter);
  const totalFlightPages = Math.ceil(filteredFlights.length / FLIGHTS_PER_PAGE);
  const paginatedFlights = filteredFlights.slice((flightPage - 1) * FLIGHTS_PER_PAGE, flightPage * FLIGHTS_PER_PAGE);

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
              const loadFactor = Math.round((flight.sold / flight.seats) * 100);
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
                        onClick={() => handleCancelFlight(flight.id)}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Ban className="w-3.5 h-3.5 text-yellow-500" /> 取消航班
                      </button>
                      <div className="h-px bg-gray-100 my-0"></div>
                      <button
                        onClick={() => handleDeleteFlight(flight.id)}
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

        <Pagination currentPage={flightPage} totalPages={totalFlightPages} setPage={setFlightPage} totalItems={filteredFlights.length} itemsPerPage={FLIGHTS_PER_PAGE} />
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
                  <input name="id" defaultValue={editingFlight?.id} required placeholder="例如: CA1234" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">航空公司</label>
                  <input name="airline" defaultValue={editingFlight?.airline} required placeholder="例如: 中国国航" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">航线 (出发地 - 目的地)</label>
                <input name="route" defaultValue={editingFlight?.route} required placeholder="例如: PEK - SHA" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">起飞时间</label>
                  <input type="time" name="dep" defaultValue={editingFlight?.dep} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">降落时间</label>
                  <input type="time" name="arr" defaultValue={editingFlight?.arr} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">执飞机型</label>
                  <input name="aircraft" defaultValue={editingFlight?.aircraft} required placeholder="例如: A320" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">基础票价 (¥)</label>
                  <input type="number" name="price" defaultValue={editingFlight?.price} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">总座位数</label>
                  <input type="number" name="seats" defaultValue={editingFlight?.seats || 200} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
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
