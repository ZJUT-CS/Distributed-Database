package com.team.skylink.module.payment.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreatePaymentTokenRequest {
    @NotNull(message = "orderNo is required")
    private String orderNo;

    @NotNull(message = "amount is required")
    @Positive(message = "amount must be > 0")
    private BigDecimal amount;
}

