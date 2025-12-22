import { request } from '../../../lib/axios';

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
}

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  return request<AdminDashboardMetrics>({
    method: 'GET',
    url: '/api/v1/admins/dashboard/metrics',
  });
}

