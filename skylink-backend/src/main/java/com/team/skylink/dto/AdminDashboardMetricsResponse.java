package com.team.skylink.dto;

import lombok.Data;

import java.math.BigDecimal;

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
}
