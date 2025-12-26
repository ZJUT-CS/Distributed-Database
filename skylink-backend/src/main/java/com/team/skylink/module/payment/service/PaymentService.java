package com.team.skylink.module.payment.service;

import com.team.skylink.common.Result;
import com.team.skylink.common.PageResult;
import com.team.skylink.module.payment.dto.ConfirmPaymentRequest;
import com.team.skylink.module.payment.dto.CreatePaymentRequest;
import com.team.skylink.module.payment.dto.CreatePaymentTokenRequest;
import com.team.skylink.module.payment.dto.CreatePaymentTokenResponse;
import com.team.skylink.module.payment.dto.PaymentSearchResponse;

import java.time.LocalDateTime;
import java.util.List;

public interface PaymentService {
    Result<PageResult<PaymentSearchResponse>> search(
            Long orderNo,
            Long userId,
            Integer paymentStatus,
            String paymentMethod,
            LocalDateTime paymentTimeStart,
            LocalDateTime paymentTimeEnd,
            int page,
            int size
    );

    Result<PageResult<PaymentSearchResponse>> searchPage(
        Long orderNo,
        Long userId,
        Integer paymentStatus,
        String paymentMethod,
        LocalDateTime paymentTimeStart,
        LocalDateTime paymentTimeEnd,
        Integer page,
        Integer size
    );

    Result<CreatePaymentTokenResponse> createConfirmToken(CreatePaymentTokenRequest req);

    Result<PaymentSearchResponse> confirmPay(ConfirmPaymentRequest req);

    Result<PaymentSearchResponse> pay(CreatePaymentRequest req);
}

