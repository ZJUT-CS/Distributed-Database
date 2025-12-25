package com.team.skylink.module.flight.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class RouteDictResponse {
    /**
     * 路由字典版本号（用于客户端缓存/比对）。
     * 优先取全表最大 updateTime，否则回退到最大 routeId。
     */
    private String version;

    /**
     * 字典条目（裁剪字段，避免下发敏感/无用数据）。
     */
    private List<RouteItem> routes;

    @Data
    public static class RouteItem {
        private Long routeId;
        private String departureCity;
        private String departureAirport;
        private String arrivalCity;
        private String arrivalAirport;
        private Integer estimatedDuration;
        private Integer distanceKm;
        private LocalDateTime updateTime;

        private Long orderCount;
        private BigDecimal gmv;
        private BigDecimal onTimeRate;
        private BigDecimal avgPrice;
        private Integer activeFlights;
        private String routeLevel;
    }
}
