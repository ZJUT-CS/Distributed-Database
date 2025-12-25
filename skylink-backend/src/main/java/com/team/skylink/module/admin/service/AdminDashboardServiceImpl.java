package com.team.skylink.module.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.common.Result;
import com.team.skylink.module.admin.dto.AdminDashboardMetricsResponse;
import com.team.skylink.module.admin.mapper.AdminMapper;
import com.team.skylink.module.user.mapper.UserMapper;
import com.team.skylink.module.flight.entity.Flight;
import com.team.skylink.module.flight.mapper.FlightMapper;
import com.team.skylink.module.flight.entity.Route;
import com.team.skylink.module.flight.mapper.RouteMapper;
import com.team.skylink.module.order.entity.Orders;
import com.team.skylink.module.order.mapper.OrderMapper;
import com.team.skylink.module.payment.entity.Payment;
import com.team.skylink.module.payment.mapper.PaymentMapper;
import com.team.skylink.module.refund.entity.RefundChangeRecord;
import com.team.skylink.module.refund.mapper.RefundChangeRecordMapper;
import com.team.skylink.module.system.mapper.ConfigMapper;
import com.team.skylink.module.system.mapper.OperationLogMapper;
import com.team.skylink.module.system.mapper.UserBehaviorStatMapper;
import com.team.skylink.module.user.entity.User;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

@Service
public class AdminDashboardServiceImpl implements AdminDashboardService {
    private final FlightMapper flightMapper;
    private final OrderMapper orderMapper;
    private final PaymentMapper paymentMapper;
    private final RefundChangeRecordMapper refundChangeRecordMapper;
    private final UserMapper userMapper;
    private final AdminMapper adminMapper;
    private final ConfigMapper configMapper;
    private final OperationLogMapper operationLogMapper;
    private final UserBehaviorStatMapper userBehaviorStatMapper;
    private final RouteMapper routeMapper;

    public AdminDashboardServiceImpl(
            FlightMapper flightMapper,
            OrderMapper orderMapper,
            PaymentMapper paymentMapper,
            RefundChangeRecordMapper refundChangeRecordMapper,
            UserMapper userMapper,
            AdminMapper adminMapper,
            ConfigMapper configMapper,
            OperationLogMapper operationLogMapper,
            UserBehaviorStatMapper userBehaviorStatMapper,
            RouteMapper routeMapper
    ) {
        this.flightMapper = flightMapper;
        this.orderMapper = orderMapper;
        this.paymentMapper = paymentMapper;
        this.refundChangeRecordMapper = refundChangeRecordMapper;
        this.userMapper = userMapper;
        this.adminMapper = adminMapper;
        this.configMapper = configMapper;
        this.operationLogMapper = operationLogMapper;
        this.userBehaviorStatMapper = userBehaviorStatMapper;
        this.routeMapper = routeMapper;
    }

    @Override
    public Result<AdminDashboardMetricsResponse> metrics() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime tomorrowStart = today.plusDays(1).atStartOfDay();
        LocalDate start7 = today.minusDays(6);
        LocalDateTime start7Time = start7.atStartOfDay();

        AdminDashboardMetricsResponse r = new AdminDashboardMetricsResponse();
        r.setFlightCount(flightMapper.selectCount(null));
        r.setOrderCount(orderMapper.selectCount(null));
        r.setPaymentCount(paymentMapper.selectCount(null));
        r.setChangeRequestCount(refundChangeRecordMapper.selectCount(null));
        r.setAdminCount(adminMapper.selectCount(null));
        r.setConfigCount(configMapper.selectCount(null));
        r.setOperationLogCount(operationLogMapper.selectCount(null));
        r.setUserBehaviorStatCount(userBehaviorStatMapper.selectCount(null));

        r.setUserCount(userMapper.selectCount(null));

        r.setTodayOrderCount(orderMapper.selectCount(
                new QueryWrapper<Orders>().ge("order_time", todayStart).lt("order_time", tomorrowStart)
        ));
        r.setTodayGmv(sumPaymentAmount(
                new QueryWrapper<Payment>()
                        .eq("payment_status", 1)
                        .ge("payment_time", todayStart)
                        .lt("payment_time", tomorrowStart)
        ));
        r.setTotalGmv(sumPaymentAmount(new QueryWrapper<Payment>().eq("payment_status", 1)));

        r.setTodayNewUsers(userMapper.selectCount(
                new QueryWrapper<User>().ge("create_time", todayStart).lt("create_time", tomorrowStart)
        ));

        r.setUpcomingFlights(flightMapper.selectCount(
                new QueryWrapper<Flight>()
                        .in("status", List.of(1, 3))
                        .ge("departure_time", now)
                        .lt("departure_time", now.plusHours(24))
        ));
        r.setPendingRefundAudits(refundChangeRecordMapper.selectCount(
                new QueryWrapper<RefundChangeRecord>().eq("audit_status", 0)
        ));

        r.setFlightStatusNormalCount(flightMapper.selectCount(new QueryWrapper<Flight>().eq("status", 1)));
        r.setFlightStatusCancelledCount(flightMapper.selectCount(new QueryWrapper<Flight>().eq("status", 2)));
        r.setFlightStatusDelayedCount(flightMapper.selectCount(new QueryWrapper<Flight>().eq("status", 3)));
        r.setFlightStatusDivertedCount(flightMapper.selectCount(new QueryWrapper<Flight>().eq("status", 4)));

        // 趋势：最近7日 GMV
        QueryWrapper<Payment> gmvQ = new QueryWrapper<>();
        gmvQ.eq("payment_status", 1)
                .ge("payment_time", start7Time)
                .lt("payment_time", tomorrowStart)
                .select("DATE(payment_time) AS d", "COALESCE(SUM(payment_amount),0) AS amt")
                .groupBy("DATE(payment_time)")
                .orderByAsc("d");
        List<Map<String, Object>> gmvRows = paymentMapper.selectMaps(gmvQ);
        Map<String, BigDecimal> gmvMap = new HashMap<>();
        for (Map<String, Object> row : gmvRows) {
            Object dObj = row.get("d");
            Object aObj = row.get("amt");
            String d = dObj != null ? String.valueOf(dObj) : null;
            BigDecimal a = aObj instanceof BigDecimal ? (BigDecimal) aObj : aObj instanceof Number ? BigDecimal.valueOf(((Number) aObj).doubleValue()) : BigDecimal.ZERO;
            if (d != null) gmvMap.put(d, a);
        }
        List<AdminDashboardMetricsResponse.DailyAmount> gmvTrend = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate d = start7.plusDays(i);
            String key = d.toString();
            AdminDashboardMetricsResponse.DailyAmount item = new AdminDashboardMetricsResponse.DailyAmount();
            item.setDate(key);
            item.setAmount(gmvMap.getOrDefault(key, BigDecimal.ZERO));
            gmvTrend.add(item);
        }
        r.setGmvTrend7d(gmvTrend);

        // 趋势：最近7日订单量（按下单时间）
        QueryWrapper<Orders> ordersTrendQ = new QueryWrapper<>();
        ordersTrendQ.ge("order_time", start7Time)
                .lt("order_time", tomorrowStart)
                .select("DATE(order_time) AS d", "COUNT(1) AS cnt")
                .groupBy("DATE(order_time)")
                .orderByAsc("d");
        List<Map<String, Object>> orderRows = orderMapper.selectMaps(ordersTrendQ);
        Map<String, Long> orderCntMap = new HashMap<>();
        for (Map<String, Object> row : orderRows) {
            Object dObj = row.get("d");
            Object cObj = row.get("cnt");
            String d = dObj != null ? String.valueOf(dObj) : null;
            long c = cObj instanceof Number ? ((Number) cObj).longValue() : 0L;
            if (d != null) orderCntMap.put(d, c);
        }
        List<AdminDashboardMetricsResponse.DailyCount> ordersTrend = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate d = start7.plusDays(i);
            String key = d.toString();
            AdminDashboardMetricsResponse.DailyCount item = new AdminDashboardMetricsResponse.DailyCount();
            item.setDate(key);
            item.setCount(orderCntMap.getOrDefault(key, 0L));
            ordersTrend.add(item);
        }
        r.setOrdersTrend7d(ordersTrend);

        // 热门航线 Top10（近7日，按订单支付金额累计排序）
        List<Orders> paidOrders7d = orderMapper.selectList(
                new QueryWrapper<Orders>()
                        .eq("order_status", 2)
                        .ge("pay_time", start7Time)
                        .lt("pay_time", tomorrowStart)
                        .select("order_id", "flight_id", "total_amount")
        );
        if (paidOrders7d == null) paidOrders7d = Collections.emptyList();
        Map<Long, BigDecimal> routeGmv = new HashMap<>();
        Map<Long, Long> routeOrders = new HashMap<>();
        Map<Long, Long> flightToRoute = new HashMap<>();
        List<Long> flightIds = paidOrders7d.stream().map(Orders::getFlightId).filter(f -> f != null).distinct().toList();
        if (!flightIds.isEmpty()) {
            List<Flight> flights = flightMapper.selectBatchIds(flightIds);
            for (Flight f : flights) {
                flightToRoute.put(f.getFlightId(), f.getRouteId());
            }
        }
        for (Orders o : paidOrders7d) {
            Long fid = o.getFlightId();
            if (fid == null) continue;
            Long rid = flightToRoute.get(fid);
            if (rid == null) continue;
            BigDecimal amt = o.getTotalAmount() == null ? BigDecimal.ZERO : o.getTotalAmount();
            routeGmv.put(rid, routeGmv.getOrDefault(rid, BigDecimal.ZERO).add(amt));
            routeOrders.put(rid, routeOrders.getOrDefault(rid, 0L) + 1);
        }
        List<Long> routeIds = new ArrayList<>(routeGmv.keySet());
        Map<Long, Route> routeMap = new HashMap<>();
        if (!routeIds.isEmpty()) {
            List<Route> routes = routeMapper.selectBatchIds(routeIds);
            for (Route route : routes) {
                routeMap.put(route.getRouteId(), route);
            }
        }
        List<AdminDashboardMetricsResponse.RouteTopItem> topRoutes = new ArrayList<>();
        for (Long rid : routeIds) {
            Route route = routeMap.get(rid);
            if (route == null) continue;
            AdminDashboardMetricsResponse.RouteTopItem item = new AdminDashboardMetricsResponse.RouteTopItem();
            item.setRouteId(rid);
            item.setDepartureCity(route.getDepartureCity());
            item.setArrivalCity(route.getArrivalCity());
            item.setDepartureAirport(route.getDepartureAirport());
            item.setArrivalAirport(route.getArrivalAirport());
            item.setGmv(routeGmv.getOrDefault(rid, BigDecimal.ZERO));
            item.setOrders(routeOrders.getOrDefault(rid, 0L));
            topRoutes.add(item);
        }
        topRoutes.sort(Comparator.comparing(AdminDashboardMetricsResponse.RouteTopItem::getGmv).reversed());
        if (topRoutes.size() > 10) {
            topRoutes = new ArrayList<>(topRoutes.subList(0, 10));
        }
        r.setTopRoutes7d(topRoutes);

        return Result.ok(r);
    }

    private BigDecimal sumPaymentAmount(QueryWrapper<Payment> qw) {
        QueryWrapper<Payment> q = qw == null ? new QueryWrapper<>() : qw;
        q.select("COALESCE(SUM(payment_amount), 0)");
        List<Object> objs = paymentMapper.selectObjs(q);
        if (objs == null || objs.isEmpty()) return BigDecimal.ZERO;
        Object v = objs.get(0);
        if (v == null) return BigDecimal.ZERO;
        if (v instanceof BigDecimal bd) return bd;
        if (v instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        if (v instanceof String s) {
            try {
                return new BigDecimal(s);
            } catch (NumberFormatException e) {
                return BigDecimal.ZERO;
            }
        }
        return BigDecimal.ZERO;
    }
}

