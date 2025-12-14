package com.team.skylink.interfaces.controller;

import com.team.skylink.application.service.ConfigService;
import com.team.skylink.common.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/configs")
public class ConfigController {
    private final ConfigService service;

    public ConfigController(ConfigService service) {
        this.service = service;
    }

    @GetMapping("/count")
    public Result<Long> count() {
        return Result.ok(service.count());
    }
}

