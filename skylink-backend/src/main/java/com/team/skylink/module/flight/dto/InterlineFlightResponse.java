package com.team.skylink.module.flight.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class InterlineFlightResponse {
    private List<FlightSearchResponse> segments;
    private BigDecimal totalPrice;
    private String transferCity;
    private String transferDuration;

    // ✅ 新增：总行程时长（用于列表显示）
    private String totalDuration;

    // ✅ 新增：该联程方案的最小剩余座位数（短板效应）
    private Integer remainingSeats;
}
