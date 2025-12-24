package com.team.skylink.module.admin.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.team.skylink.common.PageResult;
import com.team.skylink.common.Result;
import com.team.skylink.module.flight.entity.Route;
import com.team.skylink.module.flight.mapper.RouteMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admins/routes")
public class AdminRouteController {

    private final RouteMapper routeMapper;

    public AdminRouteController(RouteMapper routeMapper) {
        this.routeMapper = routeMapper;
    }

    @GetMapping
    public Result<PageResult<Route>> list(
            HttpServletRequest request,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String departureCity,
            @RequestParam(required = false) String arrivalCity
    ) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<PageResult<Route>>) adminGuard;

        int offset = (page - 1) * size;
        LambdaQueryWrapper<Route> qw = Wrappers.lambdaQuery();

        if (StringUtils.hasText(keyword)) {
            qw.and(i -> i.like(Route::getDepartureCity, keyword)
                    .or().like(Route::getArrivalCity, keyword)
                    .or().like(Route::getDepartureAirport, keyword)
                    .or().like(Route::getArrivalAirport, keyword));
        }
        if (StringUtils.hasText(departureCity)) qw.like(Route::getDepartureCity, departureCity);
        if (StringUtils.hasText(arrivalCity)) qw.like(Route::getArrivalCity, arrivalCity);

        Long total = routeMapper.selectCount(qw);
        qw.orderByDesc(Route::getRouteId);
        qw.last("limit " + offset + "," + size);
        List<Route> list = routeMapper.selectList(qw);

        return Result.ok(new PageResult<>(total, list));
    }

    @PostMapping
    public Result<Route> create(HttpServletRequest request, @RequestBody Route body) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Route>) adminGuard;

        if (body == null) return Result.fail(400, "missing body");
        if (!StringUtils.hasText(body.getDepartureCity())) return Result.fail(400, "missing departureCity");
        if (!StringUtils.hasText(body.getDepartureAirport())) return Result.fail(400, "missing departureAirport");
        if (!StringUtils.hasText(body.getArrivalCity())) return Result.fail(400, "missing arrivalCity");
        if (!StringUtils.hasText(body.getArrivalAirport())) return Result.fail(400, "missing arrivalAirport");
        if (body.getBasePrice() == null || body.getBasePrice().compareTo(BigDecimal.ZERO) <= 0) return Result.fail(400, "invalid basePrice");

        Route r = new Route();
        r.setDepartureCity(body.getDepartureCity().trim());
        r.setDepartureAirport(body.getDepartureAirport().trim().toUpperCase());
        r.setArrivalCity(body.getArrivalCity().trim());
        r.setArrivalAirport(body.getArrivalAirport().trim().toUpperCase());
        r.setBasePrice(body.getBasePrice());
        r.setEstimatedDuration(body.getEstimatedDuration());
        r.setDistanceKm(body.getDistanceKm());
        routeMapper.insert(r);
        return Result.ok(r);
    }

    @PutMapping("/{routeId}")
    public Result<Boolean> update(HttpServletRequest request, @PathVariable("routeId") Long routeId, @RequestBody Route body) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;

        if (routeId == null) return Result.fail(400, "missing routeId");
        if (body == null) return Result.ok(Boolean.TRUE);

        LambdaUpdateWrapper<Route> uw = Wrappers.lambdaUpdate();
        uw.eq(Route::getRouteId, routeId);
        boolean hasAny = false;

        if (body.getDepartureCity() != null) {
            uw.set(Route::getDepartureCity, StringUtils.hasText(body.getDepartureCity()) ? body.getDepartureCity().trim() : null);
            hasAny = true;
        }
        if (body.getDepartureAirport() != null) {
            uw.set(Route::getDepartureAirport, StringUtils.hasText(body.getDepartureAirport()) ? body.getDepartureAirport().trim().toUpperCase() : null);
            hasAny = true;
        }
        if (body.getArrivalCity() != null) {
            uw.set(Route::getArrivalCity, StringUtils.hasText(body.getArrivalCity()) ? body.getArrivalCity().trim() : null);
            hasAny = true;
        }
        if (body.getArrivalAirport() != null) {
            uw.set(Route::getArrivalAirport, StringUtils.hasText(body.getArrivalAirport()) ? body.getArrivalAirport().trim().toUpperCase() : null);
            hasAny = true;
        }
        if (body.getBasePrice() != null) {
            if (body.getBasePrice().compareTo(BigDecimal.ZERO) <= 0) return Result.fail(400, "invalid basePrice");
            uw.set(Route::getBasePrice, body.getBasePrice());
            hasAny = true;
        }
        if (body.getEstimatedDuration() != null) {
            uw.set(Route::getEstimatedDuration, body.getEstimatedDuration());
            hasAny = true;
        }
        if (body.getDistanceKm() != null) {
            uw.set(Route::getDistanceKm, body.getDistanceKm());
            hasAny = true;
        }

        if (!hasAny) return Result.ok(Boolean.TRUE);
        int updated = routeMapper.update(null, uw);
        return Result.ok(updated > 0);
    }

    @DeleteMapping("/{routeId}")
    public Result<Boolean> delete(HttpServletRequest request, @PathVariable("routeId") Long routeId) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;

        if (routeId == null) return Result.fail(400, "missing routeId");
        int deleted = routeMapper.deleteById(routeId);
        return Result.ok(deleted > 0);
    }

    private static Result<?> ensureAdmin(HttpServletRequest request) {
        String t = request.getHeader("X-User-Type");
        if (t == null || !"2".equals(t.trim())) {
            return Result.fail(403, "admin required");
        }
        return null;
    }
}
