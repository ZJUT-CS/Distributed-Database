package com.team.skylink.module.flight.dto;

import lombok.Data;

import java.time.Duration;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
public class FlightSearchResponse {
    private String flightNo;
    private String departurePlace;
    private String destination;
    private LocalDateTime departureTime;
    private LocalDateTime arrivalTime;
    private String duration;
    private BigDecimal price;
    private Integer remainingSeats;
    private String airlineCompany;
    private String cabinType;

    // ✅ 新增：机型名称（如 Boeing 737-800）
    private String aircraftModel;

    // ✅ 新增：托运行李额度（如 "23kg"）
    private String baggageAllowance;

    // ✅ 新增：服务项目（如 "餐食,娱乐系统"）
    private String services;
}
