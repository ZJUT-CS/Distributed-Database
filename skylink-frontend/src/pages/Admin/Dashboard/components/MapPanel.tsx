import React from 'react';
import { ArrowRightLeft, Globe, TrendingUp } from 'lucide-react';

import WorldMap from '@/features/map/WorldMap';
import type { DashboardViewModel } from '../../../../features/admin/dashboard/viewModel';

export type MapPanelProps = {
  loading: boolean;
  totalOrders: number;
  totalGmv7d: number;
  map: DashboardViewModel['routes']['map'];
  topRoutes7d: DashboardViewModel['routes']['topRoutes7d'];
};

export function MapPanel(props: MapPanelProps) {
  const { loading, totalOrders, totalGmv7d, map, topRoutes7d } = props;

  return (
    <div className="rounded-[2rem] overflow-hidden border border-slate-700/40 bg-gradient-to-br from-slate-950 via-[#0c1222] to-slate-950 shadow-2xl relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="aurora-bg absolute -left-32 bottom-0 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-blue-600/15 via-cyan-500/10 to-transparent blur-3xl" />
        <div
          className="aurora-bg absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-gradient-to-bl from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl"
          style={{ animationDelay: '-8s' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
      </div>

      <div className="relative px-8 pt-6 lg:px-10 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/10">
              <Globe className="w-5 h-5 text-blue-400" />
            </div>
            实时航线监控
          </h3>
          <p className="text-xs text-slate-500 mt-2 uppercase tracking-wider font-medium ml-[52px]">Real-time Global Operations</p>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 shadow shadow-red-500/50" />{' '}
            <span className="text-slate-400 font-medium">枢纽</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 shadow shadow-blue-400/50" />{' '}
            <span className="text-slate-400 font-medium">航点</span>
          </span>
        </div>
      </div>

      <div className="relative px-8 mt-5 lg:px-10">
        <div className="hidden lg:flex flex-wrap gap-3">
          <div className="inline-flex items-center gap-2.5 rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm px-4 py-2 text-[11px]">
            <span className="text-slate-500 font-medium">近7日订单</span>
            <span className="font-bold tabular-nums text-white text-sm">{totalOrders}</span>
          </div>
          <div className="inline-flex items-center gap-2.5 rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm px-4 py-2 text-[11px]">
            <span className="text-slate-500 font-medium">近7日 GMV</span>
            <span className="font-bold tabular-nums bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent text-sm">¥{totalGmv7d.toLocaleString()}</span>
          </div>
          <div className="inline-flex items-center gap-2.5 rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm px-4 py-2 text-[11px]">
            <span className="text-slate-500 font-medium">航点数</span>
            <span className="font-bold tabular-nums text-white text-sm">{map.points.length}</span>
          </div>
          <div className="inline-flex items-center gap-2.5 rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm px-4 py-2 text-[11px]">
            <span className="text-slate-500 font-medium">热门航线</span>
            <span className="font-bold tabular-nums text-white text-sm">{topRoutes7d.length}</span>
          </div>
        </div>
      </div>

      <div className="relative mt-4 lg:mt-3">
        <div className="relative h-[520px] lg:h-[620px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-900/60 backdrop-blur-sm border border-slate-700/50">
                <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <span className="text-slate-400 text-sm font-medium">加载航线数据中...</span>
              </div>
            </div>
          ) : (
            <div className="h-full w-full">
              <WorldMap
                points={map.points}
                routes={map.routes}
                theme="dark"
                enableControls
                autoFit
                minScale={0.5}
                maxScale={5}
              />
            </div>
          )}

          <div className="hidden lg:block absolute right-6 top-4 bottom-4 w-[360px]">
            <div className="h-full rounded-[1.5rem] border border-slate-700/50 bg-slate-950/80 backdrop-blur-xl shadow-2xl shadow-slate-950/50 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-800/50 flex items-center justify-between bg-gradient-to-r from-slate-900/50 to-transparent">
                <h4 className="font-bold text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/10">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                  </div>
                  热门航线 TOP 5
                </h4>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold px-2 py-1 rounded-md bg-slate-800/50">近 7 日</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl border border-slate-800/30 bg-slate-900/20 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800/50"></div>
                        <div>
                          <div className="h-4 w-32 bg-slate-800/50 rounded mb-2"></div>
                          <div className="h-3 w-24 bg-slate-800/50 rounded"></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="h-4 w-12 bg-slate-800/50 rounded mb-2"></div>
                        <div className="h-3 w-16 bg-slate-800/50 rounded"></div>
                      </div>
                    </div>
                  ))
                ) : (
                  topRoutes7d.slice(0, 5).map((route, i) => (
                    <div
                      key={route.routeId || i}
                      className="group flex items-center justify-between p-3 rounded-2xl border border-slate-800/40 bg-slate-900/20 hover:bg-slate-900/40 hover:border-slate-700/50 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-transform duration-300 group-hover:scale-105 ${
                            i === 0
                              ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/20 text-amber-200 border border-amber-500/30 shadow-lg shadow-amber-500/10'
                              : i === 1
                                ? 'bg-gradient-to-br from-slate-300/20 to-slate-400/10 text-slate-200 border border-slate-400/30 shadow-lg shadow-slate-400/10'
                                : i === 2
                                  ? 'bg-gradient-to-br from-orange-700/30 to-amber-700/20 text-orange-200 border border-orange-700/30 shadow-lg shadow-orange-700/10'
                                  : 'bg-slate-900/60 text-slate-400 border border-slate-800/50'
                          }`}
                        >
                          {i + 1}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors">
                            {route.departureCity}{' '}
                            <span className="text-slate-500 font-medium">({route.departureAirport})</span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <ArrowRightLeft className="w-3 h-3 text-slate-600" />
                            {route.arrivalCity} <span className="text-slate-600">({route.arrivalAirport})</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-white tabular-nums">{route.orders}</div>
                        <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 tabular-nums font-semibold">
                          ¥{route.gmv.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                {!loading && topRoutes7d.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <TrendingUp className="w-10 h-10 text-slate-700 mb-3" />
                    <span className="text-sm">暂无热门航线数据</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:hidden px-4 pb-4">
          <div className="mt-4 rounded-[1.5rem] border border-slate-700/50 bg-slate-950/80 backdrop-blur-xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800/50 flex items-center justify-between bg-gradient-to-r from-slate-900/50 to-transparent">
              <h4 className="font-bold text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                </div>
                热门航线 TOP 5
              </h4>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold px-2 py-1 rounded-md bg-slate-800/50">近 7 日</span>
            </div>
            <div className="p-3 space-y-2">
              {topRoutes7d.slice(0, 5).map((route, i) => (
                <div key={route.routeId || i} className="flex items-center justify-between p-3 rounded-2xl border border-slate-800/40 bg-slate-900/20">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        i === 0
                          ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/20 text-amber-200 border border-amber-500/30'
                          : i === 1
                            ? 'bg-gradient-to-br from-slate-300/20 to-slate-400/10 text-slate-200 border border-slate-400/30'
                            : i === 2
                              ? 'bg-gradient-to-br from-orange-700/30 to-amber-700/20 text-orange-200 border border-orange-700/30'
                              : 'bg-slate-900/60 text-slate-400 border border-slate-800/50'
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-100">
                        {route.departureCity} <span className="text-slate-500 font-medium">({route.departureAirport})</span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <ArrowRightLeft className="w-3 h-3 text-slate-600" />
                        {route.arrivalCity} <span className="text-slate-600">({route.arrivalAirport})</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-white tabular-nums">{route.orders}</div>
                    <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 tabular-nums font-semibold">
                      ¥{route.gmv.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
              {!loading && topRoutes7d.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                  <TrendingUp className="w-10 h-10 text-slate-700 mb-3" />
                  <span className="text-sm">暂无热门航线数据</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
