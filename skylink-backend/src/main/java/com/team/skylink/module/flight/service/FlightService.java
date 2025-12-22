package com.team.skylink.module.flight.service;

import com.team.skylink.common.PageResult;
import com.team.skylink.common.Result;
import com.team.skylink.module.flight.dto.FlightCreateRequest;
import com.team.skylink.module.flight.dto.FlightSearchResponse;
import com.team.skylink.module.flight.dto.FlightSearchResult;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface FlightService {
    Result<FlightSearchResult> search(
            String departurePlace,
            String destination,
            String flightNo,
            String airlineCompany,
            String cabinType,
            Integer status,
            LocalDate departureDate,
            LocalDateTime departureTimeFrom,
            LocalDateTime departureTimeTo,
            int page,
            int size
    );

    Result<Boolean> createFlight(FlightCreateRequest req);

    Result<Boolean> updateFlight(Long flightId, FlightCreateRequest req);

    Result<Boolean> deleteFlight(Long flightId);
}

