import { request } from './api';

export interface AdminDashboardMetrics {
  flightCount: number;
  orderCount: number;
  paymentCount: number;
  changeRequestCount: number;
  adminCount: number;
  configCount: number;
  operationLogCount: number;
  userBehaviorStatCount: number;
}

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  return request<AdminDashboardMetrics>({
    method: 'GET',
    url: '/api/v1/admin/dashboard/metrics',
  });
}
