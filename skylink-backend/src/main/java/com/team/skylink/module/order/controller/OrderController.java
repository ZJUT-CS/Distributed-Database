package com.team.skylink.module.order.controller;

import com.team.skylink.common.Result;
import com.team.skylink.module.order.dto.OrderSearchResponse;
import com.team.skylink.module.order.dto.CreateOrderRequest;
import com.team.skylink.module.order.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

import org.springframework.web.bind.annotation.RequestBody;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping({"/orders", "/api/v1/orders"})
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/search")
    public Result<List<OrderSearchResponse>> search(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long orderNo,
            @RequestParam(required = false) Integer orderStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime createTimeStart,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime createTimeEnd,
            @RequestParam(required = false) String flightNo,
            @RequestParam(required = false) String cabinType
    ) {
        return orderService.search(userId, orderNo, orderStatus, createTimeStart, createTimeEnd, flightNo, cabinType);
    }

    @PostMapping("/create")
    public Result<OrderSearchResponse> create(@Valid @RequestBody CreateOrderRequest req) {
        return orderService.create(req);
    }

    @PostMapping("/{orderId}/cancel")
    public Result<Boolean> cancel(@PathVariable("orderId") Long orderId) {
        return orderService.cancel(orderId);
    }
}
