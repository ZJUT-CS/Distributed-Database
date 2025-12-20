package com.team.skylink.module.flight.dto;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;
import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

@Data
public class FlightCreateRequest {
    @NotBlank(message = "flightNo is required")
    private String flightNo;

    @NotBlank(message = "departurePlace is required")
    private String departurePlace;

    @NotBlank(message = "destination is required")
    private String destination;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @NotNull(message = "departureTime is required")
    private LocalDateTime departureTime;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @NotNull(message = "arrivalTime is required")
    private LocalDateTime arrivalTime;

    @NotBlank(message = "airlineCompany is required")
    private String airlineCompany;

    @NotNull(message = "totalSeats is required")
    @Min(value = 1, message = "totalSeats must be >= 1")
    private Integer totalSeats;

    @NotNull(message = "status is required")
    private Integer status;
}
