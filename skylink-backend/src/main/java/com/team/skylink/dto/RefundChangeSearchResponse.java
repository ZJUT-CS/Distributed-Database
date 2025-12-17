package com.team.skylink.dto;

import lombok.Data;

@Data
public class RefundChangeSearchResponse {
    private String id;
    private String orderId;
    private String passenger;
    private String type;
    private String oldFlight;
    private String newFlight;
    private String applyTime;
    private String status;
    private String remark;
}
