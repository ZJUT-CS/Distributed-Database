package com.team.skylink.module.flight.controller;

import com.team.skylink.common.Result;
import com.team.skylink.module.flight.dto.FlightSearchResponse;
import com.team.skylink.module.flight.service.FlightService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.team.skylink.module.flight.dto.FlightCreateRequest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.cache.annotation.Cacheable;

@RestController
@RequestMapping("/api/v1/flights")
public class FlightController {
    private final FlightService flightService;

    public FlightController(FlightService flightService) {
        this.flightService = flightService;
    }

    @GetMapping("")
    @Cacheable(
        cacheNames = "flightSearch",
        key = "T(java.util.Objects).hash(#departurePlace, #destination, #flightNo, #airlineCompany, #cabinType, #status, #departureDate, #departureTimeFrom, #departureTimeTo)"
    )
    public Result<List<FlightSearchResponse>> search(
            @RequestParam(required = false) String departurePlace,
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) String flightNo,
            @RequestParam(required = false) String airlineCompany,
            @RequestParam(required = false) String cabinType,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate departureDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime departureTimeFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime departureTimeTo
    ) {
        return flightService.search(
                departurePlace,
                destination,
                flightNo,
                airlineCompany,
                cabinType,
                status,
                departureDate,
                departureTimeFrom,
                departureTimeTo
        );
    }

    @PostMapping("")
    public Result<Boolean> createFlight(@Valid @RequestBody FlightCreateRequest req) {
        return flightService.createFlight(req);
    }

    
}
