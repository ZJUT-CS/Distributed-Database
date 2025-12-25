import type { AdminDashboardMetrics, RouteTopItem } from '../api/dashboard';
import { buildDashboardMap } from './map';
import type { DashboardMap, RouteDictItem, CityDictItem } from './map';

export type DashboardTrendCountItem = { date: string; count: number };
export type DashboardTrendAmountItem = { date: string; amount: number };

export type DashboardViewModel = {
  kpis: {
    todayOrderCount: number;
    todayGmv: number;
    totalGmv: number;

    orderCount: number;
    todayNewUsers: number;
    userCount: number;
    upcomingFlights: number;
    pendingRefundAudits: number;

    paymentCount: number;
    adminCount: number;
    changeRequestCount: number;
    operationLogCount: number;

    flightCount: number;
  };
  flightStatus: {
    active: number;
    delayed: number;
    cancelled: number;
    full: number;
    totalFlights: number;
    pieTotal: number;
  };
  trends: {
    orders7d: DashboardTrendCountItem[];
    gmv7d: DashboardTrendAmountItem[];
    maxOrders: number;
    maxGmv: number;
    totalOrders7d: number;
    totalGmv7d: number;
  };
  routes: {
    topRoutes7d: RouteTopItem[];
    map: DashboardMap;
  };
};

type RouteDictLike = {
  routeId: number;
  departureCity?: string | null;
  departureAirport?: string | null;
  arrivalCity?: string | null;
  arrivalAirport?: string | null;
};

const toNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeDateLabel = (dateStr: string) => {
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.slice(5, 10);
  return dateStr;
};

const formatMMDD = (d: Date) => {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}-${dd}`;
};

const buildFallback7d = <T>(buildItem: (d: Date) => T, now: Date) => {
  const out: T[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const dt = new Date(now);
    dt.setDate(now.getDate() - i);
    out.push(buildItem(dt));
  }
  return out;
};

export function buildAdminDashboardViewModel(
  metrics: AdminDashboardMetrics | null,
  opts: {
    airportCoords: Record<string, { lat: number; lng: number }>;
    routeDict?: RouteDictLike[] | null;
    routeDictFull?: RouteDictItem[] | null;
    cityDict?: CityDictItem[] | null;
  },
): DashboardViewModel {
  const now = new Date();
  const airportCoords = opts.airportCoords;
  const routeDict = opts.routeDict ?? null;
  const routeDictFull = opts.routeDictFull ?? null;
  const cityDict = opts.cityDict ?? null;

  const ordersRaw = metrics?.ordersTrend7d ?? [];
  const gmvRaw = metrics?.gmvTrend7d ?? [];

  const orders7d: DashboardTrendCountItem[] = ordersRaw.length
    ? ordersRaw.slice(-7).map((d) => ({
        date: normalizeDateLabel(String((d as any)?.date ?? '')),
        count: toNumber((d as any)?.count),
      }))
    : buildFallback7d((dt) => ({ date: formatMMDD(dt), count: 0 }), now);

  const gmv7d: DashboardTrendAmountItem[] = gmvRaw.length
    ? gmvRaw.slice(-7).map((d) => ({
        date: normalizeDateLabel(String((d as any)?.date ?? '')),
        amount: toNumber((d as any)?.amount),
      }))
    : buildFallback7d((dt) => ({ date: formatMMDD(dt), amount: 0 }), now);

  const maxOrders = Math.max(0, ...orders7d.map((d) => d.count));
  const maxGmv = Math.max(0, ...gmv7d.map((d) => d.amount));
  const totalOrders7d = orders7d.reduce((sum, d) => sum + d.count, 0);
  const totalGmv7d = gmv7d.reduce((sum, d) => sum + d.amount, 0);

  const topRoutes7dRaw: RouteTopItem[] = metrics?.topRoutes7d ?? [];

  const topRoutes7d: RouteTopItem[] = (() => {
    if (!routeDict || routeDict.length === 0 || topRoutes7dRaw.length === 0) return topRoutes7dRaw;

    const byId = new Map<number, RouteDictLike>();
    routeDict.forEach((r) => {
      if (typeof r?.routeId === 'number') byId.set(r.routeId, r);
    });

    const norm = (v: unknown) => {
      const s = typeof v === 'string' ? v.trim() : '';
      return s.length ? s : '';
    };

    return topRoutes7dRaw.map((item) => {
      const rid = (item as any)?.routeId;
      const dict = typeof rid === 'number' ? byId.get(rid) : undefined;
      if (!dict) return item;

      const patched: RouteTopItem = { ...item };

      if (!norm((patched as any).departureAirport)) (patched as any).departureAirport = norm(dict.departureAirport);
      if (!norm((patched as any).arrivalAirport)) (patched as any).arrivalAirport = norm(dict.arrivalAirport);
      if (!norm((patched as any).departureCity)) (patched as any).departureCity = norm(dict.departureCity);
      if (!norm((patched as any).arrivalCity)) (patched as any).arrivalCity = norm(dict.arrivalCity);

      return patched;
    });
  })();

  const map = (() => {
    const routeIds = new Set(topRoutes7d.map(r => r.routeId));
    const filteredRoutes = (routeDictFull ?? []).filter(r => routeIds.has(r.routeId));
    return buildDashboardMap(filteredRoutes, cityDict ?? [], airportCoords, 10);
  })();

  const active = toNumber(metrics?.flightStatusNormalCount);
  const delayed = toNumber(metrics?.flightStatusDelayedCount);
  const cancelled = toNumber(metrics?.flightStatusCancelledCount);
  const full = 0;
  const totalFlights = toNumber(metrics?.flightCount);
  const pieTotal = Math.max(1, active + delayed + cancelled + full);

  return {
    kpis: {
      todayOrderCount: toNumber(metrics?.todayOrderCount),
      todayGmv: toNumber(metrics?.todayGmv),
      totalGmv: toNumber(metrics?.totalGmv),

      orderCount: toNumber(metrics?.orderCount),
      todayNewUsers: toNumber(metrics?.todayNewUsers),
      userCount: toNumber(metrics?.userCount),
      upcomingFlights: toNumber(metrics?.upcomingFlights),
      pendingRefundAudits: toNumber(metrics?.pendingRefundAudits),

      paymentCount: toNumber(metrics?.paymentCount),
      adminCount: toNumber(metrics?.adminCount),
      changeRequestCount: toNumber(metrics?.changeRequestCount),
      operationLogCount: toNumber(metrics?.operationLogCount),

      flightCount: totalFlights,
    },
    flightStatus: {
      active,
      delayed,
      cancelled,
      full,
      totalFlights,
      pieTotal,
    },
    trends: {
      orders7d,
      gmv7d,
      maxOrders,
      maxGmv,
      totalOrders7d,
      totalGmv7d,
    },
    routes: {
      topRoutes7d,
      map,
    },
  };
}
