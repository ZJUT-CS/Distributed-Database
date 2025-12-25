package com.team.skylink.module.flight.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CityDictResponse {
    private String version;
    private List<CityItem> cities;

    @Data
    public static class CityItem {
        private String cityName;
        private String mainAirport;
        private Integer dailyDepartures;
        private BigDecimal weeklyGmv;
        private BigDecimal currentLoad;
        private String alertLevel;
    }
}
