package com.team.skylink.module.flight.service;

import com.team.skylink.common.Result;
import com.team.skylink.module.flight.dto.CabinCreateRequest;
import com.team.skylink.module.flight.dto.FlightCreateRequest;
import com.team.skylink.module.flight.dto.FlightSearchResponse;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface FlightService {
    Result<List<FlightSearchResponse>> search(
            String departurePlace,
            String destination,
            String flightNo,
            String airlineCompany,
            String cabinType,
            Integer status,
            LocalDate departureDate,
            LocalDateTime departureTimeFrom,
            LocalDateTime departureTimeTo
    );

    Result<Boolean> createFlight(FlightCreateRequest req);

    Result<Boolean> createCabin(CabinCreateRequest req);
}

