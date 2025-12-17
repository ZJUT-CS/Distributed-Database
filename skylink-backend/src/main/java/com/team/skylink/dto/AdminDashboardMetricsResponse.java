package com.team.skylink.dto;

import lombok.Data;

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
}
