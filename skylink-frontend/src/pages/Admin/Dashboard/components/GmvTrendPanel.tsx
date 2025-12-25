import React from 'react';
import { TrendingUp } from 'lucide-react';

import type { DashboardTrendAmountItem } from '../../../../features/admin/dashboard/viewModel';

export type GmvTrendPanelProps = {
  loading: boolean;
  gmvTrendData: DashboardTrendAmountItem[];
  maxGmv: number;
  animatedTotalRev: number;
};

export function GmvTrendPanel(props: GmvTrendPanelProps) {
  const { loading, gmvTrendData, maxGmv, animatedTotalRev } = props;

  return (
    <div className="lg:col-span-2 rounded-[2rem] overflow-hidden border border-slate-700/40 bg-gradient-to-br from-slate-950 via-[#0c1222] to-slate-950 shadow-2xl relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="aurora-bg absolute -left-24 top-10 h-72 w-72 rounded-full bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-transparent blur-3xl" />
        <div
          className="aurora-bg absolute right-0 bottom-0 h-80 w-80 rounded-full bg-gradient-to-bl from-cyan-500/15 via-emerald-500/10 to-transparent blur-3xl"
          style={{ animationDelay: '-10s' }}
        />
      </div>

      <div className="relative p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              GMV 趋势
            </h3>
            <p className="text-xs text-slate-500 mt-2 uppercase tracking-wider font-medium ml-[52px]">Gross Merchandise Volume · Last 7 Days</p>
          </div>
          <div className="flex gap-5 items-center">
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1">累计 GMV</div>
              <div className="text-2xl font-extrabold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent tabular-nums">¥{animatedTotalRev.toLocaleString()}</div>
            </div>
            <div className="flex gap-2 items-center px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-700/50 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50"></span>
              <span className="text-[11px] text-slate-400 font-medium">每日金额</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="h-[220px] flex items-end justify-between gap-4 px-2">
            {Array.from({ length: 7 }).map((_, idx) => (
              <div key={idx} className="flex flex-col items-center gap-3 flex-1 h-full">
                <div className="relative w-full flex-1 bg-slate-900/40 rounded-2xl overflow-hidden border border-slate-800/50">
                  <div
                    className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-slate-800 to-slate-700 rounded-2xl animate-pulse"
                    style={{ height: `${Math.random() * 50 + 20}%` }}
                  ></div>
                </div>
                <div className="h-4 w-12 bg-slate-800/50 rounded-lg animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[220px] flex items-end justify-between gap-4 px-2">
            {gmvTrendData.map((item, idx) => {
              const heightPercent = maxGmv > 0 ? (item.amount / maxGmv) * 100 : 0;
              const displayHeight = item.amount > 0 ? Math.max(heightPercent, 5) : 0;
              return (
                <div key={idx} className="flex flex-col items-center gap-3 flex-1 h-full group">
                  <div className="relative w-full flex-1 bg-gradient-to-b from-slate-900/30 to-slate-950/60 rounded-2xl overflow-hidden border border-slate-800/40 ring-1 ring-white/5 shadow-inner transition-all duration-300 hover:border-emerald-500/40 hover:shadow-emerald-500/10">
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-2xl overflow-hidden transition-all duration-700 ease-out shadow-lg shadow-emerald-500/30"
                      style={{
                        height: `${displayHeight}%`,
                        minHeight: item.amount > 0 ? '10px' : '0px',
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-700 via-emerald-500 to-teal-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/25 opacity-70" />
                    </div>
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:-translate-y-1 z-10 pointer-events-none">
                      <div className="relative">
                        <div className="rounded-full border border-emerald-500/40 bg-slate-950/90 backdrop-blur-xl px-4 py-2 shadow-2xl shadow-emerald-500/20 text-[11px] text-slate-100 whitespace-nowrap">
                          <span className="text-slate-400">GMV</span>
                          <span className="mx-1.5 text-slate-600">·</span>
                          <span className="font-bold tabular-nums text-emerald-300">¥{item.amount.toLocaleString()}</span>
                        </div>
                        <div className="absolute left-1/2 top-full -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-slate-950/90 border-r border-b border-emerald-500/40" />
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 font-medium tabular-nums">{item.date}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
