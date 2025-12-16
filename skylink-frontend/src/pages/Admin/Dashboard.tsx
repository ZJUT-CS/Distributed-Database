
import React from 'react';
import { DollarSign, TrendingUp, CalendarCheck, Plane, Users, Globe, ArrowRightLeft, AlertCircle } from 'lucide-react';
import WorldMap from '../../components/common/WorldMap';
import { INITIAL_FLIGHTS, INITIAL_BOOKINGS, INITIAL_USERS } from '../../services/mockData';

const Dashboard: React.FC = () => {
  const bookingDates = INITIAL_BOOKINGS.map((b) => b.date).sort();
  const todayBookingDate = bookingDates[bookingDates.length - 1];

  const todayBookings = INITIAL_BOOKINGS.filter((b) => b.date === todayBookingDate);
  const todayOrderCount = todayBookings.length;
  const todayGmv = todayBookings
    .filter((b) => b.status === 'paid')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalRev = INITIAL_BOOKINGS.filter((b) => b.status === 'paid').reduce(
    (acc, curr) => acc + curr.amount,
    0
  );
  const totalBookings = INITIAL_BOOKINGS.length;

  const userLoginDates = INITIAL_USERS.map((u) => u.lastLogin.split(' ')[0]).sort();
  const todayUserDate = userLoginDates[userLoginDates.length - 1];
  const todayNewUsers = INITIAL_USERS.filter((u) => u.lastLogin.startsWith(todayUserDate)).length;

  const upcomingFlights = INITIAL_FLIGHTS.filter(
    (f) => f.status === 'active' || f.status === 'delayed'
  ).length;

  const pendingRefundAudits = 3;

  const orderedDates = Array.from(new Set(bookingDates));
  const ordersTrendData = orderedDates.map((d) => ({
    date: d,
    count: INITIAL_BOOKINGS.filter((b) => b.date === d).length,
  }));
  const maxOrders = Math.max(...ordersTrendData.map((d) => d.count));
  
  const flightStatusCounts = {
    active: INITIAL_FLIGHTS.filter(f => f.status === 'active').length,
    delayed: INITIAL_FLIGHTS.filter(f => f.status === 'delayed').length,
    cancelled: INITIAL_FLIGHTS.filter(f => f.status === 'cancelled').length,
    full: INITIAL_FLIGHTS.filter(f => f.status === 'full').length,
  };
  const totalFlights = INITIAL_FLIGHTS.length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-sm">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -left-32 top-0 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
        </div>

        <div className="relative px-6 py-6 md:px-10 md:py-7 flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/60 border border-slate-700/80 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-slate-300">
                  SKYLINK GLOBAL OPS CENTER
                </span>
              </div>
              <div className="flex items-end gap-3">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                  全球航旅运营监控大屏
                </h1>
                <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                  实时刷新 · Mock 数据
                </span>
              </div>
              <p className="text-sm text-slate-300 max-w-xl">
                汇总订单、航班、用户与支付等多维度指标，辅助运营与值班人员快速掌握系统运行状况。
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-start lg:justify-end">
              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 px-4 py-2.5 flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <span className="text-[11px] text-slate-400">今日总订单</span>
                  <span className="text-lg font-semibold text-white">
                    {todayOrderCount}
                    <span className="ml-1 text-[11px] text-slate-400">单</span>
                  </span>
                </div>
                <div className="h-9 w-px bg-slate-700" />
                <div className="flex flex-col text-right">
                  <span className="text-[11px] text-slate-400">今日 GMV</span>
                  <span className="text-lg font-semibold text-emerald-300">
                    ¥{todayGmv.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 px-4 py-2.5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl border border-blue-500/40 bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">今日新增用户</span>
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-[2px] text-[10px] text-emerald-300 border border-emerald-500/30">
                      <TrendingUp className="w-3 h-3" /> +8.2%
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-white mt-0.5">
                    {todayNewUsers}{' '}
                    <span className="text-[11px] text-slate-400 font-normal">人</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-3xl border border-slate-700/70 bg-slate-900/60 p-6 shadow-sm overflow-hidden relative">
              <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-blue-500/10 blur-2xl" />
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div className="h-11 w-11 rounded-2xl border border-blue-500/30 bg-blue-500/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-300" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-300">
                    <TrendingUp className="w-3 h-3" /> +12.5%
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-[11px] uppercase tracking-widest text-slate-400">今日订单与 GMV</p>
                  <div className="mt-1 flex items-end justify-between gap-4">
                    <div className="text-3xl font-bold text-white">{todayOrderCount}</div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">今日 GMV</div>
                      <div className="text-sm font-semibold text-emerald-300">¥{todayGmv.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    历史累计 GMV：<span className="text-slate-200 font-semibold">¥{totalRev.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-700/70 bg-slate-900/60 p-6 shadow-sm overflow-hidden relative">
              <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-indigo-500/10 blur-2xl" />
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div className="h-11 w-11 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center">
                    <CalendarCheck className="w-5 h-5 text-indigo-300" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-300">
                    <TrendingUp className="w-3 h-3" /> +8.2%
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-[11px] uppercase tracking-widest text-slate-400">今日新增用户</p>
                  <div className="mt-1 flex items-end justify-between gap-4">
                    <div className="text-3xl font-bold text-white">{todayNewUsers}</div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">用户总数</div>
                      <div className="text-sm font-semibold text-slate-200">{INITIAL_USERS.length}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-700/70 bg-slate-900/60 p-6 shadow-sm overflow-hidden relative">
              <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-orange-500/10 blur-2xl" />
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div className="h-11 w-11 rounded-2xl border border-orange-500/30 bg-orange-500/10 flex items-center justify-center">
                    <Plane className="w-5 h-5 text-orange-300" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800/60 px-2 py-1 text-[11px] font-medium text-slate-300">
                    持平
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-[11px] uppercase tracking-widest text-slate-400">24 小时内起飞航班</p>
                  <div className="mt-1 flex items-end justify-between gap-4">
                    <div className="text-3xl font-bold text-white">{upcomingFlights}</div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">计划航班总数</div>
                      <div className="text-sm font-semibold text-slate-200">{INITIAL_FLIGHTS.length}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-700/70 bg-slate-900/60 p-6 shadow-sm overflow-hidden relative">
              <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-purple-500/10 blur-2xl" />
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div className="h-11 w-11 rounded-2xl border border-purple-500/30 bg-purple-500/10 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-purple-300" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-300">
                    <TrendingUp className="w-3 h-3" /> +24%
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-[11px] uppercase tracking-widest text-slate-400">待处理退改签</p>
                  <div className="mt-1 flex items-end justify-between gap-4">
                    <div className="text-3xl font-bold text-white">{pendingRefundAudits}</div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">总订单</div>
                      <div className="text-sm font-semibold text-slate-200">{totalBookings}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
        <div className="lg:col-span-2 rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-sm relative">
          <div className="absolute inset-0 pointer-events-none opacity-60">
            <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
            <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
          </div>

          <div className="relative p-6">
            <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">订单趋势 (近 7 日)</h3>
              <p className="text-xs text-slate-400 mt-1">Orders Volume Last 7 Days</p>
            </div>
            <div className="flex gap-2 items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
              <span className="text-xs text-slate-300">每日订单数</span>
            </div>
          </div>
          <div className="h-[260px] flex items-end justify-between gap-4 px-2">
            {ordersTrendData.map((item, idx) => {
              const height = maxOrders ? (item.count / maxOrders) * 100 : 0;
              return (
                <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                  <div className="relative w-full bg-slate-900/60 rounded-2xl h-full overflow-hidden border border-slate-800/70">
                    <div
                      className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-blue-600/90 via-blue-500 to-cyan-400/90 rounded-2xl transition-all duration-1000 ease-out group-hover:from-blue-600 group-hover:to-cyan-300"
                      style={{ height: `${height}%` }}
                    ></div>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-700/70">
                      {item.count} 单
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{item.date}</span>
                </div>
              );
            })}
          </div>
        </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950 shadow-sm flex flex-col overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none opacity-50">
            <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
          </div>

          <div className="relative p-6 flex flex-col flex-1">
            <h3 className="text-lg font-bold text-white mb-6">航班状态分布</h3>
            <div className="flex-1 flex items-center justify-center relative">
            <div
              className="w-48 h-48 rounded-full relative"
              style={{
                background: `conic-gradient(
                      #22c55e 0% ${(flightStatusCounts.active / totalFlights) * 100}%, 
                      #eab308 ${(flightStatusCounts.active / totalFlights) * 100}% ${((flightStatusCounts.active + flightStatusCounts.delayed) / totalFlights) * 100}%,
                      #ef4444 ${((flightStatusCounts.active + flightStatusCounts.delayed) / totalFlights) * 100}% ${((flightStatusCounts.active + flightStatusCounts.delayed + flightStatusCounts.cancelled) / totalFlights) * 100}%,
                      #a855f7 ${((flightStatusCounts.active + flightStatusCounts.delayed + flightStatusCounts.cancelled) / totalFlights) * 100}% 100%
                    )`
              }}
            >
              <div className="absolute inset-4 bg-slate-950 rounded-full flex flex-col items-center justify-center border border-slate-800">
                <span className="text-3xl font-bold text-white">{totalFlights}</span>
                <span className="text-xs text-slate-400">Total Flights</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="text-xs text-slate-300">正常 ({flightStatusCounts.active})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="text-xs text-slate-300">延误 ({flightStatusCounts.delayed})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-xs text-slate-300">取消 ({flightStatusCounts.cancelled})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span>
              <span className="text-xs text-slate-300">满员 ({flightStatusCounts.full})</span>
            </div>
          </div>
        </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[520px]">
          <div className="lg:col-span-2 rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 relative flex flex-col">
            <div className="absolute inset-0 opacity-50 pointer-events-none">
              <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
              <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
            </div>

            <div className="relative z-10 flex items-center justify-between px-6 pt-5 lg:px-8">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-400" /> 实时航线监控
                </h3>
                <p className="text-xs text-slate-400 mt-1">Real-time Global Operations</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-300">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> 中心枢纽
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400" /> 普通航点
                </div>
              </div>
            </div>

            <div className="relative z-10 flex-1">
              <WorldMap
                points={[
                  { id: 'PEK', name: '北京', lat: 39.9, lng: 116.4, value: 98, type: 'hub', info: 'Status: OK' },
                  { id: 'SHA', name: '上海', lat: 31.2, lng: 121.3, value: 95, type: 'hub', info: 'Status: Busy' },
                  { id: 'CAN', name: '广州', lat: 23.1, lng: 113.2, value: 92, type: 'hub', info: 'Status: OK' },
                  { id: 'LHR', name: '伦敦', lat: 51.5, lng: -0.45, value: 85, type: 'normal', info: 'Delayed' },
                  { id: 'JFK', name: '纽约', lat: 40.6, lng: -73.7, value: 82, type: 'normal', info: 'Status: OK' },
                  { id: 'SYD', name: '悉尼', lat: -33.9, lng: 151.2, value: 75, type: 'normal', info: 'Status: OK' },
                ]}
                theme="dark"
                preserveAspectRatio="xMidYMin meet"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950 shadow-sm flex flex-col overflow-hidden relative">
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
              <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
            </div>

            <div className="relative p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" /> 热门航线 TOP 5
              </h3>
              <span className="text-[11px] text-slate-400">按近 7 日累计量排序</span>
            </div>
            <div className="relative flex-1 overflow-y-auto p-3">
                {[
                  { from: '北京 (PEK)', to: '上海 (SHA)', vol: 2450, trend: 'up' },
                  { from: '北京 (PEK)', to: '广州 (CAN)', vol: 1890, trend: 'up' },
                  { from: '上海 (SHA)', to: '深圳 (SZX)', vol: 1650, trend: 'down' },
                  { from: '广州 (CAN)', to: '杭州 (HGH)', vol: 1200, trend: 'up' },
                  { from: '成都 (CTU)', to: '北京 (PEK)', vol: 1100, trend: 'stable' },
                ].map((route, i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-900/50 rounded-2xl transition-colors mb-1 last:mb-0 border border-transparent hover:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${i < 3 ? 'bg-blue-500/15 text-blue-200 border border-blue-500/20' : 'bg-slate-900/60 text-slate-300 border border-slate-800'}`}>
                            {i + 1}
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-100">{route.from}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-1">
                              <ArrowRightLeft className="w-3 h-3" /> {route.to}
                            </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">{route.vol}</div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            route.trend === 'up' ? 'bg-red-500/10 text-red-300 border border-red-500/20' : route.trend === 'down' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-slate-900/60 text-slate-300 border border-slate-800'
                        }`}>
                            {route.trend === 'up' ? '↑ 热度上升' : route.trend === 'down' ? '↓ 热度下降' : '- 持平'}
                        </span>
                      </div>
                  </div>
                ))}
            </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
