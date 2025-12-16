package com.team.skylink.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class OrderSearchResponse {
    private Long orderNo;
    private String flightNo;
    private String passengerName;
    private Integer orderStatus;
    private BigDecimal totalAmount;
    private LocalDateTime orderTime;
    private LocalDateTime payTime;
    private LocalDateTime refundTime;
    private LocalDateTime changeTime;
}

