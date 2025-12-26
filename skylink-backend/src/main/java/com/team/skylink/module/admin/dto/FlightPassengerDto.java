package com.team.skylink.module.admin.dto;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class FlightPassengerDto {
    @JsonSerialize(using = ToStringSerializer.class)
    private Long orderId;

    @JsonSerialize(using = ToStringSerializer.class)
    private Long orderNo;

    @JsonSerialize(using = ToStringSerializer.class)
    private Long flightId;

    private String flightNo;

    private String departureCity;

    private String departureAirport;

    private String arrivalCity;

    private String arrivalAirport;

    private LocalDateTime departureTime;

    private LocalDateTime arrivalTime;

    @JsonSerialize(using = ToStringSerializer.class)
    private Long userId;

    private String userRealName;

    private String userPhone;

    private String userEmail;

    private String passengerName;

    private String contactEmail;

    private String contactPhone;

    @JsonSerialize(using = ToStringSerializer.class)
    private Long seatId;

    private BigDecimal totalAmount;

    private Integer orderStatus;

    private LocalDateTime createTime;
}
