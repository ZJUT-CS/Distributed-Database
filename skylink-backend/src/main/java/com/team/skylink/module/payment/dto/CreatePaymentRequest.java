package com.team.skylink.module.payment.dto;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

@Data
public class CreatePaymentRequest {
    @NotNull(message = "orderNo is required")
    private String orderNo;

    @NotNull(message = "amount is required")
    @Positive(message = "amount must be > 0")
    private BigDecimal amount;

    @NotBlank(message = "method is required")
    private String method;
}

