
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { DollarSign, TrendingUp, CalendarCheck, Plane, Users, Globe, ArrowRightLeft, AlertCircle } from 'lucide-react';
import WorldMap from '../../components/common/WorldMap';
import { getAdminDashboardMetrics, type AdminDashboardMetrics } from '../../features/admin/api/dashboard';

// 数字增长动画Hook
function useCountUp(target: number, duration: number = 1000) {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const requestRef = useRef<number>();

  useEffect(() => {
    startTimeRef.current = null;
    setCount(0);

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      
      // 使用easeOutQuart缓动函数
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(target * easeOutQuart));

      if (progress < 1) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    if (target > 0) {
      requestRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [target, duration]);

  return count;
}

// 机场代码到坐标的映射（常见机场）
const AIRPORT_COORDS: Record<string, { lat: number; lng: number }> = {
  // 国内主要机场
  'PEK': { lat: 39.9, lng: 116.4 },    // 北京首都
  'PKX': { lat: 39.5, lng: 116.4 },    // 北京大兴
  'SHA': { lat: 31.2, lng: 121.3 },    // 上海虹桥
  'PVG': { lat: 31.1, lng: 121.8 },    // 上海浦东
  'CAN': { lat: 23.1, lng: 113.2 },    // 广州白云
  'SZX': { lat: 22.6, lng: 113.8 },    // 深圳宝安
  'CTU': { lat: 30.6, lng: 103.9 },    // 成都双流
  'TFU': { lat: 30.3, lng: 104.4 },    // 成都天府
  'CKG': { lat: 29.7, lng: 106.6 },    // 重庆江北
  'HGH': { lat: 30.2, lng: 120.4 },    // 杭州萧山
  'XIY': { lat: 34.4, lng: 108.8 },    // 西安咸阳
  'KMG': { lat: 25.1, lng: 102.9 },    // 昆明长水
  'WUH': { lat: 30.8, lng: 114.2 },    // 武汉天河
  'CSX': { lat: 28.2, lng: 113.2 },    // 长沙黄花
  'NKG': { lat: 31.7, lng: 118.9 },    // 南京禄口
  // 国际机场
  'JFK': { lat: 40.6, lng: -73.7 },    // 纽约肯尼迪
  'LAX': { lat: 33.9, lng: -118.4 },   // 洛杉矶
  'LHR': { lat: 51.5, lng: -0.45 },    // 伦敦希思罗
  'CDG': { lat: 49.0, lng: 2.5 },      // 巴黎戴高乐
  'DXB': { lat: 25.3, lng: 55.4 },     // 迪拜
  'SYD': { lat: -33.9, lng: 151.2 },   // 悉尼
  'NRT': { lat: 35.8, lng: 140.4 },    // 东京成田
  'ICN': { lat: 37.5, lng: 126.4 },    // 首尔仁川
  'SIN': { lat: 1.4, lng: 103.9 },     // 新加坡樟宜
};

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('[Dashboard] 开始请求后端数据...');
        const m = await getAdminDashboardMetrics();
        console.log('[Dashboard] 后端返回数据:', m);
        
        // 🔍 关键数据检查
        const ordersTrendValid = m?.ordersTrend7d && Array.isArray(m.ordersTrend7d) && m.ordersTrend7d.length > 0;
        const topRoutesValid = m?.topRoutes7d && Array.isArray(m.topRoutes7d) && m.topRoutes7d.length > 0;
        
        console.log('[Dashboard] 📊 订单趋势:', {
          valid: ordersTrendValid,
          length: m?.ordersTrend7d?.length || 0,
          totalCount: ordersTrendValid ? m.ordersTrend7d!.reduce((sum, item) => sum + (item.count || 0), 0) : 0,
          data: m?.ordersTrend7d
        });
        
        console.log('[Dashboard] 🛫 热门航线:', {
          valid: topRoutesValid,
          length: m?.topRoutes7d?.length || 0,
          data: m?.topRoutes7d
        });
        
        // 💾 保存到全局变量供调试
        (window as any).__DASHBOARD_METRICS__ = m;
        
        if (!alive) return;
        setMetrics(m);
      } catch (e: any) {
        console.error('[Dashboard] 请求失败:', e);
        if (!alive) return;
        setError(e?.message || '加载失败');
        setMetrics(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, []);

  const todayOrderCount = metrics?.todayOrderCount ?? 0;
  const todayGmv = Number(metrics?.todayGmv ?? 0);
  const totalRev = Number(metrics?.totalGmv ?? 0);

  const totalBookings = metrics?.orderCount ?? 0;
  const todayNewUsers = metrics?.todayNewUsers ?? 0;
  const totalUsers = metrics?.userCount ?? 0;
  const upcomingFlights = metrics?.upcomingFlights ?? 0;
  const pendingRefundAudits = metrics?.pendingRefundAudits ?? 0;
  
  // 新增：更多统计数据
  const paymentCount = metrics?.paymentCount ?? 0;
  const adminCount = metrics?.adminCount ?? 0;
  const changeRequestCount = metrics?.changeRequestCount ?? 0;
  const operationLogCount = metrics?.operationLogCount ?? 0;

  // 使用数字增长动画
  const animatedOrderCount = useCountUp(todayOrderCount, 1200);
  const animatedGmv = useCountUp(todayGmv, 1400);
  const animatedNewUsers = useCountUp(todayNewUsers, 1000);
  const animatedUpcomingFlights = useCountUp(upcomingFlights, 1300);
  const animatedPendingRefunds = useCountUp(pendingRefundAudits, 1100);
  const animatedTotalRev = useCountUp(totalRev, 1500);

  const formatMMDD = (d: Date) => {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}-${dd}`;
  };

  // 生成默认的空数据（降级方案）
  const getDefaultTrendData = () => {
    const base = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() - (6 - i));
      return { date: formatMMDD(d), count: 0 };
    });
  };

  // 直接计算订单趋势数据（不使用 useMemo，避免依赖问题）
  let ordersTrendData: Array<{ date: string; count: number }>;
  
  if (metrics?.ordersTrend7d && Array.isArray(metrics.ordersTrend7d) && metrics.ordersTrend7d.length > 0) {
    ordersTrendData = metrics.ordersTrend7d.map((item) => ({
      date: item.date?.slice?.(5) || item.date || '',
      count: Number(item.count) || 0
    }));
    console.log('[订单趋势] ✅ 使用后端数据:', ordersTrendData);
  } else {
    ordersTrendData = getDefaultTrendData();
    if (metrics) {
      console.warn('[订单趋势] ⚠️ 后端数据无效，使用默认数据');
    }
  }

  const maxOrders = Math.max(1, ...ordersTrendData.map((d) => d.count));
  const totalOrders = ordersTrendData.reduce((sum, d) => sum + d.count, 0);
  
  // 输出渲染关键信息
  if (metrics && !loading) {
    console.log('[订单趋势-渲染] 数据:', { totalOrders, maxOrders, data: ordersTrendData });
  }

  // GMV 趋势数据
  let gmvTrendData: Array<{ date: string; amount: number }>;
  
  if (metrics?.gmvTrend7d && Array.isArray(metrics.gmvTrend7d) && metrics.gmvTrend7d.length > 0) {
    gmvTrendData = metrics.gmvTrend7d.map((item) => ({
      date: item.date?.slice?.(5) || item.date || '',
      amount: Number(item.amount) || 0
    }));
  } else {
    const base = new Date();
    gmvTrendData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() - (6 - i));
      return { date: formatMMDD(d), amount: 0 };
    });
  }
  
  const maxGmv = Math.max(1, ...gmvTrendData.map((d) => d.amount));
  const totalGmv7d = gmvTrendData.reduce((sum, d) => sum + d.amount, 0);
  
  const flightStatusCounts = {
    active: metrics?.flightStatusNormalCount ?? 0,
    delayed: metrics?.flightStatusDelayedCount ?? 0,
    cancelled: metrics?.flightStatusCancelledCount ?? 0,
    full: 0,
  };
  const totalFlights = metrics?.flightCount ?? 0;
  const flightPieTotal = Math.max(
    1,
    flightStatusCounts.active + flightStatusCounts.delayed + flightStatusCounts.cancelled + flightStatusCounts.full,
  );

  // 🛫 处理实时航线监控地图数据（直接计算，不使用 useMemo）
  let mapPointsAndRoutes: { points: any[]; routes: any[] };
  
  const topRoutes = metrics?.topRoutes7d || [];
  
  if (topRoutes.length > 0) {
    const pointsMap = new Map<string, any>();
    const routes: Array<{ from: string; to: string }> = [];

    topRoutes.forEach((route, idx) => {
      const { departureAirport, departureCity, arrivalAirport, arrivalCity, orders, gmv } = route;
      
      const depCoords = AIRPORT_COORDS[departureAirport] || { lat: 0, lng: 0 };
      if (!pointsMap.has(departureAirport)) {
        pointsMap.set(departureAirport, {
          id: departureAirport,
          name: departureCity,
          lat: depCoords.lat,
          lng: depCoords.lng,
          value: 95 - idx * 3,
          type: idx < 2 ? 'hub' : 'normal',
          info: `${orders} 单 · ¥${gmv.toLocaleString()}`
        });
      }
      
      const arrCoords = AIRPORT_COORDS[arrivalAirport] || { lat: 0, lng: 0 };
      if (!pointsMap.has(arrivalAirport)) {
        pointsMap.set(arrivalAirport, {
          id: arrivalAirport,
          name: arrivalCity,
          lat: arrCoords.lat,
          lng: arrCoords.lng,
          value: 95 - idx * 3,
          type: idx < 2 ? 'hub' : 'normal',
          info: `${orders} 单 · ¥${gmv.toLocaleString()}`
        });
      }

      routes.push({ from: departureAirport, to: arrivalAirport });
    });

    mapPointsAndRoutes = {
      points: Array.from(pointsMap.values()).filter(p => p.lat !== 0 && p.lng !== 0),
      routes
    };
    console.log('[航线监控] ✅ 使用后端数据:', mapPointsAndRoutes.points.length, '个航点');
  } else {
    // 降级方案
    mapPointsAndRoutes = {
      points: [
        { id: 'PEK', name: '北京', lat: 39.9, lng: 116.4, value: 98, type: 'hub' as const, info: 'Status: OK' },
        { id: 'SHA', name: '上海', lat: 31.2, lng: 121.3, value: 95, type: 'hub' as const, info: 'Status: Busy' },
        { id: 'CAN', name: '广州', lat: 23.1, lng: 113.2, value: 92, type: 'hub' as const, info: 'Status: OK' },
      ],
      routes: []
    };
    if (metrics) {
      console.warn('[航线监控] ⚠️ 无热门航线数据，使用默认航点');
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* 极光流光背景 */}
      <style>{`
        @keyframes aurora {
          0%, 100% { transform: translateX(-10%) translateY(0) rotate(0deg); opacity: 0.4; }
          25% { transform: translateX(5%) translateY(-5%) rotate(2deg); opacity: 0.6; }
          50% { transform: translateX(10%) translateY(5%) rotate(-1deg); opacity: 0.5; }
          75% { transform: translateX(-5%) translateY(2%) rotate(1deg); opacity: 0.55; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255,255,255,0.05); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.25), inset 0 1px 0 rgba(255,255,255,0.1); }
        }
        .aurora-bg { animation: aurora 20s ease-in-out infinite; }
        .glow-card { animation: glow-pulse 4s ease-in-out infinite; }
      `}</style>

      {/* 错误提示横幅 */}
      {error && (
        <div className="relative overflow-hidden rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-950/80 to-red-900/60 backdrop-blur-xl p-5 shadow-xl shadow-red-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-red-200 mb-1 text-base">数据加载失败</h3>
              <p className="text-sm text-red-300/90 leading-relaxed">
                无法连接后端服务，请检查服务状态或网络连接。
                <span className="text-red-400/70 ml-2 text-xs">错误: {error}</span>
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* 顶部 Header 区域 */}
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-700/50 bg-gradient-to-br from-slate-950 via-[#0c1222] to-slate-950 shadow-2xl shadow-blue-500/5">
        {/* 极光背景层 */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="aurora-bg absolute -left-48 -top-24 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-blue-600/30 via-indigo-500/20 to-transparent blur-3xl" />
          <div className="aurora-bg absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-gradient-to-bl from-violet-500/25 via-purple-500/15 to-transparent blur-3xl" style={{ animationDelay: '-5s' }} />
          <div className="aurora-bg absolute left-1/3 bottom-0 h-[300px] w-[600px] rounded-full bg-gradient-to-t from-cyan-500/10 via-blue-500/5 to-transparent blur-3xl" style={{ animationDelay: '-10s' }} />
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
                  {loading ? '● 加载中' : error ? '○ 离线' : '● 实时'}
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

          {/* 统计卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 卡片1 - 今日订单与GMV */}
            <div 
              className="group relative rounded-[1.5rem] border border-slate-700/40 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80 p-6 shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1"
            >
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
                      <div className="text-base font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent tabular-nums">¥{loading ? '—' : animatedGmv.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800/50 text-xs text-slate-500">
                    累计 GMV：<span className="text-slate-300 font-semibold tabular-nums">¥{totalRev.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 卡片2 - 今日新增用户 */}
            <div 
              className="group relative rounded-[1.5rem] border border-slate-700/40 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80 p-6 shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1"
            >
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

            {/* 卡片3 - 24小时内起飞航班 */}
            <div 
              className="group relative rounded-[1.5rem] border border-slate-700/40 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80 p-6 shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:border-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1"
            >
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <Plane className="w-6 h-6 text-amber-300" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-600/50 bg-slate-800/50 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                    持平
                  </span>
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

            {/* 卡片4 - 待处理退改签 */}
            <div 
              className="group relative rounded-[1.5rem] border border-slate-700/40 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80 p-6 shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:border-violet-500/40 hover:shadow-2xl hover:shadow-violet-500/10 hover:-translate-y-1"
            >
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

      {/* 第一行图表：订单趋势 + 航班状态 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[400px] lg:h-[420px]">
        <div className="lg:col-span-2 rounded-[2rem] overflow-hidden border border-slate-700/40 bg-gradient-to-br from-slate-950 via-[#0c1222] to-slate-950 shadow-2xl shadow-blue-500/5 relative min-h-[400px]">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="aurora-bg absolute -left-32 top-0 h-80 w-80 rounded-full bg-gradient-to-br from-blue-600/20 via-cyan-500/10 to-transparent blur-3xl" />
            <div className="aurora-bg absolute right-0 bottom-0 h-72 w-72 rounded-full bg-gradient-to-tl from-indigo-500/15 via-violet-500/10 to-transparent blur-3xl" style={{ animationDelay: '-7s' }} />
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
                      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-slate-800 to-slate-700 rounded-2xl animate-pulse"
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

        <div className="rounded-[2rem] border border-slate-700/40 bg-gradient-to-br from-slate-950 via-[#0c1222] to-slate-950 shadow-2xl shadow-emerald-500/5 flex flex-col overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="aurora-bg absolute -left-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-emerald-500/15 to-teal-500/10 blur-3xl" />
            <div className="aurora-bg absolute right-0 bottom-0 h-64 w-64 rounded-full bg-gradient-to-tl from-violet-500/10 to-purple-500/5 blur-3xl" style={{ animationDelay: '-12s' }} />
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
                    boxShadow: '0 0 60px rgba(34, 197, 94, 0.15), 0 0 40px rgba(168, 85, 247, 0.1)'
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
                <span className="text-[11px] text-slate-400 font-medium">正常 <span className="text-slate-200 font-semibold">{flightStatusCounts.active}</span></span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/30 border border-slate-800/30 transition-all duration-300 hover:bg-slate-900/50">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-lg shadow-amber-500/40"></span>
                <span className="text-[11px] text-slate-400 font-medium">延误 <span className="text-slate-200 font-semibold">{flightStatusCounts.delayed}</span></span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/30 border border-slate-800/30 transition-all duration-300 hover:bg-slate-900/50">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-lg shadow-rose-500/40"></span>
                <span className="text-[11px] text-slate-400 font-medium">取消 <span className="text-slate-200 font-semibold">{flightStatusCounts.cancelled}</span></span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/30 border border-slate-800/30 transition-all duration-300 hover:bg-slate-900/50">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-lg shadow-violet-500/40"></span>
                <span className="text-[11px] text-slate-400 font-medium">满员 <span className="text-slate-200 font-semibold">{flightStatusCounts.full}</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 第二行：大地图 + 泡泡信息层 */}
      <div className="rounded-[2rem] overflow-hidden border border-slate-700/40 bg-gradient-to-br from-slate-950 via-[#0c1222] to-slate-950 shadow-2xl relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="aurora-bg absolute -left-32 bottom-0 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-blue-600/15 via-cyan-500/10 to-transparent blur-3xl" />
          <div className="aurora-bg absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-gradient-to-bl from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl" style={{ animationDelay: '-8s' }} />
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
              <span className="w-2 h-2 rounded-full bg-red-500 shadow shadow-red-500/50" /> <span className="text-slate-400 font-medium">枢纽</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 shadow shadow-blue-400/50" /> <span className="text-slate-400 font-medium">航点</span>
            </span>
          </div>
        </div>

        {/* 泡泡指标（大屏叠加） */}
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
              <span className="font-bold tabular-nums text-white text-sm">{mapPointsAndRoutes.points.length}</span>
            </div>
            <div className="inline-flex items-center gap-2.5 rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm px-4 py-2 text-[11px]">
              <span className="text-slate-500 font-medium">热门航线</span>
              <span className="font-bold tabular-nums text-white text-sm">{(metrics?.topRoutes7d || []).length}</span>
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
              <div className="h-full w-full lg:pr-[396px]">
                <WorldMap
                  points={mapPointsAndRoutes.points}
                  routes={mapPointsAndRoutes.routes}
                  theme="dark"
                  preserveAspectRatio="xMidYMid meet"
                />
              </div>
            )}

            {/* 热门航线（大屏叠加侧栏泡泡） */}
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
                    (metrics?.topRoutes7d || []).slice(0, 5).map((route, i) => (
                      <div
                        key={route.routeId || i}
                        className="group flex items-center justify-between p-3 rounded-2xl border border-slate-800/40 bg-slate-900/20 hover:bg-slate-900/40 hover:border-slate-700/50 transition-all duration-300"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-transform duration-300 group-hover:scale-105 ${
                            i === 0
                              ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/20 text-amber-200 border border-amber-500/30 shadow-lg shadow-amber-500/10'
                              : i === 1
                              ? 'bg-gradient-to-br from-slate-300/20 to-slate-400/10 text-slate-200 border border-slate-400/30 shadow-lg shadow-slate-400/10'
                              : i === 2
                              ? 'bg-gradient-to-br from-orange-700/30 to-amber-700/20 text-orange-200 border border-orange-700/30 shadow-lg shadow-orange-700/10'
                              : 'bg-slate-900/60 text-slate-400 border border-slate-800/50'
                          }`}>
                            {i + 1}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors">
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
                    ))
                  )}
                  {!loading && (metrics?.topRoutes7d || []).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                      <TrendingUp className="w-10 h-10 text-slate-700 mb-3" />
                      <span className="text-sm">暂无热门航线数据</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 小屏：热门航线放到地图下方（保持可用性） */}
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
                {(metrics?.topRoutes7d || []).slice(0, 5).map((route, i) => (
                  <div
                    key={route.routeId || i}
                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-800/40 bg-slate-900/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        i === 0
                          ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/20 text-amber-200 border border-amber-500/30'
                          : i === 1
                          ? 'bg-gradient-to-br from-slate-300/20 to-slate-400/10 text-slate-200 border border-slate-400/30'
                          : i === 2
                          ? 'bg-gradient-to-br from-orange-700/30 to-amber-700/20 text-orange-200 border border-orange-700/30'
                          : 'bg-slate-900/60 text-slate-400 border border-slate-800/50'
                      }`}>
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
                {!loading && (metrics?.topRoutes7d || []).length === 0 && (
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

      {/* 第三行：GMV趋势 + 系统统计 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GMV趋势图 */}
        <div className="lg:col-span-2 rounded-[2rem] overflow-hidden border border-slate-700/40 bg-gradient-to-br from-slate-950 via-[#0c1222] to-slate-950 shadow-2xl relative">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="aurora-bg absolute -left-24 top-10 h-72 w-72 rounded-full bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-transparent blur-3xl" />
            <div className="aurora-bg absolute right-0 bottom-0 h-80 w-80 rounded-full bg-gradient-to-bl from-cyan-500/15 via-emerald-500/10 to-transparent blur-3xl" style={{ animationDelay: '-10s' }} />
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
                      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-slate-800 to-slate-700 rounded-2xl animate-pulse"
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

        {/* 系统统计面板 */}
        <div className="rounded-[2rem] border border-slate-700/40 bg-gradient-to-br from-slate-950 via-[#0c1222] to-slate-950 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="aurora-bg absolute -left-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-tr from-violet-500/15 via-purple-500/10 to-transparent blur-3xl" />
            <div className="aurora-bg absolute right-0 bottom-0 h-64 w-64 rounded-full bg-gradient-to-bl from-pink-500/15 via-rose-500/10 to-transparent blur-3xl" style={{ animationDelay: '-7s' }} />
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
              {/* 用户统计 */}
              <div className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/30 border border-slate-800/40 hover:bg-slate-900/50 hover:border-blue-500/30 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg shadow-blue-500/10">
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm text-slate-400 font-medium group-hover:text-slate-300 transition-colors">注册用户</span>
                </div>
                <span className="text-lg font-bold text-white tabular-nums">{totalUsers}</span>
              </div>

              {/* 订单统计 */}
              <div className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/30 border border-slate-800/40 hover:bg-slate-900/50 hover:border-emerald-500/30 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg shadow-emerald-500/10">
                    <CalendarCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-sm text-slate-400 font-medium group-hover:text-slate-300 transition-colors">历史订单</span>
                </div>
                <span className="text-lg font-bold text-white tabular-nums">{totalBookings}</span>
              </div>

              {/* 支付统计 */}
              <div className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/30 border border-slate-800/40 hover:bg-slate-900/50 hover:border-cyan-500/30 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-sky-500/10 border border-cyan-500/30 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg shadow-cyan-500/10">
                    <DollarSign className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-sm text-slate-400 font-medium group-hover:text-slate-300 transition-colors">支付记录</span>
                </div>
                <span className="text-lg font-bold text-white tabular-nums">{paymentCount}</span>
              </div>

              {/* 退改签统计 */}
              <div className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/30 border border-slate-800/40 hover:bg-slate-900/50 hover:border-amber-500/30 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg shadow-amber-500/10">
                    <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-sm text-slate-400 font-medium group-hover:text-slate-300 transition-colors">退改申请</span>
                </div>
                <span className="text-lg font-bold text-white tabular-nums">{changeRequestCount}</span>
              </div>

              {/* 管理员统计 */}
              <div className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/30 border border-slate-800/40 hover:bg-slate-900/50 hover:border-violet-500/30 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/30 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg shadow-violet-500/10">
                    <Globe className="w-4 h-4 text-violet-400" />
                  </div>
                  <span className="text-sm text-slate-400 font-medium group-hover:text-slate-300 transition-colors">管理员</span>
                </div>
                <span className="text-lg font-bold text-white tabular-nums">{adminCount}</span>
              </div>

              {/* 操作日志 */}
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
      </div>
    </div>
  );
};

export default Dashboard;
