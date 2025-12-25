package com.team.skylink.module.admin.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class AdminDashboardMetricsResponse {
    private long flightCount;
    private long orderCount;
    private long paymentCount;
    private long changeRequestCount;
    private long adminCount;
    private long configCount;
    private long operationLogCount;
    private long userBehaviorStatCount;

    private long userCount;

    private long todayOrderCount;
    private BigDecimal todayGmv;
    private BigDecimal totalGmv;
    private long todayNewUsers;

    private long upcomingFlights;
    private long pendingRefundAudits;

    private long flightStatusNormalCount;
    private long flightStatusCancelledCount;
    private long flightStatusDelayedCount;
    private long flightStatusDivertedCount;

    private List<DailyAmount> gmvTrend7d;
    private List<DailyCount> ordersTrend7d;
    private List<RouteTopItem> topRoutes7d;

    @Data
    public static class DailyAmount {
        private String date;
        private BigDecimal amount;
    }

    @Data
    public static class DailyCount {
        private String date;
        private long count;
    }

    @Data
    public static class RouteTopItem {
        private Long routeId;
        private String departureCity;
        private String arrivalCity;
        private String departureAirport;
        private String arrivalAirport;
        private BigDecimal gmv;
        private long orders;
    }
}
