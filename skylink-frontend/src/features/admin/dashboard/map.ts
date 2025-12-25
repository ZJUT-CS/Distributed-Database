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

  const cityMap = new Map<string, CityDictItem>();
  cities.forEach(city => cityMap.set(city.cityName, city));

  routes.slice(0, maxRoutes).forEach((route) => {
    const { departureAirport, departureCity, arrivalAirport, arrivalCity, orderCount, gmv, avgPrice, activeFlights, routeLevel } = route;

    const depCoords = airportCoords[departureAirport] ?? { lat: 0, lng: 0 };
    const depCityInfo = cityMap.get(departureCity);
    if (!pointsMap.has(departureAirport)) {
      pointsMap.set(departureAirport, {
        id: departureAirport,
        name: departureCity,
        lat: depCoords.lat,
        lng: depCoords.lng,
        value: depCityInfo?.dailyDepartures ?? 50,
        type: depCityInfo?.dailyDepartures && depCityInfo.dailyDepartures >= 20 ? 'hub' : 'normal',
        info: depCityInfo
          ? `${depCityInfo.dailyDepartures} 航班/天 · ¥${toNumber(depCityInfo.weeklyGmv).toLocaleString()} · ${depCityInfo.alertLevel}`
          : 'Status: OK',
        dailyDepartures: depCityInfo?.dailyDepartures,
        weeklyGmv: depCityInfo?.weeklyGmv,
        currentLoad: depCityInfo?.currentLoad,
        alertLevel: depCityInfo?.alertLevel,
      });
    }

    const arrCoords = airportCoords[arrivalAirport] ?? { lat: 0, lng: 0 };
    const arrCityInfo = cityMap.get(arrivalCity);
    if (!pointsMap.has(arrivalAirport)) {
      pointsMap.set(arrivalAirport, {
        id: arrivalAirport,
        name: arrivalCity,
        lat: arrCoords.lat,
        lng: arrCoords.lng,
        value: arrCityInfo?.dailyDepartures ?? 50,
        type: arrCityInfo?.dailyDepartures && arrCityInfo.dailyDepartures >= 20 ? 'hub' : 'normal',
        info: arrCityInfo
          ? `${arrCityInfo.dailyDepartures} 航班/天 · ¥${toNumber(arrCityInfo.weeklyGmv).toLocaleString()} · ${arrCityInfo.alertLevel}`
          : 'Status: OK',
        dailyDepartures: arrCityInfo?.dailyDepartures,
        weeklyGmv: arrCityInfo?.weeklyGmv,
        currentLoad: arrCityInfo?.currentLoad,
        alertLevel: arrCityInfo?.alertLevel,
      });
    }

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
