package com.team.skylink.module.booking.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class InterlineSegmentRequest {
    private Long flightId;
    private String cabinType;
    private LocalDate date; // Optional, for validation
}
