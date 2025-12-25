package com.team.skylink.module.admin.dto;

import lombok.Data;

@Data
public class FlightPassengerQuery {
    private String flightNo;
    private String passengerName;
    private String contactPhone;
    private Integer page = 1;
    private Integer size = 20;
}
