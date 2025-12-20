package com.team.skylink.module.system.controller;

import com.team.skylink.common.Result;
import com.team.skylink.module.system.service.GlobalService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/global", "/api/v1/global"})
public class GlobalController {
    private final GlobalService globalService;

    public GlobalController(GlobalService globalService) {
        this.globalService = globalService;
    }

    @GetMapping("/flights/count")
    public Result<Long> flightCount() {
        return globalService.flightCount();
    }

}
