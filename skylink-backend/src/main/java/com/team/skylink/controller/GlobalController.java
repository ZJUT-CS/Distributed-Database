package com.team.skylink.controller;

import com.team.skylink.application.service.FlightService;
import com.team.skylink.application.service.SeatService;
import com.team.skylink.common.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/global")
public class GlobalController {
    private final FlightService flightService;
    private final SeatService seatService;

    public GlobalController(FlightService flightService, SeatService seatService) {
        this.flightService = flightService;
        this.seatService = seatService;
    }

    @GetMapping("/flights/count")
    public Result<Long> flightCount() {
        return Result.ok(flightService.count());
    }

    @GetMapping("/seats/count")
    public Result<Long> seatCount() {
        return Result.ok(seatService.count());
    }
}

