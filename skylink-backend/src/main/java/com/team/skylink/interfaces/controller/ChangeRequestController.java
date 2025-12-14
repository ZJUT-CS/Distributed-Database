package com.team.skylink.interfaces.controller;

import com.team.skylink.application.service.ChangeRequestService;
import com.team.skylink.common.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/change-requests")
public class ChangeRequestController {
    private final ChangeRequestService service;

    public ChangeRequestController(ChangeRequestService service) {
        this.service = service;
    }

    @GetMapping("/count")
    public Result<Long> count() {
        return Result.ok(service.count());
    }
}

