package com.team.skylink.dto;

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
}

