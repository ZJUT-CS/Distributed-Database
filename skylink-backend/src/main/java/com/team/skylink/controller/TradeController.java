package com.team.skylink.controller;

import com.team.skylink.common.Result;
import com.team.skylink.mapper.OrderMapper;
import com.team.skylink.mapper.PaymentMapper;
import com.team.skylink.mapper.RefundRequestMapper;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/trade")
public class TradeController {
    private final OrderMapper orderMapper;
    private final PaymentMapper paymentMapper;
    private final RefundRequestMapper refundRequestMapper;

    public TradeController(OrderMapper orderMapper,
                           PaymentMapper paymentMapper,
                           RefundRequestMapper refundRequestMapper) {
        this.orderMapper = orderMapper;
        this.paymentMapper = paymentMapper;
        this.refundRequestMapper = refundRequestMapper;
    }

    @GetMapping("/orders/count")
    public Result<Long> orderCount() {
        return Result.ok(orderMapper.selectCount(null));
    }

    @GetMapping("/payments/count")
    public Result<Long> paymentCount() {
        return Result.ok(paymentMapper.selectCount(null));
    }

    @GetMapping("/refunds/count")
    public Result<Long> refundCount() {
        return Result.ok(refundRequestMapper.selectCount(null));
    }
}
