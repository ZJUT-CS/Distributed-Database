package com.team.skylink.module.booking.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class BookingResponse {
    private String id;
    private String passengerName;
    private String passportNumber;
    private String contactEmail;
    private String phone;

    private String cabinClass;
    private java.math.BigDecimal totalPrice;

    private String status;
    private LocalDateTime bookingDate;

    private BookingFlightDto flight;
    private List<BookingFlightDto> flights;
}
