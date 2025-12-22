package com.team.skylink.module.admin.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.team.skylink.common.PageResult;
import com.team.skylink.common.Result;
import com.team.skylink.module.flight.dto.FlightCreateRequest;
import com.team.skylink.module.flight.entity.Flight;
import com.team.skylink.module.flight.mapper.FlightMapper;
import com.team.skylink.module.flight.service.FlightService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admins/flights")
public class AdminFlightController {

    private final FlightMapper flightMapper;
    private final FlightService flightService;

    public AdminFlightController(FlightMapper flightMapper, FlightService flightService) {
        this.flightMapper = flightMapper;
        this.flightService = flightService;
    }

    // 1. 航班列表
    @GetMapping
    public Result<PageResult<Flight>> list(
            HttpServletRequest request,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String flightNo,
            @RequestParam(required = false) String departureCity,
            @RequestParam(required = false) String arrivalCity
    ) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<PageResult<Flight>>) adminGuard;

        int offset = (page - 1) * size;
        LambdaQueryWrapper<Flight> qw = Wrappers.lambdaQuery();

        if (StringUtils.hasText(keyword)) {
            qw.and(i -> i.like(Flight::getFlightNo, keyword)
                    .or().like(Flight::getDepartureCity, keyword)
                    .or().like(Flight::getArrivalCity, keyword)
                    .or().like(Flight::getDepartureAirport, keyword)
                    .or().like(Flight::getArrivalAirport, keyword));
        }
        if (StringUtils.hasText(flightNo)) qw.like(Flight::getFlightNo, flightNo);
        if (StringUtils.hasText(departureCity)) qw.like(Flight::getDepartureCity, departureCity);
        if (StringUtils.hasText(arrivalCity)) qw.like(Flight::getArrivalCity, arrivalCity);

        // 先查询总数
        Long total = flightMapper.selectCount(qw);

        // 查完总数后，再追加排序规则和分页限制
        qw.orderByDesc(Flight::getDepartureTime);
        qw.last("limit " + offset + "," + size);

        // 最后查询列表数据
        List<Flight> list = flightMapper.selectList(qw);

        return Result.ok(new PageResult<>(total, list));
    }

    // 2. 创建航班
    @PostMapping
    public Result<Boolean> create(HttpServletRequest request, @RequestBody @Valid FlightCreateRequest body) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;

        return flightService.createFlight(body);
    }


    // 4. 修改航班
    @PutMapping("/{flightId}")
    public Result<Boolean> update(HttpServletRequest request, 
                                  @PathVariable Long flightId, 
                                  @RequestBody @Valid FlightCreateRequest body) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;

        // 调用 Service 进行更新
        return flightService.updateFlight(flightId, body);
    }
    
    // 3. 删除航班 (修改点：调用 Service 进行级联删除)
    @DeleteMapping("/{flightId}")
    public Result<Boolean> delete(HttpServletRequest request, @PathVariable Long flightId) {
        Result<?> adminGuard = ensureAdmin(request);
        if (adminGuard != null) return (Result<Boolean>) adminGuard;
        
        // 调用 Service，先删座位，后删航班
        return flightService.deleteFlight(flightId);
    }

    private static Result<?> ensureAdmin(HttpServletRequest request) {
        String t = request.getHeader("X-User-Type");
        // Only allow Type 2 (Admin)
        if (t == null || !"2".equals(t.trim())) {
            return Result.fail(403, "admin required");
        }
        return null;
    }
}
