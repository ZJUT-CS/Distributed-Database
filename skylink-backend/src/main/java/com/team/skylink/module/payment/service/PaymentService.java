package com.team.skylink.module.payment.service;

import com.team.skylink.common.Result;
import com.team.skylink.module.payment.dto.ConfirmPaymentRequest;
import com.team.skylink.module.payment.dto.CreatePaymentRequest;
import com.team.skylink.module.payment.dto.CreatePaymentTokenRequest;
import com.team.skylink.module.payment.dto.CreatePaymentTokenResponse;
import com.team.skylink.module.payment.dto.PaymentSearchResponse;

import java.time.LocalDateTime;
import java.util.List;

public interface PaymentService {
    Result<List<PaymentSearchResponse>> search(
            Long orderNo,
            Long userId,
            Integer paymentStatus,
            String paymentMethod,
            LocalDateTime paymentTimeStart,
            LocalDateTime paymentTimeEnd
    );

    Result<CreatePaymentTokenResponse> createConfirmToken(CreatePaymentTokenRequest req);

    Result<PaymentSearchResponse> confirmPay(ConfirmPaymentRequest req);

    Result<PaymentSearchResponse> pay(CreatePaymentRequest req);
}

