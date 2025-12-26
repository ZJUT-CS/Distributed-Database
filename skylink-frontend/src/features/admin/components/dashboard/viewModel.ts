export interface DashboardTrendCountItem {
  date: string;
  count: number;
}

export interface DashboardTrendAmountItem {
  date: string;
  amount: number;
}

export interface DashboardRouteItem {
  routeId: string;
  departureCity: string;
  departureAirport: string;
  arrivalCity: string;
  arrivalAirport: string;
  orders: number;
  gmv: number;
}

export interface DashboardViewModel {
  gmvTrend: DashboardTrendAmountItem[];
  ordersTrend: DashboardTrendCountItem[];
  topRoutes7d: DashboardRouteItem[];
  routes: {
    map: {
      points: any[];
      routes: any[];
    };
  };
  flightStatusSummary: {
    scheduled: number;
    departed: number;
    arrived: number;
    cancelled: number;
  };
  systemOpsSummary: {
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
    activeUsers: number;
  };
}
