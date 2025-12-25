import React from 'react';
import { AlertCircle, CalendarCheck, DollarSign, Plane, TrendingUp, Users } from 'lucide-react';

export type DashboardHeaderSectionProps = {
  loading: boolean;
  errorMessage: string | null;

  todayOrderCount: number;
  todayGmv: number;
  todayNewUsers: number;

  totalUsers: number;
  totalBookings: number;
  totalFlights: number;
  totalRev: number;

  animatedOrderCount: number;
  animatedGmv: number;
  animatedNewUsers: number;
  animatedUpcomingFlights: number;
  animatedPendingRefunds: number;
};

export function DashboardHeaderSection(props: DashboardHeaderSectionProps) {
  const {
    loading,
    errorMessage,
    todayOrderCount,
    todayGmv,
    todayNewUsers,
    totalUsers,
    totalBookings,
    totalFlights,
    totalRev,
    animatedOrderCount,
    animatedGmv,
    animatedNewUsers,
    animatedUpcomingFlights,
    animatedPendingRefunds,
  } = props;

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-700/50 bg-gradient-to-br from-slate-950 via-[#0c1222] to-slate-950 shadow-2xl shadow-blue-500/5">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora-bg absolute -left-48 -top-24 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-blue-600/30 via-indigo-500/20 to-transparent blur-3xl" />
        <div
          className="aurora-bg absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-gradient-to-bl from-violet-500/25 via-purple-500/15 to-transparent blur-3xl"
          style={{ animationDelay: '-5s' }}
        />
        <div
          className="aurora-bg absolute left-1/3 bottom-0 h-[300px] w-[600px] rounded-full bg-gradient-to-t from-cyan-500/10 via-blue-500/5 to-transparent blur-3xl"
          style={{ animationDelay: '-10s' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/20 via-transparent to-transparent" />
      </div>

      <div className="relative px-8 py-8 md:px-12 md:py-10 flex flex-col gap-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2.5 rounded-full bg-slate-900/80 border border-slate-700/60 px-4 py-1.5 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-300">
                SKYLINK GLOBAL OPS CENTER
              </span>
            </div>
            <div className="flex items-end gap-4">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                全球航旅运营监控大屏
              </h1>
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 backdrop-blur-sm shadow-lg shadow-emerald-500/10">
                {loading ? '● 加载中' : errorMessage ? '○ 离线' : '● 实时'}
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
              汇总订单、航班、用户与支付等多维度指标，辅助运营与值班人员快速掌握系统运行状况。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 justify-start lg:justify-end">
            <div className="glow-card rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/90 to-slate-950/90 px-5 py-3 flex items-center gap-4 backdrop-blur-sm">
              <div className="flex flex-col text-right">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">今日订单</span>
                <span className="text-xl font-bold text-white tabular-nums">
                  {todayOrderCount}
                  <span className="ml-1 text-xs text-slate-500 font-normal">单</span>
                </span>
              </div>
              <div className="h-10 w-px bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
              <div className="flex flex-col text-right">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">今日 GMV</span>
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent tabular-nums">
                  ¥{todayGmv.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="glow-card rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/90 to-slate-950/90 px-5 py-3 flex items-center gap-4 backdrop-blur-sm">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/10">
                <Users className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">新增用户</span>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300 border border-emerald-500/25 font-semibold">
                    <TrendingUp className="w-3 h-3" /> +8.2%
                  </span>
                </div>
                <div className="text-lg font-bold text-white mt-0.5 tabular-nums">
                  {todayNewUsers}
                  <span className="text-xs text-slate-500 font-normal ml-1">人</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="group relative rounded-[1.5rem] border border-slate-700/40 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80 p-6 shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/10 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <DollarSign className="w-6 h-6 text-blue-300" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                  <TrendingUp className="w-3 h-3" /> +12.5%
                </span>
              </div>
              <div className="mt-5">
                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold">今日订单与 GMV</p>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <div className="text-4xl font-extrabold text-white tabular-nums tracking-tight">{loading ? '—' : animatedOrderCount}</div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">GMV</div>
                    <div className="text-base font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent tabular-nums">
                      ¥{loading ? '—' : animatedGmv.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800/50 text-xs text-slate-500">
                  累计 GMV：<span className="text-slate-300 font-semibold tabular-nums">¥{totalRev.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative rounded-[1.5rem] border border-slate-700/40 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80 p-6 shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/10 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <CalendarCheck className="w-6 h-6 text-indigo-300" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                  <TrendingUp className="w-3 h-3" /> +8.2%
                </span>
              </div>
              <div className="mt-5">
                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold">今日新增用户</p>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <div className="text-4xl font-extrabold text-white tabular-nums tracking-tight">{loading ? '—' : animatedNewUsers}</div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">总数</div>
                    <div className="text-base font-bold text-slate-200 tabular-nums">{totalUsers}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative rounded-[1.5rem] border border-slate-700/40 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80 p-6 shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:border-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Plane className="w-6 h-6 text-amber-300" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-600/50 bg-slate-800/50 px-2.5 py-1 text-[11px] font-semibold text-slate-400">持平</span>
              </div>
              <div className="mt-5">
                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold">24h 起飞航班</p>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <div className="text-4xl font-extrabold text-white tabular-nums tracking-tight">{loading ? '—' : animatedUpcomingFlights}</div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">总航班</div>
                    <div className="text-base font-bold text-slate-200 tabular-nums">{totalFlights}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative rounded-[1.5rem] border border-slate-700/40 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80 p-6 shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:border-violet-500/40 hover:shadow-2xl hover:shadow-violet-500/10 hover:-translate-y-1">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/10 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/30 flex items-center justify-center shadow-lg shadow-violet-500/10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <AlertCircle className="w-6 h-6 text-violet-300" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-300">
                  <TrendingUp className="w-3 h-3" /> +24%
                </span>
              </div>
              <div className="mt-5">
                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold">待处理退改签</p>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <div className="text-4xl font-extrabold text-white tabular-nums tracking-tight">{loading ? '—' : animatedPendingRefunds}</div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">总订单</div>
                    <div className="text-base font-bold text-slate-200 tabular-nums">{totalBookings}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
