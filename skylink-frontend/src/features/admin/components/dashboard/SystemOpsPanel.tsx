import React from 'react';
import { ArrowRightLeft, CalendarCheck, DollarSign, Globe, TrendingUp, Users } from 'lucide-react';

export type SystemOpsPanelProps = {
  totalUsers: number;
  totalBookings: number;
  paymentCount: number;
  changeRequestCount: number;
  adminCount: number;
  operationLogCount: number;
};

export function SystemOpsPanel(props: SystemOpsPanelProps) {
  const { totalUsers, totalBookings, paymentCount, changeRequestCount, adminCount, operationLogCount } = props;

  return (
    <div className="rounded-[2rem] border border-slate-700/40 bg-gradient-to-br from-slate-950 via-[#0c1222] to-slate-950 shadow-2xl overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="aurora-bg absolute -left-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-tr from-violet-500/15 via-purple-500/10 to-transparent blur-3xl" />
        <div
          className="aurora-bg absolute right-0 bottom-0 h-64 w-64 rounded-full bg-gradient-to-bl from-pink-500/15 via-rose-500/10 to-transparent blur-3xl"
          style={{ animationDelay: '-7s' }}
        />
      </div>

      <div className="relative p-8">
        <h3 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/30 flex items-center justify-center shadow-lg shadow-violet-500/10">
            <Globe className="w-5 h-5 text-violet-400" />
          </div>
          系统运营
        </h3>
        <p className="text-xs text-slate-500 mt-2 mb-6 uppercase tracking-wider font-medium ml-[52px]">System Operations</p>

        <div className="space-y-2.5">
          <div className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/30 border border-slate-800/40 hover:bg-slate-900/50 hover:border-blue-500/30 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg shadow-blue-500/10">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm text-slate-400 font-medium group-hover:text-slate-300 transition-colors">注册用户</span>
            </div>
            <span className="text-lg font-bold text-white tabular-nums">{totalUsers}</span>
          </div>

          <div className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/30 border border-slate-800/40 hover:bg-slate-900/50 hover:border-emerald-500/30 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg shadow-emerald-500/10">
                <CalendarCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-sm text-slate-400 font-medium group-hover:text-slate-300 transition-colors">历史订单</span>
            </div>
            <span className="text-lg font-bold text-white tabular-nums">{totalBookings}</span>
          </div>

          <div className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/30 border border-slate-800/40 hover:bg-slate-900/50 hover:border-cyan-500/30 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-sky-500/10 border border-cyan-500/30 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg shadow-cyan-500/10">
                <DollarSign className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-sm text-slate-400 font-medium group-hover:text-slate-300 transition-colors">支付记录</span>
            </div>
            <span className="text-lg font-bold text-white tabular-nums">{paymentCount}</span>
          </div>

          <div className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/30 border border-slate-800/40 hover:bg-slate-900/50 hover:border-amber-500/30 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg shadow-amber-500/10">
                <ArrowRightLeft className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-sm text-slate-400 font-medium group-hover:text-slate-300 transition-colors">退改申请</span>
            </div>
            <span className="text-lg font-bold text-white tabular-nums">{changeRequestCount}</span>
          </div>

          <div className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/30 border border-slate-800/40 hover:bg-slate-900/50 hover:border-violet-500/30 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/30 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg shadow-violet-500/10">
                <Globe className="w-4 h-4 text-violet-400" />
              </div>
              <span className="text-sm text-slate-400 font-medium group-hover:text-slate-300 transition-colors">管理员</span>
            </div>
            <span className="text-lg font-bold text-white tabular-nums">{adminCount}</span>
          </div>

          <div className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/30 border border-slate-800/40 hover:bg-slate-900/50 hover:border-pink-500/30 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/10 border border-pink-500/30 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg shadow-pink-500/10">
                <TrendingUp className="w-4 h-4 text-pink-400" />
              </div>
              <span className="text-sm text-slate-400 font-medium group-hover:text-slate-300 transition-colors">操作日志</span>
            </div>
            <span className="text-lg font-bold text-white tabular-nums">{operationLogCount.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
