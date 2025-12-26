
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useAdminDashboardMetrics } from '../hooks/useAdminDashboard';
import { buildAdminDashboardViewModel } from '../dashboard/viewModel';
import { AIRPORT_COORDS } from '../dashboard/airports';
import { useRouteDict } from '../../flight/hooks/useRouteDict';
import { useCityDict } from '../hooks/useCityDict';
import { DashboardErrorBanner } from '../components/dashboard/DashboardErrorBanner';
import { DashboardHeaderSection } from '../components/dashboard/DashboardHeaderSection';
import { OrdersTrendPanel } from '../components/dashboard/OrdersTrendPanel';
import { FlightStatusPanel } from '../components/dashboard/FlightStatusPanel';
import { MapPanel } from '../components/dashboard/MapPanel';
import { GmvTrendPanel } from '../components/dashboard/GmvTrendPanel';
import { SystemOpsPanel } from '../components/dashboard/SystemOpsPanel';
import type { DashboardRouteItem } from '../components/dashboard/viewModel';

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

const Dashboard: React.FC = () => {
  const { data, isLoading, error } = useAdminDashboardMetrics(true);
  const routeDictQuery = useRouteDict(true);
  const cityDictQuery = useCityDict(true);
  const routeDictRoutes = routeDictQuery.data?.routes ?? null;
  const cityDictItems = cityDictQuery.data?.cities ?? null;
  const metrics = data ?? null;
  const loading = isLoading;
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message ?? '')
          : null;

  const vm = useMemo(
    () =>
      buildAdminDashboardViewModel(metrics, {
        airportCoords: AIRPORT_COORDS,
        routeDict: routeDictRoutes,
        routeDictFull: routeDictRoutes,
        cityDict: cityDictItems,
      }),
    [metrics, routeDictRoutes, cityDictItems],
  );

  const todayOrderCount = vm.kpis.todayOrderCount;
  const todayGmv = vm.kpis.todayGmv;
  const totalRev = vm.kpis.totalGmv;

  const totalBookings = vm.kpis.orderCount;
  const todayNewUsers = vm.kpis.todayNewUsers;
  const totalUsers = vm.kpis.userCount;
  const upcomingFlights = vm.kpis.upcomingFlights;
  const pendingRefundAudits = vm.kpis.pendingRefundAudits;

  const paymentCount = vm.kpis.paymentCount;
  const adminCount = vm.kpis.adminCount;
  const changeRequestCount = vm.kpis.changeRequestCount;
  const operationLogCount = vm.kpis.operationLogCount;

  // 使用数字增长动画
  const animatedOrderCount = useCountUp(todayOrderCount, 1200);
  const animatedGmv = useCountUp(todayGmv, 1400);
  const animatedNewUsers = useCountUp(todayNewUsers, 1000);
  const animatedUpcomingFlights = useCountUp(upcomingFlights, 1300);
  const animatedPendingRefunds = useCountUp(pendingRefundAudits, 1100);
  const animatedTotalRev = useCountUp(totalRev, 1500);

  const ordersTrendData = vm.trends.orders7d;
  const gmvTrendData = vm.trends.gmv7d;
  const maxOrders = vm.trends.maxOrders;
  const maxGmv = vm.trends.maxGmv;
  const totalOrders = vm.trends.totalOrders7d;
  const totalGmv7d = vm.trends.totalGmv7d;

  const flightStatusCounts = {
    active: vm.flightStatus.active,
    delayed: vm.flightStatus.delayed,
    cancelled: vm.flightStatus.cancelled,
    full: vm.flightStatus.full,
  };
  const totalFlights = vm.flightStatus.totalFlights;
  const flightPieTotal = vm.flightStatus.pieTotal;

  const mapPointsAndRoutes = vm.routes.map;
  
  const topRoutes7d: DashboardRouteItem[] = vm.routes.topRoutes7d.map(route => ({
    routeId: String(route.routeId),
    departureCity: route.departureCity,
    departureAirport: route.departureAirport,
    arrivalCity: route.arrivalCity,
    arrivalAirport: route.arrivalAirport,
    orders: route.orders,
    gmv: route.gmv,
  }));

  return (
    <div className="space-y-8 animate-fade-in-up">
      <DashboardErrorBanner errorMessage={errorMessage} />
      
      <DashboardHeaderSection
        loading={loading}
        errorMessage={errorMessage}
        todayOrderCount={todayOrderCount}
        todayGmv={todayGmv}
        todayNewUsers={todayNewUsers}
        totalUsers={totalUsers}
        totalBookings={totalBookings}
        totalFlights={totalFlights}
        totalRev={totalRev}
        animatedOrderCount={animatedOrderCount}
        animatedGmv={animatedGmv}
        animatedNewUsers={animatedNewUsers}
        animatedUpcomingFlights={animatedUpcomingFlights}
        animatedPendingRefunds={animatedPendingRefunds}
      />

      {/* 第一行图表：订单趋势 + 航班状态 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[400px] lg:h-[420px]">
        <OrdersTrendPanel loading={loading} ordersTrendData={ordersTrendData} maxOrders={maxOrders} />
        <FlightStatusPanel
          loading={loading}
          totalFlights={totalFlights}
          flightPieTotal={flightPieTotal}
          flightStatusCounts={flightStatusCounts}
        />
      </div>

      {/* 第二行：大地图 + 泡泡信息层 */}
      <MapPanel
        loading={loading}
        totalOrders={totalOrders}
        totalGmv7d={totalGmv7d}
        map={mapPointsAndRoutes}
        topRoutes7d={topRoutes7d}
      />

      {/* 第三行：GMV趋势 + 系统统计 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GmvTrendPanel loading={loading} gmvTrendData={gmvTrendData} maxGmv={maxGmv} animatedTotalRev={animatedTotalRev} />
        <SystemOpsPanel
          totalUsers={totalUsers}
          totalBookings={totalBookings}
          paymentCount={paymentCount}
          changeRequestCount={changeRequestCount}
          adminCount={adminCount}
          operationLogCount={operationLogCount}
        />
      </div>
    </div>
  );
};

export default Dashboard;
