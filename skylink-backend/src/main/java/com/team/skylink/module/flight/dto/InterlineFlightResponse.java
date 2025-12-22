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
}
