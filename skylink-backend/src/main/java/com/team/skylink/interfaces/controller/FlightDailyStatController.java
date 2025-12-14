package com.team.skylink.interfaces.controller;

import com.team.skylink.application.service.FlightDailyStatService;
import com.team.skylink.common.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/flight-daily-stats")
public class FlightDailyStatController {
    private final FlightDailyStatService service;

    public FlightDailyStatController(FlightDailyStatService service) {
        this.service = service;
    }

    @GetMapping("/count")
    public Result<Long> count() {
        return Result.ok(service.count());
    }
}

