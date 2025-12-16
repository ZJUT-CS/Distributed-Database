package com.team.skylink.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CabinCreateRequest {
    private String flightNo;
    private String cabinType;
    private BigDecimal price;
    private Integer remainingSeats;
}

