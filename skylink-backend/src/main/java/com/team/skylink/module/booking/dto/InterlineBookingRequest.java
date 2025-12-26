package com.team.skylink.module.booking.dto;

import lombok.Data;
import java.util.List;

@Data
public class InterlineBookingRequest {
    private Long userId;
    private List<InterlineSegmentRequest> segments;
    private List<Long> passengerIds;
    private String contactName;
    private String contactPhone;
    private String contactEmail;
}
