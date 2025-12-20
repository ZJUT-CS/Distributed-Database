package com.team.skylink.module.flight.dto;

import lombok.Data;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

@Data
public class CabinCreateRequest {
    @NotBlank(message = "flightNo is required")
    private String flightNo;

    @NotBlank(message = "cabinType is required")
    private String cabinType;

    @NotNull(message = "price is required")
    @Positive(message = "price must be > 0")
    private BigDecimal price;

    @NotNull(message = "remainingSeats is required")
    @Min(value = 0, message = "remainingSeats must be >= 0")
    private Integer remainingSeats;
}

