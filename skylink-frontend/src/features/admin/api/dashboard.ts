import { request } from '../../../lib/axios';

export interface DailyAmount {
  date: string;
  amount: number;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface RouteTopItem {
  routeId: number;
  departureCity: string;
  arrivalCity: string;
  departureAirport: string;
  arrivalAirport: string;
  gmv: number;
  orders: number;
}

export interface RouteDictItem {
  routeId: number;
  departureCity: string;
  departureAirport: string;
  arrivalCity: string;
  arrivalAirport: string;
  estimatedDuration: number;
  distanceKm: number;
  updateTime: string;
  orderCount?: number;
  gmv?: number;
  onTimeRate?: number;
  avgPrice?: number;
  activeFlights?: number;
  routeLevel?: 'MAIN' | 'REGIONAL' | 'LOCAL';
}

export interface CityDictItem {
  cityName: string;
  mainAirport: string;
  dailyDepartures: number;
  weeklyGmv: number;
  currentLoad: number;
  alertLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
}

export interface AdminDashboardMetrics {
  flightCount: number;
  orderCount: number;
  paymentCount: number;
  changeRequestCount: number;
  adminCount: number;
  configCount: number;
  operationLogCount: number;
  userBehaviorStatCount: number;
  userCount: number;
  todayOrderCount: number;
  todayGmv: number;
  totalGmv: number;
  todayNewUsers: number;
  upcomingFlights: number;
  pendingRefundAudits: number;
  flightStatusNormalCount: number;
  flightStatusCancelledCount: number;
  flightStatusDelayedCount: number;
  flightStatusDivertedCount: number;
  gmvTrend7d?: DailyAmount[];
  ordersTrend7d?: DailyCount[];
  topRoutes7d?: RouteTopItem[];
}

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  return request<AdminDashboardMetrics>({
    method: 'GET',
    url: '/api/v1/admins/dashboards/metrics',
  });
}

export interface RouteDictResponse {
  version: string;
  routes: RouteDictItem[];
}

export async function getRouteDict(): Promise<RouteDictResponse> {
  return request<RouteDictResponse>({
    method: 'GET',
    url: '/api/v1/routes/dict',
  });
}

export interface CityDictResponse {
  version: string;
  cities: CityDictItem[];
}

export async function getCityDict(): Promise<CityDictResponse> {
  return request<CityDictResponse>({
    method: 'GET',
    url: '/api/v1/routes/cities/dict',
  });
}

