package com.team.skylink.module.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ConfirmPaymentRequest {
    @NotNull(message = "orderNo is required")
    private String orderNo;

    @NotNull(message = "amount is required")
    @Positive(message = "amount must be > 0")
    private BigDecimal amount;

    @NotNull(message = "timestamp is required")
    private Long timestamp;

    @NotBlank(message = "token is required")
    private String token;

    @NotBlank(message = "method is required")
    private String method;
}

