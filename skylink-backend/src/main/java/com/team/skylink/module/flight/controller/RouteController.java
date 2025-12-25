package com.team.skylink.module.flight.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.team.skylink.common.Result;
import com.team.skylink.module.flight.dto.CityDictResponse;
import com.team.skylink.module.flight.dto.RouteDictResponse;
import com.team.skylink.module.flight.entity.Flight;
import com.team.skylink.module.flight.entity.Route;
import com.team.skylink.module.flight.mapper.FlightMapper;
import com.team.skylink.module.flight.service.RouteService;
import com.team.skylink.module.order.entity.Orders;
import com.team.skylink.module.order.mapper.OrderMapper;
import com.team.skylink.module.payment.entity.Payment;
import com.team.skylink.module.payment.mapper.PaymentMapper;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/routes")
public class RouteController {

    private final RouteService routeService;
    private final OrderMapper orderMapper;
    private final PaymentMapper paymentMapper;
    private final FlightMapper flightMapper;

    public RouteController(
            RouteService routeService,
            OrderMapper orderMapper,
            PaymentMapper paymentMapper,
            FlightMapper flightMapper
    ) {
        this.routeService = routeService;
        this.orderMapper = orderMapper;
        this.paymentMapper = paymentMapper;
        this.flightMapper = flightMapper;
    }

    /**
     * 航线字典（精简版）。
     * - 适用于地图/下拉框等需要 routeId + 出发/到达信息的场景
     * - 不下发 basePrice（避免不必要的敏感字段暴露）
     *
     * 注意：目前系统已有 @Cacheable 基础设施（见 FlightController.search），这里同样使用缓存。
     */
    @GetMapping("/dict")
    @Cacheable(cacheNames = "routeDict", key = "'v1'")
    public Result<RouteDictResponse> dict() {
        List<Route> all = routeService.getAllRoutes();

        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDate start7 = today.minusDays(6);
        LocalDateTime start7Time = start7.atStartOfDay();

        Map<Long, BigDecimal> routeGmv = new HashMap<>();
        Map<Long, Long> routeOrderCount = new HashMap<>();
        Map<Long, BigDecimal> routeTotalPrice = new HashMap<>();
        Map<Long, Integer> routeActiveFlights = new HashMap<>();
        Map<Long, Long> flightToRoute = new HashMap<>();

        QueryWrapper<Orders> orderQ = new QueryWrapper<Orders>()
                .eq("order_status", 2)
                .ge("pay_time", start7Time)
                .lt("pay_time", now)
                .select("flight_id", "total_amount");
        List<Orders> orders7d = orderMapper.selectList(orderQ);

        for (Orders o : orders7d) {
            if (o.getFlightId() == null) continue;
            BigDecimal amount = o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO;
            routeOrderCount.put(o.getFlightId(), routeOrderCount.getOrDefault(o.getFlightId(), 0L) + 1);
            routeTotalPrice.put(o.getFlightId(), routeTotalPrice.getOrDefault(o.getFlightId(), BigDecimal.ZERO).add(amount));
        }

        List<Long> flightIds = orders7d.stream().map(Orders::getFlightId).filter(f -> f != null).distinct().toList();
        if (!flightIds.isEmpty()) {
            List<Flight> flights = flightMapper.selectBatchIds(flightIds);
            for (Flight f : flights) {
                flightToRoute.put(f.getFlightId(), f.getRouteId());
            }
        }

        for (Map.Entry<Long, BigDecimal> entry : routeTotalPrice.entrySet()) {
            Long flightId = entry.getKey();
            Long routeId = flightToRoute.get(flightId);
            if (routeId != null) {
                routeGmv.put(routeId, routeGmv.getOrDefault(routeId, BigDecimal.ZERO).add(entry.getValue()));
            }
        }

        QueryWrapper<Flight> flightQ = new QueryWrapper<Flight>()
                .in("status", List.of(1, 3, 4))
                .ge("departure_time", now)
                .lt("departure_time", now.plusHours(24));
        List<Flight> activeFlights = flightMapper.selectList(flightQ);
        for (Flight f : activeFlights) {
            Long routeId = f.getRouteId();
            if (routeId != null) {
                routeActiveFlights.put(routeId, routeActiveFlights.getOrDefault(routeId, 0) + 1);
            }
        }

        RouteDictResponse resp = new RouteDictResponse();
        List<RouteDictResponse.RouteItem> items = new ArrayList<>();

        LocalDateTime maxUpdate = null;
        Long maxId = null;

        if (all != null) {
            for (Route r : all) {
                if (r == null) continue;

                RouteDictResponse.RouteItem it = new RouteDictResponse.RouteItem();
                it.setRouteId(r.getRouteId());
                it.setDepartureCity(r.getDepartureCity());
                it.setDepartureAirport(r.getDepartureAirport());
                it.setArrivalCity(r.getArrivalCity());
                it.setArrivalAirport(r.getArrivalAirport());
                it.setEstimatedDuration(r.getEstimatedDuration());
                it.setDistanceKm(r.getDistanceKm());
                it.setUpdateTime(r.getUpdateTime());

                Long totalOrders = routeOrderCount.values().stream()
                        .filter(flightId -> flightToRoute.get(flightId) != null && flightToRoute.get(flightId).equals(r.getRouteId()))
                        .mapToLong(v -> v)
                        .sum();
                it.setOrderCount(totalOrders);
                it.setGmv(routeGmv.getOrDefault(r.getRouteId(), BigDecimal.ZERO));

                if (totalOrders > 0) {
                    BigDecimal totalAmount = routeTotalPrice.values().stream()
                            .filter(flightId -> flightToRoute.get(flightId) != null && flightToRoute.get(flightId).equals(r.getRouteId()))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    it.setAvgPrice(totalAmount.divide(BigDecimal.valueOf(totalOrders), 0, RoundingMode.HALF_UP));
                } else {
                    it.setAvgPrice(BigDecimal.ZERO);
                }

                it.setActiveFlights(routeActiveFlights.getOrDefault(r.getRouteId(), 0));

                Integer dist = r.getDistanceKm();
                if (dist != null && dist >= 1500) {
                    it.setRouteLevel("MAIN");
                } else if (dist != null && dist >= 500) {
                    it.setRouteLevel("REGIONAL");
                } else {
                    it.setRouteLevel("LOCAL");
                }

                items.add(it);

                if (r.getUpdateTime() != null) {
                    if (maxUpdate == null || r.getUpdateTime().isAfter(maxUpdate)) {
                        maxUpdate = r.getUpdateTime();
                    }
                }
                if (r.getRouteId() != null) {
                    if (maxId == null || r.getRouteId() > maxId) {
                        maxId = r.getRouteId();
                    }
                }
            }
        }

        items.sort(Comparator.comparing(RouteDictResponse.RouteItem::getRouteId, Comparator.nullsLast(Long::compareTo)));
        resp.setRoutes(items);

        if (maxUpdate != null) {
            resp.setVersion("ut:" + maxUpdate);
        } else if (maxId != null) {
            resp.setVersion("id:" + maxId);
        } else {
            resp.setVersion("empty");
        }

        return Result.ok(resp);
    }

    @GetMapping("/cities/dict")
    @Cacheable(cacheNames = "cityDict", key = "'v1'")
    public Result<CityDictResponse> cityDict() {
        List<Route> all = routeService.getAllRoutes();

        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDate start7 = today.minusDays(6);
        LocalDateTime start7Time = start7.atStartOfDay();

        Map<String, Long> cityDepartureCount = new HashMap<>();
        Map<String, BigDecimal> cityGmv = new HashMap<>();
        Map<String, Integer> cityCurrentLoad = new HashMap<>();
        Map<String, String> cityMainAirport = new HashMap<>();
        Map<Long, String> flightIdToCity = new HashMap<>();

        for (Route r : all) {
            if (r.getDepartureCity() != null) {
                cityMainAirport.putIfAbsent(r.getDepartureCity(), r.getDepartureAirport());
            }
        }

        QueryWrapper<Flight> flightQ = new QueryWrapper<Flight>()
                .ge("departure_time", todayStart)
                .lt("departure_time", today.plusDays(1).atStartOfDay())
                .select("flight_id", "departure_city", "total_seats");
        List<Flight> todayFlights = flightMapper.selectList(flightQ);
        for (Flight f : todayFlights) {
            String city = f.getDepartureCity();
            if (city != null) {
                cityDepartureCount.put(city, cityDepartureCount.getOrDefault(city, 0L) + 1);
                if (f.getTotalSeats() != null) {
                    cityCurrentLoad.put(city, cityCurrentLoad.getOrDefault(city, 0) + f.getTotalSeats());
                }
                flightIdToCity.put(f.getFlightId(), city);
            }
        }

        QueryWrapper<Orders> orderQ = new QueryWrapper<Orders>()
                .eq("order_status", 2)
                .ge("pay_time", start7Time)
                .lt("pay_time", now)
                .select("flight_id", "total_amount");
        List<Orders> orders7d = orderMapper.selectList(orderQ);

        for (Orders o : orders7d) {
            Long flightId = o.getFlightId();
            if (flightId == null) continue;
            String city = flightIdToCity.get(flightId);
            if (city != null) {
                BigDecimal amount = o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO;
                cityGmv.put(city, cityGmv.getOrDefault(city, BigDecimal.ZERO).add(amount));
            }
        }

        CityDictResponse resp = new CityDictResponse();
        List<CityDictResponse.CityItem> items = new ArrayList<>();

        for (Map.Entry<String, Long> entry : cityDepartureCount.entrySet()) {
            String cityName = entry.getKey();
            CityDictResponse.CityItem it = new CityDictResponse.CityItem();
            it.setCityName(cityName);
            it.setMainAirport(cityMainAirport.get(cityName));
            it.setDailyDepartures(entry.getValue().intValue());
            it.setWeeklyGmv(cityGmv.getOrDefault(cityName, BigDecimal.ZERO));
            it.setCurrentLoad(BigDecimal.valueOf(cityCurrentLoad.getOrDefault(cityName, 0)));

            int dep = entry.getValue().intValue();
            if (dep >= 50) {
                it.setAlertLevel("LOW");
            } else if (dep >= 20) {
                it.setAlertLevel("NORMAL");
            } else if (dep >= 5) {
                it.setAlertLevel("HIGH");
            } else {
                it.setAlertLevel("CRITICAL");
            }

            items.add(it);
        }

        items.sort(Comparator.comparing(CityDictResponse.CityItem::getCityName));
        resp.setCities(items);
        resp.setVersion("v1");

        return Result.ok(resp);
    }
}
