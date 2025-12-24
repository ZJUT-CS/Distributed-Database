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
import org.springframework.web.bind.annotation.RequestParam;
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
import com.team.skylink.module.flight.service.SeatService;

@RestController
@RequestMapping("/api/v1/flights")
public class FlightController {
    private final FlightService flightService;
    private final SeatService seatService;
    private final SeatMapper seatMapper;
    private final FlightMapper flightMapper;
    private final RouteMapper routeMapper;
    private final AircraftCabinConfigMapper configMapper;

    public FlightController(FlightService flightService, SeatService seatService, SeatMapper seatMapper, FlightMapper flightMapper,
            RouteMapper routeMapper, AircraftCabinConfigMapper configMapper) {
        this.flightService = flightService;
        this.seatService = seatService;
        this.seatMapper = seatMapper;
        this.flightMapper = flightMapper;
        this.routeMapper = routeMapper;
        this.configMapper = configMapper;
    }

    @GetMapping("")
    @Cacheable(cacheNames = "flightSearch", key = "T(java.util.Objects).hash(#departurePlace, #destination, #flightNo, #airlineCompany, #cabinType, #status, #departureDate, #departureTimeFrom, #departureTimeTo, #page, #size)")
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
            @RequestParam(defaultValue = "20") int size) {
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
                size);
    }

    @PostMapping("")
    public Result<Boolean> createFlight(@Valid @RequestBody FlightCreateRequest req) {
        return flightService.createFlight(req);
    }

    /**
     * Get Seat Map using Redis BitMap
     * Replaces the heavy DB query in listSeats
     */
    @GetMapping("/{flightId}/seat-map")
    public Result<List<Map<String, Object>>> getSeatMap(@PathVariable Long flightId) {
        // 1. Get from Redis (Structure + BitMap Status)
        List<Seat> seats = seatService.getSeatMap(flightId);
        
        // 2. Map to Frontend Format
        List<Map<String, Object>> data = new ArrayList<>();
        for (Seat s : seats) {
            Map<String, Object> it = new HashMap<>();
            it.put("seatId", String.valueOf(s.getSeatId()));
            it.put("seatNumber", s.getSeatNumber());
            it.put("flightId", s.getFlightId());
            it.put("cabinType", s.getCabinType());
            it.put("status", s.getStatus()); // 1=Available, 2=Occupied
            
            // Parse Row/Col
            Integer rowNumber = null;
            String columnLetter = null;
            if (s.getSeatNumber() != null) {
                String sn = s.getSeatNumber().trim();
                int i = 0;
                while (i < sn.length() && Character.isDigit(sn.charAt(i))) i++;
                if (i > 0) {
                    try { rowNumber = Integer.parseInt(sn.substring(0, i)); } catch (Exception ignore) {}
                }
                if (i < sn.length()) columnLetter = sn.substring(i).toUpperCase();
            }
            it.put("rowNumber", rowNumber);
            it.put("columnLetter", columnLetter);
            
            data.add(it);
        }
        return Result.ok(data);
    }

    @GetMapping("/{flightId}/seats")
    public Result<List<Map<String, Object>>> listSeats(
            @PathVariable Long flightId,
            @RequestParam(required = false) String cabinType) {
        Flight flight = flightMapper.selectById(flightId);
        if (flight == null) {
            return Result.fail(404, "航班不存在");
        }
        Route route = routeMapper.selectById(flight.getRouteId());
        BigDecimal base = route != null ? route.getBasePrice() : null;
        var seatQ = Wrappers.<Seat>lambdaQuery().eq(Seat::getFlightId, flightId);
        if (cabinType != null && !cabinType.isBlank()) {
            seatQ.eq(Seat::getCabinType, cabinType);
        }
        var seats = seatMapper.selectList(seatQ);
        
        // 优化：批量查询配置，避免 N+1 查询
        List<AircraftCabinConfig> allConfigs = configMapper.selectList(new QueryWrapper<AircraftCabinConfig>()
                .eq("model_id", flight.getModelId()));
        Map<String, AircraftCabinConfig> configMap = new HashMap<>();
        if (allConfigs != null) {
            for (AircraftCabinConfig c : allConfigs) {
                configMap.putIfAbsent(c.getCabinType(), c);
            }
        }

        List<Map<String, Object>> data = new ArrayList<>();
        for (Seat s : seats) {
            AircraftCabinConfig cfg = configMap.get(s.getCabinType());
            BigDecimal price = null;
            if (base != null && cfg != null && cfg.getCabinCoefficient() != null) {
                price = base.multiply(cfg.getCabinCoefficient());
            }
            String statusText;
            if (s.getStatus() != null && s.getStatus() == 1)
                statusText = "AVAILABLE";
            else if (s.getStatus() != null && s.getStatus() == 2)
                statusText = "OCCUPIED";
            else if (s.getStatus() != null && s.getStatus() == 3)
                statusText = "RESERVED";
            else
                statusText = "MAINTENANCE";

            Integer rowNumber = null;
            String columnLetter = null;
            if (s.getSeatNumber() != null) {
                String sn = s.getSeatNumber().trim();
                if (!sn.isEmpty()) {
                    int i = 0;
                    while (i < sn.length() && Character.isDigit(sn.charAt(i)))
                        i++;
                    if (i > 0) {
                        try {
                            rowNumber = Integer.parseInt(sn.substring(0, i));
                        } catch (Exception ignore) {
                            rowNumber = null;
                        }
                    }
                    if (i < sn.length()) {
                        columnLetter = sn.substring(i).toUpperCase();
                    }
                }
            }
            Map<String, Object> it = new HashMap<>();
            it.put("seatId", s.getSeatId());
            it.put("seatNumber", s.getSeatNumber());
            // 新口径（与前端选座一致）
            it.put("flightId", s.getFlightId());
            it.put("cabinType", s.getCabinType());
            it.put("rowNumber", rowNumber);
            it.put("columnLetter", columnLetter);
            it.put("status", s.getStatus()); // 1=可用,2=已售,3=锁定
            it.put("orderId", s.getOrderId());
            it.put("version", s.getVersion());

            // 兼容字段（避免老客户端依赖字符串状态）
            it.put("statusText", statusText);
            it.put("classType", s.getCabinType());
            it.put("price", price);
            data.add(it);
        }
        return Result.ok(data);
    }

}
