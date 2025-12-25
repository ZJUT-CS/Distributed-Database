import type { RouteTopItem } from '../api/dashboard';

export type DashboardMapPointType = 'hub' | 'normal';

export type DashboardMapPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  value: number;
  type: DashboardMapPointType;
  info: string;
};

export type DashboardMapRoute = { from: string; to: string };

export type DashboardMap = {
  points: DashboardMapPoint[];
  routes: DashboardMapRoute[];
};

const toNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export function buildDashboardMap(
  topRoutes7d: RouteTopItem[],
  airportCoords: Record<string, { lat: number; lng: number }>,
): DashboardMap {
  const pointsMap = new Map<string, DashboardMapPoint>();
  const routes: DashboardMapRoute[] = [];

  if (topRoutes7d.length > 0) {
    topRoutes7d.forEach((route, idx) => {
      const { departureAirport, departureCity, arrivalAirport, arrivalCity, orders, gmv } = route;

      const depCoords = airportCoords[departureAirport] ?? { lat: 0, lng: 0 };
      if (!pointsMap.has(departureAirport)) {
        pointsMap.set(departureAirport, {
          id: departureAirport,
          name: departureCity,
          lat: depCoords.lat,
          lng: depCoords.lng,
          value: 95 - idx * 3,
          type: idx < 2 ? 'hub' : 'normal',
          info: `${orders} 单 · ¥${toNumber(gmv).toLocaleString()}`,
        });
      }

      const arrCoords = airportCoords[arrivalAirport] ?? { lat: 0, lng: 0 };
      if (!pointsMap.has(arrivalAirport)) {
        pointsMap.set(arrivalAirport, {
          id: arrivalAirport,
          name: arrivalCity,
          lat: arrCoords.lat,
          lng: arrCoords.lng,
          value: 95 - idx * 3,
          type: idx < 2 ? 'hub' : 'normal',
          info: `${orders} 单 · ¥${toNumber(gmv).toLocaleString()}`,
        });
      }

      routes.push({ from: departureAirport, to: arrivalAirport });
    });
  } else {
    // 降级方案（不依赖后端热门航线）
    pointsMap.set('PEK', {
      id: 'PEK',
      name: '北京',
      lat: 39.9,
      lng: 116.4,
      value: 98,
      type: 'hub',
      info: 'Status: OK',
    });
    pointsMap.set('SHA', {
      id: 'SHA',
      name: '上海',
      lat: 31.2,
      lng: 121.3,
      value: 95,
      type: 'hub',
      info: 'Status: Busy',
    });
    pointsMap.set('CAN', {
      id: 'CAN',
      name: '广州',
      lat: 23.1,
      lng: 113.2,
      value: 92,
      type: 'hub',
      info: 'Status: OK',
    });
  }

  return {
    points: Array.from(pointsMap.values()).filter((p) => p.lat !== 0 && p.lng !== 0),
    routes,
  };
}
