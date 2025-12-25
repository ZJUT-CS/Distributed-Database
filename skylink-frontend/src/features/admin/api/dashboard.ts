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
  // 趋势数据
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

