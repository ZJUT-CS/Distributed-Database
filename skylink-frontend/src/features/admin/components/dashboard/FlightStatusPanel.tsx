import React from 'react';

export type FlightStatusPanelProps = {
  loading: boolean;
  totalFlights: number;
  flightPieTotal: number;
  flightStatusCounts: {
    active: number;
    delayed: number;
    cancelled: number;
    full: number;
  };
};

export function FlightStatusPanel(props: FlightStatusPanelProps) {
  const { loading, totalFlights, flightPieTotal, flightStatusCounts } = props;

  return (
    <div className="rounded-[2rem] border border-slate-700/40 bg-gradient-to-br from-slate-950 via-[#0c1222] to-slate-950 shadow-2xl shadow-emerald-500/5 flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="aurora-bg absolute -left-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-emerald-500/15 to-teal-500/10 blur-3xl" />
        <div
          className="aurora-bg absolute right-0 bottom-0 h-64 w-64 rounded-full bg-gradient-to-tl from-violet-500/10 to-purple-500/5 blur-3xl"
          style={{ animationDelay: '-12s' }}
        />
      </div>

      <div className="relative p-8 flex flex-col flex-1">
        <h3 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-8">航班状态</h3>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-44 h-44 rounded-full border-8 border-slate-800/50 animate-pulse"></div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center relative">
            <div
              className="w-44 h-44 rounded-full relative shadow-2xl transition-all duration-500 hover:scale-105"
              style={{
                background: `conic-gradient(
                  #22c55e 0% ${(flightStatusCounts.active / flightPieTotal) * 100}%, 
                  #eab308 ${(flightStatusCounts.active / flightPieTotal) * 100}% ${((flightStatusCounts.active + flightStatusCounts.delayed) / flightPieTotal) * 100}%,
                  #ef4444 ${((flightStatusCounts.active + flightStatusCounts.delayed) / flightPieTotal) * 100}% ${((flightStatusCounts.active + flightStatusCounts.delayed + flightStatusCounts.cancelled) / flightPieTotal) * 100}%,
                  #a855f7 ${((flightStatusCounts.active + flightStatusCounts.delayed + flightStatusCounts.cancelled) / flightPieTotal) * 100}% 100%
                )`,
                boxShadow: '0 0 60px rgba(34, 197, 94, 0.15), 0 0 40px rgba(168, 85, 247, 0.1)',
              }}
            >
              <div className="absolute inset-4 bg-gradient-to-br from-slate-950 to-[#0a0f1a] rounded-full flex flex-col items-center justify-center border border-slate-800/50 shadow-inner">
                <span className="text-3xl font-extrabold text-white tabular-nums">{totalFlights}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Total Flights</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-auto">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/30 border border-slate-800/30 transition-all duration-300 hover:bg-slate-900/50">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40"></span>
            <span className="text-[11px] text-slate-400 font-medium">
              正常 <span className="text-slate-200 font-semibold">{flightStatusCounts.active}</span>
            </span>
          </div>
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/30 border border-slate-800/30 transition-all duration-300 hover:bg-slate-900/50">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-lg shadow-amber-500/40"></span>
            <span className="text-[11px] text-slate-400 font-medium">
              延误 <span className="text-slate-200 font-semibold">{flightStatusCounts.delayed}</span>
            </span>
          </div>
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/30 border border-slate-800/30 transition-all duration-300 hover:bg-slate-900/50">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-lg shadow-rose-500/40"></span>
            <span className="text-[11px] text-slate-400 font-medium">
              取消 <span className="text-slate-200 font-semibold">{flightStatusCounts.cancelled}</span>
            </span>
          </div>
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/30 border border-slate-800/30 transition-all duration-300 hover:bg-slate-900/50">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-lg shadow-violet-500/40"></span>
            <span className="text-[11px] text-slate-400 font-medium">
              满员 <span className="text-slate-200 font-semibold">{flightStatusCounts.full}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
