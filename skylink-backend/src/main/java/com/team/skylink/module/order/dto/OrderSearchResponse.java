package com.team.skylink.module.order.dto;

import lombok.Data;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class OrderSearchResponse {
    private String orderNo;

    @JsonSerialize(using = ToStringSerializer.class)
    private Long parentOrderId;

    @JsonSerialize(using = ToStringSerializer.class)
    private Long flightId;

    @JsonSerialize(using = ToStringSerializer.class)
    private Long seatId;

    private String flightNo;
    private String passengerName;
    private String contactEmail;
    private String contactPhone;
    private String passengersJson;
    private Integer orderStatus;
    private BigDecimal totalAmount;
    private LocalDateTime orderTime;
    private LocalDateTime payTime;
    private LocalDateTime refundTime;
    private LocalDateTime changeTime;

    private String origin;
    private String destination;
    private LocalDateTime departureTime;
    private LocalDateTime arrivalTime;
}

