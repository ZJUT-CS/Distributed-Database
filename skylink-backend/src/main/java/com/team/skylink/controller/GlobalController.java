package com.team.skylink.controller;

import com.team.skylink.common.Result;
import com.team.skylink.mapper.FlightMapper;
import com.team.skylink.mapper.SeatMapper;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/global")
public class GlobalController {
    private final FlightMapper flightMapper;
    private final SeatMapper seatMapper;

    public GlobalController(FlightMapper flightMapper, SeatMapper seatMapper) {
        this.flightMapper = flightMapper;
        this.seatMapper = seatMapper;
    }

    @GetMapping("/flights/count")
    public Result<Long> flightCount() {
        return Result.ok(flightMapper.selectCount(null));
    }

    @GetMapping("/seats/count")
    public Result<Long> seatCount() {
        return Result.ok(seatMapper.selectCount(null));
    }
}
