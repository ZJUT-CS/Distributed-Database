package com.team.skylink.module.payment.controller;

import com.team.skylink.common.Result;
import com.team.skylink.module.payment.dto.ConfirmPaymentRequest;
import com.team.skylink.module.payment.dto.CreatePaymentTokenRequest;
import com.team.skylink.module.payment.dto.CreatePaymentTokenResponse;
import com.team.skylink.module.payment.dto.PaymentSearchResponse;
import com.team.skylink.module.payment.dto.CreatePaymentRequest;
import com.team.skylink.module.payment.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.bind.annotation.RequestBody;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping({"/payments", "/api/v1/payments"})
public class PaymentController {
    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping("/search")
    public Result<List<PaymentSearchResponse>> search(
            @RequestParam(required = false) Long orderNo,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Integer paymentStatus,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime paymentTimeStart,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime paymentTimeEnd
    ) {
        return paymentService.search(orderNo, userId, paymentStatus, paymentMethod, paymentTimeStart, paymentTimeEnd);
    }

    @PostMapping("/confirm-token")
    public Result<CreatePaymentTokenResponse> createConfirmToken(@Valid @RequestBody CreatePaymentTokenRequest req) {
        return paymentService.createConfirmToken(req);
    }

    @PostMapping("/confirm")
    public Result<PaymentSearchResponse> confirmPay(@Valid @RequestBody ConfirmPaymentRequest req) {
        return paymentService.confirmPay(req);
    }

    @PostMapping("/pay")
    public Result<PaymentSearchResponse> pay(@Valid @RequestBody CreatePaymentRequest req) {
        return paymentService.pay(req);
    }
}
