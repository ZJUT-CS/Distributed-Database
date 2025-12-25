import React from 'react';

import type { DashboardTrendCountItem } from '../../../../features/admin/dashboard/viewModel';

export type OrdersTrendPanelProps = {
  loading: boolean;
  ordersTrendData: DashboardTrendCountItem[];
  maxOrders: number;
};

export function OrdersTrendPanel(props: OrdersTrendPanelProps) {
  const { loading, ordersTrendData, maxOrders } = props;

  return (
    <div className="lg:col-span-2 rounded-[2rem] overflow-hidden border border-slate-700/40 bg-gradient-to-br from-slate-950 via-[#0c1222] to-slate-950 shadow-2xl shadow-blue-500/5 relative min-h-[400px]">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="aurora-bg absolute -left-32 top-0 h-80 w-80 rounded-full bg-gradient-to-br from-blue-600/20 via-cyan-500/10 to-transparent blur-3xl" />
        <div
          className="aurora-bg absolute right-0 bottom-0 h-72 w-72 rounded-full bg-gradient-to-tl from-indigo-500/15 via-violet-500/10 to-transparent blur-3xl"
          style={{ animationDelay: '-7s' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/10 via-transparent to-transparent" />
      </div>

      <div className="relative p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">订单趋势</h3>
            <p className="text-xs text-slate-500 mt-1.5 uppercase tracking-wider font-medium">Orders Volume · Last 7 Days</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-900/50 px-3 py-1.5 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">每日订单</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="h-[280px] flex items-end justify-between gap-4 px-2">
            {Array.from({ length: 7 }).map((_, idx) => (
              <div key={idx} className="flex flex-col items-center gap-3 flex-1 h-full">
                <div className="relative w-full flex-1 bg-slate-900/40 rounded-2xl overflow-hidden border border-slate-800/50">
                  <div
                    className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-slate-800 to-slate-700 rounded-2xl animate-pulse"
                    style={{ height: `${Math.random() * 50 + 20}%` }}
                  ></div>
                </div>
                <div className="h-4 w-12 bg-slate-800/50 rounded-full animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[280px] flex items-end justify-between gap-4 px-2">
            {ordersTrendData.map((item, idx) => {
              const heightPercent = maxOrders > 0 ? (item.count / maxOrders) * 100 : 0;
              const displayHeight = item.count > 0 ? Math.max(heightPercent, 5) : 0;
              return (
                <div key={idx} className="flex flex-col items-center gap-3 flex-1 h-full group">
                  <div className="relative w-full flex-1 bg-gradient-to-b from-slate-900/30 to-slate-950/60 rounded-2xl overflow-hidden border border-slate-800/40 ring-1 ring-white/[0.03] transition-all duration-300 hover:border-blue-500/30 hover:ring-blue-500/10">
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-2xl overflow-hidden transition-all duration-700 ease-out"
                      style={{
                        height: `${displayHeight}%`,
                        minHeight: item.count > 0 ? '12px' : '0px',
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-600 via-blue-500 to-cyan-400" />
                      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/20 opacity-80" />
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    </div>
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:-translate-y-1 z-10">
                      <div className="relative">
                        <div className="rounded-2xl border border-slate-700/60 bg-slate-950/90 backdrop-blur-xl px-4 py-2 shadow-2xl shadow-blue-500/20 text-[11px] text-slate-100 whitespace-nowrap">
                          <span className="text-slate-400">订单</span>
                          <span className="mx-1.5 text-slate-600">·</span>
                          <span className="font-bold tabular-nums text-white text-sm">{item.count}</span>
                          <span className="ml-1 text-slate-400">单</span>
                        </div>
                        <div className="absolute left-1/2 top-full -translate-x-1/2 -mt-px w-3 h-3 rotate-45 bg-slate-950/90 border-r border-b border-slate-700/60" />
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold tabular-nums">{item.date}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
