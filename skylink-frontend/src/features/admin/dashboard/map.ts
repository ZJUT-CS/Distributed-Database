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
  dailyDepartures?: number;
  weeklyGmv?: number;
  currentLoad?: number;
  alertLevel?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
};

export type DashboardMapRoute = {
  from: string;
  to: string;
  orderCount?: number;
  gmv?: number;
  avgPrice?: number;
  activeFlights?: number;
  routeLevel?: 'MAIN' | 'REGIONAL' | 'LOCAL';
};

export type DashboardMap = {
  points: DashboardMapPoint[];
  routes: DashboardMapRoute[];
};

const toNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export type RouteDictItem = {
  routeId: number;
  departureCity: string;
  departureAirport: string;
  arrivalCity: string;
  arrivalAirport: string;
  estimatedDuration?: number | null;
  distanceKm?: number | null;
  updateTime?: string | null;
  orderCount?: number;
  gmv?: number;
  onTimeRate?: number;
  avgPrice?: number;
  activeFlights?: number;
  routeLevel?: 'MAIN' | 'REGIONAL' | 'LOCAL';
};

export type CityDictItem = {
  cityName: string;
  mainAirport: string;
  dailyDepartures: number;
  weeklyGmv: number;
  currentLoad: number;
  alertLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
};

export function buildDashboardMap(
  routes: RouteDictItem[],
  cities: CityDictItem[],
  airportCoords: Record<string, { lat: number; lng: number }>,
  maxRoutes = 10,
): DashboardMap {
  const pointsMap = new Map<string, DashboardMapPoint>();
  const routesResult: DashboardMapRoute[] = [];

  // Promote hubs based on route volume, not only daily departures.
  // Example: a route with 40+ orders should make its endpoints look like hubs.
  const ROUTE_HUB_THRESHOLD = 30;
  const airportTraffic = new Map<string, number>();
  const addTraffic = (airport: string, delta: number) => {
    if (!airport) return;
    const v = airportTraffic.get(airport) ?? 0;
    airportTraffic.set(airport, v + delta);
  };

  const cityMap = new Map<string, CityDictItem>();
  cities.forEach(city => cityMap.set(city.cityName, city));

  const selectedRoutes = routes.slice(0, maxRoutes);

  // Pass 1: compute traffic for all airports in selected routes.
  selectedRoutes.forEach((route) => {
    const { departureAirport, arrivalAirport, orderCount, activeFlights } = route;
    const routeWeight = Math.max(0, toNumber(orderCount) || 0, toNumber(activeFlights) || 0, 1);
    addTraffic(departureAirport, routeWeight);
    addTraffic(arrivalAirport, routeWeight);
  });

  const upsertPoint = (airportCode: string, cityName: string, cityInfo?: CityDictItem) => {
    const coords = airportCoords[airportCode] ?? { lat: 0, lng: 0 };

    const traffic = airportTraffic.get(airportCode) ?? 0;
    const isHubByTraffic = traffic >= ROUTE_HUB_THRESHOLD;
    const isHubByDepartures = !!(cityInfo?.dailyDepartures && cityInfo.dailyDepartures >= 20);
    const isHubByAlert = cityInfo?.alertLevel === 'HIGH' || cityInfo?.alertLevel === 'CRITICAL';
    const isHub = isHubByDepartures || isHubByTraffic || isHubByAlert;

    const existing = pointsMap.get(airportCode);
    const nextType: DashboardMapPointType = isHub ? 'hub' : (existing?.type ?? 'normal');

    // Allow upgrading normal -> hub when later evidence arrives (traffic/alert).
    const finalType: DashboardMapPointType = existing?.type === 'hub' ? 'hub' : nextType;

    pointsMap.set(airportCode, {
      id: airportCode,
      name: cityName,
      lat: coords.lat,
      lng: coords.lng,
      value: cityInfo?.dailyDepartures ?? existing?.value ?? 50,
      type: finalType,
      info: cityInfo
        ? `${cityInfo.dailyDepartures} 航班/天 · ¥${toNumber(cityInfo.weeklyGmv).toLocaleString()} · ${cityInfo.alertLevel}`
        : (existing?.info ?? 'Status: OK'),
      dailyDepartures: cityInfo?.dailyDepartures ?? existing?.dailyDepartures,
      weeklyGmv: cityInfo?.weeklyGmv ?? existing?.weeklyGmv,
      currentLoad: cityInfo?.currentLoad ?? existing?.currentLoad,
      alertLevel: cityInfo?.alertLevel ?? existing?.alertLevel,
    });
  };

  // Pass 2: build points and routes using final traffic values.
  selectedRoutes.forEach((route) => {
    const { departureAirport, departureCity, arrivalAirport, arrivalCity, orderCount, gmv, avgPrice, activeFlights, routeLevel } = route;

    upsertPoint(departureAirport, departureCity, cityMap.get(departureCity));
    upsertPoint(arrivalAirport, arrivalCity, cityMap.get(arrivalCity));

    routesResult.push({
      from: departureAirport,
      to: arrivalAirport,
      orderCount,
      gmv,
      avgPrice,
      activeFlights,
      routeLevel,
    });
  });

  if (pointsMap.size === 0) {
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
    routes: routesResult,
  };
}
