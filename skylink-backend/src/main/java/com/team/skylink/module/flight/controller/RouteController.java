package com.team.skylink.module.flight.controller;

import com.team.skylink.common.Result;
import com.team.skylink.module.flight.dto.RouteDictResponse;
import com.team.skylink.module.flight.entity.Route;
import com.team.skylink.module.flight.service.RouteService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/v1/routes")
public class RouteController {

    private final RouteService routeService;

    public RouteController(RouteService routeService) {
        this.routeService = routeService;
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
}
