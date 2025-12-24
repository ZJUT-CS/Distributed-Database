package com.team.skylink.module.flight.controller;

import com.team.skylink.common.PageResult;
import com.team.skylink.common.Result;
import com.team.skylink.module.flight.dto.FlightSearchResponse;
import com.team.skylink.module.flight.dto.FlightSearchResult;
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
import org.springframework.web.bind.annotation.PathVariable;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.team.skylink.module.flight.entity.Seat;
import com.team.skylink.module.flight.entity.Flight;
import com.team.skylink.module.flight.entity.Route;
import com.team.skylink.module.flight.mapper.SeatMapper;
import com.team.skylink.module.flight.mapper.FlightMapper;
import com.team.skylink.module.flight.mapper.RouteMapper;
import com.team.skylink.module.aircraft.mapper.AircraftCabinConfigMapper;
import com.team.skylink.module.aircraft.entity.AircraftCabinConfig;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;

@RestController
@RequestMapping("/api/v1/flights")
public class FlightController {
    private final FlightService flightService;
    private final SeatMapper seatMapper;
    private final FlightMapper flightMapper;
    private final RouteMapper routeMapper;
    private final AircraftCabinConfigMapper configMapper;

    public FlightController(FlightService flightService, SeatMapper seatMapper, FlightMapper flightMapper, RouteMapper routeMapper, AircraftCabinConfigMapper configMapper) {
        this.flightService = flightService;
        this.seatMapper = seatMapper;
        this.flightMapper = flightMapper;
        this.routeMapper = routeMapper;
        this.configMapper = configMapper;
    }

    @GetMapping("")
    @Cacheable(
        cacheNames = "flightSearch",
        key = "T(java.util.Objects).hash(#departurePlace, #destination, #flightNo, #airlineCompany, #cabinType, #status, #departureDate, #departureTimeFrom, #departureTimeTo, #page, #size)"
    )
    public Result<FlightSearchResult> search(
            @RequestParam(required = false) String departurePlace,
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) String flightNo,
            @RequestParam(required = false) String airlineCompany,
            @RequestParam(required = false) String cabinType,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate departureDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime departureTimeFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime departureTimeTo,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size
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
                departureTimeTo,
                page,
                size
        );
    }

    @PostMapping("")
    public Result<Boolean> createFlight(@Valid @RequestBody FlightCreateRequest req) {
        return flightService.createFlight(req);
    }

    @GetMapping("/{flightId}/seats")
    public Result<List<Map<String, Object>>> listSeats(@PathVariable Long flightId) {
        Flight flight = flightMapper.selectById(flightId);
        if (flight == null) {
            return Result.fail(404, "航班不存在");
        }
        Route route = routeMapper.selectById(flight.getRouteId());
        BigDecimal base = route != null ? route.getBasePrice() : null;
        var seats = seatMapper.selectList(Wrappers.<Seat>lambdaQuery().eq(Seat::getFlightId, flightId));
        List<Map<String, Object>> data = new ArrayList<>();
        for (Seat s : seats) {
            AircraftCabinConfig cfg = configMapper.selectOne(new QueryWrapper<AircraftCabinConfig>()
                    .eq("model_id", flight.getModelId())
                    .eq("cabin_type", s.getCabinType())
                    .last("LIMIT 1"));
            BigDecimal price = null;
            if (base != null && cfg != null && cfg.getCabinCoefficient() != null) {
                price = base.multiply(cfg.getCabinCoefficient());
            }
            String status;
            if (s.getStatus() != null && s.getStatus() == 1) status = "AVAILABLE";
            else if (s.getStatus() != null && s.getStatus() == 2) status = "OCCUPIED";
            else if (s.getStatus() != null && s.getStatus() == 3) status = "RESERVED";
            else status = "MAINTENANCE";
            Map<String, Object> it = new HashMap<>();
            it.put("seatId", s.getSeatId());
            it.put("seatNumber", s.getSeatNumber());
            it.put("status", status);
            it.put("classType", s.getCabinType());
            it.put("price", price);
            data.add(it);
        }
        return Result.ok(data);
    }
    
}
