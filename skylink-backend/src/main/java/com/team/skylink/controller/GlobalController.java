package com.team.skylink.controller;

import com.team.skylink.common.Result;
import com.team.skylink.mapper.FlightMapper;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/global", "/api/v1/global"})
public class GlobalController {
    private final FlightMapper flightMapper;

    public GlobalController(FlightMapper flightMapper) {
        this.flightMapper = flightMapper;
    }

    @GetMapping("/flights/count")
    public Result<Long> flightCount() {
        return Result.ok(flightMapper.selectCount(null));
    }

}
