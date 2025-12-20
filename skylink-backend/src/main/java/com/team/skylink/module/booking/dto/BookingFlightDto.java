package com.team.skylink.module.booking.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BookingFlightDto {
    private String id;
    private String airline;
    private String airlineCode;
    private String flightNumber;
    private String cabinType;
    private String origin;
    private String destination;
    private LocalDateTime departureTime;
    private LocalDateTime arrivalTime;
    private java.math.BigDecimal price;
    private Integer remainingSeats;
    private String duration;

    private Integer stops;
    private Integer baggageWeight;

    private Amenities amenities;

    @Data
    public static class Amenities {
        private boolean hasPower;
        private boolean hasMeal;
        private boolean hasWifi;
        private boolean hasEntertainment;
    }
}
