package com.team.skylink.interfaces.controller;

import com.team.skylink.application.service.RefundRequestService;
import com.team.skylink.common.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/refund-requests")
public class RefundRequestController {
    private final RefundRequestService service;

    public RefundRequestController(RefundRequestService service) {
        this.service = service;
    }

    @GetMapping("/count")
    public Result<Long> count() {
        return Result.ok(service.count());
    }
}

