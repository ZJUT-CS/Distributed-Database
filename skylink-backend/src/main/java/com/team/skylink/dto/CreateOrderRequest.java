package com.team.skylink.dto;

import lombok.Data;

@Data
public class CreateOrderRequest {
    private Long userId;
    private String flightNo;
    private String cabinType;
    private Integer ticketNum;
}

