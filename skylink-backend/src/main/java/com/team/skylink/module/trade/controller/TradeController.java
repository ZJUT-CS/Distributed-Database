package com.team.skylink.module.trade.controller;

import com.team.skylink.common.Result;
import com.team.skylink.module.trade.service.TradeService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/trade", "/api/v1/trade"})
public class TradeController {
    private final TradeService tradeService;

    public TradeController(TradeService tradeService) {
        this.tradeService = tradeService;
    }

    @GetMapping("/orders/count")
    public Result<Long> orderCount() {
        return tradeService.orderCount();
    }

    @GetMapping("/payments/count")
    public Result<Long> paymentCount() {
        return tradeService.paymentCount();
    }

    @GetMapping("/refunds/count")
    public Result<Long> refundCount() {
        return tradeService.refundCount();
    }
}
