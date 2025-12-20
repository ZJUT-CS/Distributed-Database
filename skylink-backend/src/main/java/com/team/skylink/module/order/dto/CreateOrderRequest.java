package com.team.skylink.module.order.dto;

import lombok.Data;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class CreateOrderRequest {
    @NotNull(message = "userId is required")
    private Long userId;

    @NotBlank(message = "flightNo is required")
    private String flightNo;

    @NotBlank(message = "cabinType is required")
    private String cabinType;

    @NotNull(message = "ticketNum is required")
    @Min(value = 1, message = "ticketNum must be >= 1")
    private Integer ticketNum;

    @NotBlank(message = "passengerName is required")
    private String passengerName;

    private String contactEmail;
    private String contactPhone;
    private String passengersJson;
}

