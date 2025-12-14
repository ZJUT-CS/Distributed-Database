package com.team.skylink.interfaces.controller;

import com.team.skylink.application.service.OrderService;
import com.team.skylink.common.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/orders")
public class OrderController {
    private final OrderService service;

    public OrderController(OrderService service) {
        this.service = service;
    }

    @GetMapping("/count")
    public Result<Long> count() {
        return Result.ok(service.count());
    }
}

