package com.team.skylink.controller;

import com.team.skylink.application.service.OrderService;
import com.team.skylink.application.service.PaymentService;
import com.team.skylink.application.service.RefundRequestService;
import com.team.skylink.common.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/trade")
public class TradeController {
    private final OrderService orderService;
    private final PaymentService paymentService;
    private final RefundRequestService refundRequestService;

    public TradeController(OrderService orderService,
                           PaymentService paymentService,
                           RefundRequestService refundRequestService) {
        this.orderService = orderService;
        this.paymentService = paymentService;
        this.refundRequestService = refundRequestService;
    }

    @GetMapping("/orders/count")
    public Result<Long> orderCount() {
        return Result.ok(orderService.count());
    }

    @GetMapping("/payments/count")
    public Result<Long> paymentCount() {
        return Result.ok(paymentService.count());
    }

    @GetMapping("/refunds/count")
    public Result<Long> refundCount() {
        return Result.ok(refundRequestService.count());
    }
}

